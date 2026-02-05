import {
  getObstacleSpeed,
  getSpawnIntervalMs,
} from '../src/engine/difficulty';
import {
  BASE_OBSTACLE_SPEED,
  MAX_OBSTACLE_SPEED,
  SPEED_INCREASE_PER_1000,
  SPAWN_INTERVAL_MS,
  MIN_SPAWN_INTERVAL_MS,
  SPAWN_INTERVAL_DECREASE,
} from '../src/engine/constants';

describe('engine/difficulty', () => {
  it('scales obstacle speed by score and time and clamps to max', () => {
    const base = getObstacleSpeed(0, 0);
    expect(base).toBe(BASE_OBSTACLE_SPEED);

    const byScore = getObstacleSpeed(2000, 0);
    expect(byScore).toBe(BASE_OBSTACLE_SPEED + 2 * SPEED_INCREASE_PER_1000);

    const byTime = getObstacleSpeed(0, 15_000);
    expect(byTime).toBe(BASE_OBSTACLE_SPEED + 25);

    const capped = getObstacleSpeed(999_999, 999_999);
    expect(capped).toBe(MAX_OBSTACLE_SPEED);
  });

  it('reduces spawn interval by score and clamps to min', () => {
    const base = getSpawnIntervalMs(0);
    expect(base).toBe(SPAWN_INTERVAL_MS);

    const reduced = getSpawnIntervalMs(4000);
    expect(reduced).toBe(SPAWN_INTERVAL_MS - 2 * SPAWN_INTERVAL_DECREASE);

    const min = getSpawnIntervalMs(999_999);
    expect(min).toBe(MIN_SPAWN_INTERVAL_MS);
  });
});
