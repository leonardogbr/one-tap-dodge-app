/**
 * Near-miss detection: bonus only when obstacle was above the player (closest approach).
 * No bonus if player hit the obstacle. One-shot per obstacle.
 */

import type { Player, Obstacle } from './types';
import { NEAR_MISS_THRESHOLD } from './constants';

function circleRectDistance(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number
): number {
  const closestX = Math.max(rx, Math.min(cx, rx + rw));
  const closestY = Math.max(ry, Math.min(cy, ry + rh));
  const dx = cx - closestX;
  const dy = cy - closestY;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Update min distance for obstacles still above the player.
 * When an obstacle has just passed below, check if min distance < threshold and award near-miss once.
 * Returns obstacle IDs that triggered near-miss this frame (for feedback).
 */
export function updateNearMiss(
  player: Player,
  playerCenterX: number,
  obstacles: Obstacle[],
  playerCenterY: number
): string[] {
  const awarded: string[] = [];
  for (const obs of obstacles) {
    const obsBottom = obs.y + obs.height;
    const distance = circleRectDistance(
      playerCenterX,
      playerCenterY,
      obs.x,
      obs.y,
      obs.width,
      obs.height
    );

    if (obsBottom > playerCenterY) {
      // Obstacle has passed below player (screen Y increases downward) — evaluate closest approach
      if (!obs.nearMissAwarded && obs.minDistanceWhileAbove !== undefined) {
        if (obs.minDistanceWhileAbove < NEAR_MISS_THRESHOLD) {
          obs.nearMissAwarded = true;
          awarded.push(obs.id);
        }
      }
    } else {
      // Obstacle still above player — update min distance
      if (obs.minDistanceWhileAbove === undefined) {
        obs.minDistanceWhileAbove = distance;
      } else {
        obs.minDistanceWhileAbove = Math.min(
          obs.minDistanceWhileAbove,
          distance
        );
      }
    }
  }
  return awarded;
}
