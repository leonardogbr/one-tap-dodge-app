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
  COIN_WIDTH,
  COIN_HEIGHT,
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
}

export interface TickResult {
  phase: 'playing' | 'paused' | 'game_over';
  score: number;
  nearMissIds: string[];
  collided: boolean;
  /** When collided, obstacle id so hook can remove it if shield consumed */
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

  if (state.phase !== 'playing') {
    return {
      phase: state.phase,
      score: state.score,
      nearMissIds: [],
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

  // 3. Spawn obstacles — avoid lane with coin in top zone so coin/obstacle don't overlap
  if (shouldSpawn(state.lastSpawnTime, currentTimeMs, state.score)) {
    const TOP_ZONE_Y = 120;
    const laneWithCoinInTop = state.coins.some((c) => c.y < TOP_ZONE_Y)
      ? (state.coins.find((c) => c.y < TOP_ZONE_Y)?.lane ?? null)
      : null;
    let lane: Lane;
    if (laneWithCoinInTop === null) {
      lane = Math.random() < 0.5 ? LANE_LEFT : LANE_RIGHT;
    } else {
      lane = laneWithCoinInTop === LANE_LEFT ? LANE_RIGHT : LANE_LEFT;
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

  // 4. Spawn coins (every COIN_SPAWN_INTERVAL_MS) — avoid lane with obstacle in top zone
  if (currentTimeMs - state.lastCoinSpawnTime >= COIN_SPAWN_INTERVAL_MS) {
    const TOP_ZONE_Y = 120; // obstacles with top edge above this are "in top zone"
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
    // Prefer lane with no obstacle in top zone; if both clear, random
    let lane: Lane;
    if (obstaclesInTopByLane[0][1] === 0 && obstaclesInTopByLane[1][1] === 0) {
      lane = Math.random() < 0.5 ? LANE_LEFT : LANE_RIGHT;
    } else if (obstaclesInTopByLane[0][1] === 0) {
      lane = LANE_LEFT;
    } else if (obstaclesInTopByLane[1][1] === 0) {
      lane = LANE_RIGHT;
    } else {
      // Both lanes have obstacle in top zone — spawn in lane with fewer, or random
      lane =
        obstaclesInTopByLane[0][1] <= obstaclesInTopByLane[1][1]
          ? LANE_LEFT
          : LANE_RIGHT;
    }
    const laneX = state.laneCenterX[lane];
    const newCoin = createCoin(lane, laneX - COIN_WIDTH / 2, -COIN_HEIGHT);
    state.coins.push(newCoin);
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
  screenHeight: number
): Player {
  return {
    lane: LANE_LEFT,
    centerY: screenHeight * PLAYER_CENTER_Y_FRACTION,
    radius: PLAYER_RADIUS,
  };
}

export function swapPlayerLane(state: GameLoopState): void {
  state.player.lane = state.player.lane === LANE_LEFT ? LANE_RIGHT : LANE_LEFT;
}
