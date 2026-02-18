/**
 * Game loop — one tick: update positions, spawn, collide, near-miss, score.
 * Pure logic; no React. Call from requestAnimationFrame or similar.
 */

import type { Player, Obstacle, Coin, Lane } from './types';
import { checkCollision } from './collision';
import { updateNearMiss } from './nearMiss';
import { createObstacle, shouldSpawn } from './spawner';
import { createCoin, checkCoinCollect } from './coins';
import { getObstacleSpeed } from './difficulty';
import {
  LANE_LEFT,
  LANE_RIGHT,
  PLAYER_RADIUS,
  PLAYER_CENTER_Y_FRACTION,
  OBSTACLE_HEIGHT,
  COIN_SPAWN_INTERVAL_MS,
  COIN_FIRST_SPAWN_DELAY_MS,
  COIN_WIDTH,
  COIN_HEIGHT,
  COIN_OBSTACLE_SPAWN_MARGIN,
  SPAWN_OTHER_LANE_TOP_ZONE_Y,
  MAX_CONSECUTIVE_OBSTACLES_SAME_LANE,
} from './constants';

export interface GameLoopState {
  phase: 'playing' | 'paused' | 'game_over';
  player: Player;
  obstacles: Obstacle[];
  coins: Coin[];
  score: number;
  /** Accumulated ms for survival score (1 point per 100ms) */
  accumulatedScoreMs: number;
  lastSpawnTime: number;
  /** Lane of the last spawned obstacle; used to limit consecutive same-lane spawns. */
  lastSpawnLane: Lane | null;
  /** How many obstacles in a row were spawned in lastSpawnLane. */
  consecutiveSpawnsInSameLane: number;
  lastCoinSpawnTime: number;
  obstacleSpeed: number;
  gameTimeMs: number;
  /** Lane center X positions [left, right] */
  laneCenterX: [number, number];
  screenHeight: number;
  /** Near-miss streak (0–5); when 5, activate 2x coins for 20s. Only counts outside bonus. */
  nearMissStreak: number;
  /** Timestamp (ms) until which 2x coins spawn is active; 0 = inactive */
  coinMultiplierActiveUntil: number;
}

export interface TickResult {
  phase: 'playing' | 'paused' | 'game_over';
  score: number;
  nearMissIds: string[];
  /** True if an obstacle passed below the player without triggering near-miss → reset streak */
  obstaclePassedWithoutNearMiss: boolean;
  collided: boolean;
  collidedObstacleId: string | null;
  coinsCollected: number;
}

/**
 * Run one tick. Mutates state. Returns result for UI (score, near-miss, game over).
 */
