import { updateNearMiss } from '../src/engine/nearMiss';
import { NEAR_MISS_THRESHOLD, OBSTACLE_HEIGHT, OBSTACLE_WIDTH } from '../src/engine/constants';
import type { Player, Obstacle } from '../src/engine/types';

describe('engine/nearMiss', () => {
  const player: Player = {
    lane: 0,
    centerY: 300,
    radius: 20,
  };

  const makeObstacle = (overrides: Partial<Obstacle>): Obstacle => ({
    id: overrides.id ?? 'obs',
    lane: 0,
    x: 100,
    y: 100,
    width: OBSTACLE_WIDTH,
    height: OBSTACLE_HEIGHT,
    minDistanceWhileAbove: undefined,
    nearMissAwarded: false,
    ...overrides,
  });

  it('tracks min distance while obstacle is above player', () => {
    const obstacle = makeObstacle({ y: 100, x: 220 });
    const first = updateNearMiss(player, 100, [obstacle], player.centerY);
    expect(first).toEqual([]);
    const firstMin = obstacle.minDistanceWhileAbove ?? 0;
    expect(firstMin).toBeGreaterThan(0);

    obstacle.x = 120;
    updateNearMiss(player, 100, [obstacle], player.centerY);
    const secondMin = obstacle.minDistanceWhileAbove ?? 0;
    expect(secondMin).toBeLessThan(firstMin);
  });

  it('awards near-miss only once when obstacle passes below', () => {
    const award = makeObstacle({
      id: 'award',
      y: player.centerY + 10,
      minDistanceWhileAbove: NEAR_MISS_THRESHOLD - 1,
    });
    const noData = makeObstacle({
      id: 'nodata',
      y: player.centerY + 20,
      minDistanceWhileAbove: undefined,
    });
    const tooFar = makeObstacle({
      id: 'toofar',
      y: player.centerY + 30,
      minDistanceWhileAbove: NEAR_MISS_THRESHOLD + 10,
    });
    const already = makeObstacle({
      id: 'already',
      y: player.centerY + 40,
      minDistanceWhileAbove: NEAR_MISS_THRESHOLD - 1,
      nearMissAwarded: true,
    });

    const awarded = updateNearMiss(
      player,
      100,
      [award, noData, tooFar, already],
      player.centerY
    );

    expect(awarded).toEqual(['award']);
    expect(award.nearMissAwarded).toBe(true);
    expect(noData.nearMissAwarded).toBe(false);
    expect(tooFar.nearMissAwarded).toBe(false);
    expect(already.nearMissAwarded).toBe(true);
  });
});
