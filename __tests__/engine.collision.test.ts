import { checkCollision } from '../src/engine/collision';
import type { Player, Obstacle } from '../src/engine/types';

describe('engine/collision', () => {
  const player: Player = {
    lane: 0,
    centerY: 200,
    radius: 20,
  };

  it('detects overlap between player circle and obstacle rect', () => {
    const obstacle: Obstacle = {
      id: 'obs_1',
      lane: 0,
      x: 90,
      y: 190,
      width: 60,
      height: 40,
      minDistanceWhileAbove: undefined,
      nearMissAwarded: false,
    };
    const collided = checkCollision(player, 110, obstacle);
    expect(collided).toBe(true);
  });

  it('does not report collision when separated', () => {
    const obstacle: Obstacle = {
      id: 'obs_2',
      lane: 1,
      x: 300,
      y: 10,
      width: 60,
      height: 40,
      minDistanceWhileAbove: undefined,
      nearMissAwarded: false,
    };
    const collided = checkCollision(player, 110, obstacle);
    expect(collided).toBe(false);
  });
});