export function tick(
  state: GameLoopState,
  deltaMs: number,
  currentTimeMs: number
): TickResult {
  const cappedDelta = Math.min(deltaMs, 100);
  const nearMissIds: string[] = [];
  let collided = false;

  let collidedObstacleId: string | null = null;
  let coinsCollected = 0;

  let obstaclePassedWithoutNearMiss = false;

  if (state.phase !== 'playing') {
    return {
      phase: state.phase,
      score: state.score,
      nearMissIds: [],
      obstaclePassedWithoutNearMiss: false,
      collided: false,
      collidedObstacleId: null,
      coinsCollected: 0,
    };
  }

  const playerCenterX = state.laneCenterX[state.player.lane];

  // 1. Update obstacle and coin positions (speed from score + time)
  state.obstacleSpeed = getObstacleSpeed(state.score, state.gameTimeMs);
  const deltaSec = cappedDelta / 1000;
  for (const obs of state.obstacles) {
    obs.y += state.obstacleSpeed * deltaSec;
  }
  for (const coin of state.coins) {
    coin.y += state.obstacleSpeed * deltaSec;
  }

  // 2. Remove obstacles and coins below screen
  state.obstacles = state.obstacles.filter(
    (obs) => obs.y + obs.height < state.screenHeight + 50
  );
  state.coins = state.coins.filter(
    (c) => c.y + c.height < state.screenHeight + 50
  );

  // 3. Spawn obstacles
  if (shouldSpawn(state.lastSpawnTime, currentTimeMs, state.score)) {
    const TOP_ZONE_Y = 120;
    const coinInTop = state.coins.find((c) => c.y < TOP_ZONE_Y);
    const laneWithCoinInTop = coinInTop ? coinInTop.lane : null;

    // 1) Cap consecutive same-lane spawns so we don't get 5+ in one lane.
    const mustSwitchLane =
      state.lastSpawnLane !== null &&
      state.consecutiveSpawnsInSameLane >= MAX_CONSECUTIVE_OBSTACLES_SAME_LANE;
    let lane: Lane;
    if (mustSwitchLane) {
      lane = state.lastSpawnLane === LANE_LEFT ? LANE_RIGHT : LANE_LEFT;
    } else {
      if (laneWithCoinInTop === null) {
        lane = Math.random() < 0.5 ? LANE_LEFT : LANE_RIGHT;
      } else {
        lane = laneWithCoinInTop === LANE_LEFT ? LANE_RIGHT : LANE_LEFT;
      }
      // Avoid impossible dodge: if the other lane has an obstacle in the top zone, spawn in that lane instead so we don't block both lanes at the same level.
      const otherLane = lane === LANE_LEFT ? LANE_RIGHT : LANE_LEFT;
      const otherLaneHasObstacleInTop = state.obstacles.some(
        (obs) => obs.lane === otherLane && obs.y < SPAWN_OTHER_LANE_TOP_ZONE_Y
      );
      if (otherLaneHasObstacleInTop) {
        lane = otherLane;
      }
    }

    const laneX = state.laneCenterX[lane];
    const halfW = 30;
    const newObs = createObstacle(
      lane,
      laneX - halfW,
      -OBSTACLE_HEIGHT
    );
    state.obstacles.push(newObs);
    state.lastSpawnTime = currentTimeMs;
    const prevLane = state.lastSpawnLane;
    state.lastSpawnLane = lane;
    state.consecutiveSpawnsInSameLane =
      prevLane === lane ? state.consecutiveSpawnsInSameLane + 1 : 1;
  }

  // 4. Spawn coins — during 2x bonus, interval is half (spawn 2x more often, one coin per spawn)
  const coinMultiplierActive =
    state.coinMultiplierActiveUntil > 0 &&
    currentTimeMs < state.coinMultiplierActiveUntil;
  const coinIntervalMs = coinMultiplierActive
    ? COIN_SPAWN_INTERVAL_MS / 2
    : COIN_SPAWN_INTERVAL_MS;

  if (
    state.gameTimeMs >= COIN_FIRST_SPAWN_DELAY_MS &&
    currentTimeMs - state.lastCoinSpawnTime >= coinIntervalMs
  ) {
    const TOP_ZONE_Y = 120;
    const obstaclesInTopByLane: [Lane, number][] = [
      [LANE_LEFT, 0],
      [LANE_RIGHT, 0],
    ];
    for (const obs of state.obstacles) {
      if (obs.y < TOP_ZONE_Y) {
        if (obs.lane === LANE_LEFT) obstaclesInTopByLane[0][1]++;
        else obstaclesInTopByLane[1][1]++;
      }
    }

    const pickLane = (): Lane => {
      if (obstaclesInTopByLane[0][1] === 0 && obstaclesInTopByLane[1][1] === 0) {
        return Math.random() < 0.5 ? LANE_LEFT : LANE_RIGHT;
      }
      if (obstaclesInTopByLane[0][1] === 0) return LANE_LEFT;
      if (obstaclesInTopByLane[1][1] === 0) return LANE_RIGHT;
      return obstaclesInTopByLane[0][1] <= obstaclesInTopByLane[1][1]
        ? LANE_LEFT
        : LANE_RIGHT;
    };

    const coinSpawnY = -COIN_HEIGHT;

    const rectsOverlap = (
      r1x: number, r1y: number, r1w: number, r1h: number,
      r2x: number, r2y: number, r2w: number, r2h: number
    ): boolean =>
      r1x < r2x + r2w && r1x + r1w > r2x && r1y < r2y + r2h && r1y + r1h > r2y;

    // Check if coin would overlap (or get too close to) any obstacle in the lane.
    // Use a margin so we never spawn with coin partly inside obstacle.
    const laneHasObstacleOverlap = (l: Lane): boolean => {
      const coinX = state.laneCenterX[l] - COIN_WIDTH / 2;
      const m = COIN_OBSTACLE_SPAWN_MARGIN;
      const cx = coinX - m;
      const cy = coinSpawnY - m;
      const cw = COIN_WIDTH + 2 * m;
      const ch = COIN_HEIGHT + 2 * m;
      return state.obstacles.some(
        (obs) =>
          obs.lane === l &&
          rectsOverlap(cx, cy, cw, ch, obs.x, obs.y, obs.width, obs.height)
      );
    };

    let lane: Lane | null = pickLane();
    if (laneHasObstacleOverlap(lane)) {
      const otherLane = lane === LANE_LEFT ? LANE_RIGHT : LANE_LEFT;
      if (!laneHasObstacleOverlap(otherLane)) {
        lane = otherLane;
      } else {
        lane = null;
      }
    }

    if (lane !== null) {
      const laneX = state.laneCenterX[lane];
      state.coins.push(
        createCoin(lane, laneX - COIN_WIDTH / 2, coinSpawnY)
      );
    }
    state.lastCoinSpawnTime = currentTimeMs;
  }

  // 5. Coin collection (before collision)
  state.coins = state.coins.filter((coin) => {
    if (checkCoinCollect(state.player, playerCenterX, coin)) {
      coinsCollected += 1;
      return false;
    }
    return true;
  });

  // 6. Collision (strict overlap only) — hook may consume shield and remove obstacle
  for (const obs of state.obstacles) {
    if (checkCollision(state.player, playerCenterX, obs)) {
      collided = true;
      collidedObstacleId = obs.id;
      state.phase = 'game_over';
      break;
    }
  }

  // 7. Near-miss only when no collision this frame
  if (!collided) {
    const awarded = updateNearMiss(
      state.player,
      playerCenterX,
      state.obstacles,
      state.player.centerY
    );
    nearMissIds.push(...awarded);
    const playerY = state.player.centerY;
    for (const obs of state.obstacles) {
      const obsBottom = obs.y + obs.height;
      if (
        obsBottom > playerY &&
        obsBottom < playerY + 60 &&
        !obs.nearMissAwarded
      ) {
        obstaclePassedWithoutNearMiss = true;
        break;
      }
    }
  }

  // 8. Score: survival (accumulate ms, 1 point per 100ms) + near-miss bonus
  state.gameTimeMs += cappedDelta;
  state.accumulatedScoreMs += cappedDelta;
  while (state.accumulatedScoreMs >= 100) {
    state.score += 1;
    state.accumulatedScoreMs -= 100;
  }
  const nearMissBonus = 50;
  state.score += nearMissIds.length * nearMissBonus;

  return {
    phase: state.phase,
    score: state.score,
    nearMissIds,
    obstaclePassedWithoutNearMiss,
    collided,
    collidedObstacleId,
    coinsCollected,
  };
}

/** Remove obstacle by id (e.g. after shield consumed). */
export function removeObstacleById(state: GameLoopState, id: string): void {
  state.obstacles = state.obstacles.filter((o) => o.id !== id);
  state.phase = 'playing';
}

export function createInitialPlayer(
  screenHeight: number,
  lane?: Lane
): Player {
  return {
    lane: lane ?? (Math.random() < 0.5 ? LANE_LEFT : LANE_RIGHT),
    centerY: screenHeight * PLAYER_CENTER_Y_FRACTION,
    radius: PLAYER_RADIUS,
  };
}

export function swapPlayerLane(state: GameLoopState): void {
  state.player.lane = state.player.lane === LANE_LEFT ? LANE_RIGHT : LANE_LEFT;
}
