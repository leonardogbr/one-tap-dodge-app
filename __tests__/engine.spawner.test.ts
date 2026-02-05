import { createObstacle, shouldSpawn } from '../src/engine/spawner';
import { OBSTACLE_HEIGHT, OBSTACLE_WIDTH, SPAWN_INTERVAL_MS } from '../src/engine/constants';

describe('engine/spawner', () => {
  it('creates obstacles with defaults and unique ids', () => {
    const first = createObstacle(0, 10, 20);
    const second = createObstacle(1, 30, 40);

    expect(first.id).not.toBe(second.id);
    expect(first.width).toBe(OBSTACLE_WIDTH);
    expect(first.height).toBe(OBSTACLE_HEIGHT);
    expect(first.minDistanceWhileAbove).toBeUndefined();
    expect(first.nearMissAwarded).toBe(false);
  });

  it('spawns only after interval has elapsed', () => {
    const shouldNot = shouldSpawn(0, SPAWN_INTERVAL_MS - 1, 0);
    const shouldYes = shouldSpawn(0, SPAWN_INTERVAL_MS, 0);
    expect(shouldNot).toBe(false);
    expect(shouldYes).toBe(true);
  });
});
