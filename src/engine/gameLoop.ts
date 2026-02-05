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
  SPAWN_OTHER_LANE_TOP_ZONE_Y,
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
  lastCoinSpawnTime: number;
  obstacleSpeed: number;
  gameTimeMs: number;
  /** Lane center X positions [left, right] */
  laneCenterX: [number, number];
  screenHeight: number;
  /** Near-miss streak (0–5); when 5, activate 2x coins for 10s. Only counts outside bonus. */
  nearMissStreak: number;
  /** Timestamp (ms) until which 2x coins spawn is active; 0 = inactive */
  coinMultiplierActiveUntil: number;
  /** After revive: no obstacle spawn until this time (ms); 0 = no grace */
  reviveGraceUntil: number;
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

  // 3. Spawn obstacles — skip during revive grace so player can reorient
  const inReviveGrace =
    state.reviveGraceUntil > 0 && currentTimeMs < state.reviveGraceUntil;
  if (
    !inReviveGrace &&
    shouldSpawn(state.lastSpawnTime, currentTimeMs, state.score)
  ) {
    const TOP_ZONE_Y = 120;
    const coinInTop = state.coins.find((c) => c.y < TOP_ZONE_Y);
    const laneWithCoinInTop = coinInTop ? coinInTop.lane : null;
    let lane: Lane;
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
    const laneX = state.laneCenterX[lane];
    const halfW = 30;
    const newObs = createObstacle(
      lane,
      laneX - halfW,
      -OBSTACLE_HEIGHT
    );
    state.obstacles.push(newObs);
    state.lastSpawnTime = currentTimeMs;
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

    const lane = pickLane();
    const laneX = state.laneCenterX[lane];
    state.coins.push(
      createCoin(lane, laneX - COIN_WIDTH / 2, -COIN_HEIGHT)
    );
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

/** Clear all obstacles and set grace period (no spawn) until graceEndMs. Use after revive. */
export function setReviveGrace(
  state: GameLoopState,
  graceEndMs: number
): void {
  state.obstacles = [];
  state.reviveGraceUntil = graceEndMs;
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
