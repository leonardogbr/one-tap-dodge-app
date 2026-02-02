/**
 * Game loop — one tick: update positions, spawn, collide, near-miss, score.
 * Pure logic; no React. Call from requestAnimationFrame or similar.
 */

import type { Player, Obstacle, Lane } from './types';
import { checkCollision } from './collision';
import { updateNearMiss } from './nearMiss';
import { createObstacle, shouldSpawn } from './spawner';
import { getObstacleSpeed } from './difficulty';
import {
  LANE_LEFT,
  LANE_RIGHT,
  PLAYER_RADIUS,
  PLAYER_CENTER_Y_FRACTION,
  OBSTACLE_HEIGHT,
} from './constants';

export interface GameLoopState {
  phase: 'playing' | 'paused' | 'game_over';
  player: Player;
  obstacles: Obstacle[];
  score: number;
  /** Accumulated ms for survival score (1 point per 100ms) */
  accumulatedScoreMs: number;
  lastSpawnTime: number;
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

  if (state.phase !== 'playing') {
    return {
      phase: state.phase,
      score: state.score,
      nearMissIds: [],
      collided: false,
    };
  }

  const playerCenterX = state.laneCenterX[state.player.lane];

  // 1. Update obstacle positions (speed from score + time)
  state.obstacleSpeed = getObstacleSpeed(state.score, state.gameTimeMs);
  const deltaSec = cappedDelta / 1000;
  for (const obs of state.obstacles) {
    obs.y += state.obstacleSpeed * deltaSec;
  }

  // 2. Remove obstacles below screen
  state.obstacles = state.obstacles.filter(
    (obs) => obs.y + obs.height < state.screenHeight + 50
  );

  // 3. Spawn
  if (shouldSpawn(state.lastSpawnTime, currentTimeMs, state.score)) {
    const lane: Lane = Math.random() < 0.5 ? LANE_LEFT : LANE_RIGHT;
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

  // 4. Collision (strict overlap only)
  for (const obs of state.obstacles) {
    if (checkCollision(state.player, playerCenterX, obs)) {
      collided = true;
      state.phase = 'game_over';
      break;
    }
  }

  // 5. Near-miss only when no collision this frame
  if (!collided) {
    const awarded = updateNearMiss(
      state.player,
      playerCenterX,
      state.obstacles,
      state.player.centerY
    );
    nearMissIds.push(...awarded);
  }

  // 6. Score: survival (accumulate ms, 1 point per 100ms) + near-miss bonus
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
  };
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
