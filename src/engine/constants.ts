/**
 * Game constants — tune for feel and difficulty.
 */

import type { Lane } from './types';

export const LANE_COUNT = 2;
export const LANE_LEFT: Lane = 0;
export const LANE_RIGHT: Lane = 1;

/** Default sizes (relative to a 390-wide portrait screen; scale in layout) */
export const PLAYER_RADIUS = 20;
export const OBSTACLE_WIDTH = 60;
export const OBSTACLE_HEIGHT = 40;

/** Player sits in bottom third: center Y as fraction of screen height from top (0–1) */
export const PLAYER_CENTER_Y_FRACTION = 0.82;

/** Collision: strict overlap only (no gap). */
export const COLLISION_STRICT = true;

/** Near-miss: bonus when min distance (while above) < this. Must be > 0 and not overlap hitbox. */
export const NEAR_MISS_THRESHOLD = 28;

/** Base obstacle speed in px/s */
export const BASE_OBSTACLE_SPEED = 280;

/** Spawn: min interval between spawns (ms) */
export const SPAWN_INTERVAL_MS = 1200;

/** Difficulty: speed increase per 1000 score (px/s) */
export const SPEED_INCREASE_PER_1000 = 15;
export const MAX_OBSTACLE_SPEED = 500;

/** Difficulty: spawn interval decrease per 2000 score (ms) */
export const SPAWN_INTERVAL_DECREASE = 50;
export const MIN_SPAWN_INTERVAL_MS = 500;
