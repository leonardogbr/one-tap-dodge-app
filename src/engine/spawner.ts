/**
 * Obstacle spawning — when to spawn and in which lane.
 */

import type { Obstacle, Lane } from './types';
import { OBSTACLE_WIDTH, OBSTACLE_HEIGHT } from './constants';
import { getSpawnIntervalMs } from './difficulty';

let obstacleIdCounter = 0;

function nextId(): string {
  return `obs_${++obstacleIdCounter}`;
}

export function createObstacle(
  lane: Lane,
  x: number,
  y: number
): Obstacle {
  return {
    id: nextId(),
    lane,
    x,
    y,
    width: OBSTACLE_WIDTH,
    height: OBSTACLE_HEIGHT,
    minDistanceWhileAbove: undefined,
    nearMissAwarded: false,
  };
}

/**
 * Returns true if we should spawn this frame.
 * lastSpawnTime and currentTime in ms; score for difficulty.
 */
export function shouldSpawn(
  lastSpawnTime: number,
  currentTime: number,
  score: number
): boolean {
  const interval = getSpawnIntervalMs(score);
  return currentTime - lastSpawnTime >= interval;
}
