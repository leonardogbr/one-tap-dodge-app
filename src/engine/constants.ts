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
/** Spawn: if the other lane has an obstacle with y < this (px from top), spawn in that lane instead to avoid both lanes blocked at same level. */
export const SPAWN_OTHER_LANE_TOP_ZONE_Y = 140;
/** Spawn: max obstacles in a row in the same lane; after this we force the other lane for variety. */
export const MAX_CONSECUTIVE_OBSTACLES_SAME_LANE = 2;

/** Coins: size and spawn interval (ms) */
export const COIN_WIDTH = 28;
export const COIN_HEIGHT = 28;
export const COIN_SPAWN_INTERVAL_MS = 4000;
/** Coins start spawning only after this many ms of gameplay (e.g. 5s). */
export const COIN_FIRST_SPAWN_DELAY_MS = 5000;
/** Shield: each coin adds this much to meter (0–1). */
export const COIN_TO_SHIELD = 0.08;

/** Difficulty: speed increase per 1000 score (px/s) */
export const SPEED_INCREASE_PER_1000 = 15;
export const MAX_OBSTACLE_SPEED = 3500;

/** Difficulty: spawn interval decrease per 2000 score (ms) */
export const SPAWN_INTERVAL_DECREASE = 50;
export const MIN_SPAWN_INTERVAL_MS = 500;

/** Monetization: show interstitial after this many game overs (less intrusive). */
export const INTERSTITIAL_AFTER_GAME_OVERS = 5;
/** Monetization: max rewarded revives per run (more chances to continue same run). */
export const MAX_REVIVES_PER_RUN = 2;

/** Game over: seconds before "Play again" can be tapped (avoid accidental restart). */
export const GAME_OVER_PLAY_AGAIN_DELAY_MS = 2000;

/** Countdown: ms per step (3, 2, 1, Go) before start/resume/after revive. */
export const COUNTDOWN_STEP_MS = 800;
