/**
 * Coin spawn and collect — overlap with player = collect.
 */

import type { Player, Coin, Lane } from './types';
import { COIN_WIDTH, COIN_HEIGHT } from './constants';

let coinIdCounter = 0;
function nextCoinId(): string {
  return `coin_${++coinIdCounter}`;
}

export function createCoin(lane: Lane, x: number, y: number): Coin {
  return {
    id: nextCoinId(),
    lane,
    x,
    y,
    width: COIN_WIDTH,
    height: COIN_HEIGHT,
  };
}

function circleRectOverlap(
  cx: number,
  cy: number,
  radius: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number
): boolean {
  const closestX = Math.max(rx, Math.min(cx, rx + rw));
  const closestY = Math.max(ry, Math.min(cy, ry + rh));
  const dx = cx - closestX;
  const dy = cy - closestY;
  return dx * dx + dy * dy < radius * radius;
}

export function checkCoinCollect(
  player: Player,
  playerCenterX: number,
  coin: Coin
): boolean {
  return circleRectOverlap(
    playerCenterX,
    player.centerY,
    player.radius,
    coin.x,
    coin.y,
    coin.width,
    coin.height
  );
}
