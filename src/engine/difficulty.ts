/**
 * Difficulty scaling — speed and spawn rate from score/time.
 * Speed increases with score and every 15 seconds (time-based).
 */

import {
  BASE_OBSTACLE_SPEED,
  MAX_OBSTACLE_SPEED,
  SPEED_INCREASE_PER_1000,
  SPAWN_INTERVAL_MS,
  MIN_SPAWN_INTERVAL_MS,
  SPAWN_INTERVAL_DECREASE,
} from './constants';

/** Time-based speed step: every 15 seconds, add this much (px/s). */
const SPEED_INCREASE_EVERY_MS = 15_000;
const SPEED_STEP_PER_15S = 25;

export function getObstacleSpeed(score: number, gameTimeMs: number): number {
  const fromScore = (score / 1000) * SPEED_INCREASE_PER_1000;
  const fromTime =
    Math.floor(gameTimeMs / SPEED_INCREASE_EVERY_MS) * SPEED_STEP_PER_15S;
  return Math.min(
    BASE_OBSTACLE_SPEED + fromScore + fromTime,
    MAX_OBSTACLE_SPEED
  );
}

export function getSpawnIntervalMs(score: number): number {
  const decrease = Math.floor(score / 2000) * SPAWN_INTERVAL_DECREASE;
  return Math.max(
    SPAWN_INTERVAL_MS - decrease,
    MIN_SPAWN_INTERVAL_MS
  );
}
