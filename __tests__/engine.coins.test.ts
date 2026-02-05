import { checkCoinCollect, createCoin } from '../src/engine/coins';
import { COIN_HEIGHT, COIN_WIDTH } from '../src/engine/constants';
import type { Player } from '../src/engine/types';

describe('engine/coins', () => {
  const player: Player = {
    lane: 0,
    centerY: 200,
    radius: 20,
  };

  it('creates coins with defaults and unique ids', () => {
    const first = createCoin(0, 10, 20);
    const second = createCoin(1, 30, 40);

    expect(first.id).not.toBe(second.id);
    expect(first.width).toBe(COIN_WIDTH);
    expect(first.height).toBe(COIN_HEIGHT);
  });

  it('detects coin collection when overlapping', () => {
    const coin = createCoin(0, 90, 190);
    const collected = checkCoinCollect(player, 100, coin);
    expect(collected).toBe(true);
  });

  it('does not collect when separated', () => {
    const coin = createCoin(1, 300, 10);
    const collected = checkCoinCollect(player, 100, coin);
    expect(collected).toBe(false);
  });
});
