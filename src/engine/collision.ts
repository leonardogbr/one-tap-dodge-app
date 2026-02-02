/**
 * Collision detection — strict overlap only (no gap between player and obstacle).
 */

import type { Player, Obstacle } from './types';

/** Distance from circle center to closest point on rectangle (AABB). */
function circleRectDistance(
  cx: number,
  cy: number,
  radius: number,
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
 * Returns true only when there is actual overlap (no gap).
 * Player = circle (centerX from lane, centerY, radius). Obstacle = rect (x, y, w, h).
 */
export function checkCollision(
  player: Player,
  playerCenterX: number,
  obstacle: Obstacle
): boolean {
  const cy = player.centerY;
  const radius = player.radius;
  const rx = obstacle.x;
  const ry = obstacle.y;
  const rw = obstacle.width;
  const rh = obstacle.height;
  const distance = circleRectDistance(
    playerCenterX,
    cy,
    radius,
    rx,
    ry,
    rw,
    rh
  );
  return distance < radius; // overlap when circle center is within radius of rect (strict: touching = overlap)
}
