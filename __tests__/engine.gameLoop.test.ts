import {
  tick,
  removeObstacleById,
  setReviveGrace,
  createInitialPlayer,
  swapPlayerLane,
  type GameLoopState,
} from '../src/engine/gameLoop';
import {
  LANE_LEFT,
  LANE_RIGHT,
  OBSTACLE_HEIGHT,
  OBSTACLE_WIDTH,
  COIN_HEIGHT,
  COIN_WIDTH,
  COIN_FIRST_SPAWN_DELAY_MS,
  COIN_SPAWN_INTERVAL_MS,
  NEAR_MISS_THRESHOLD,
  PLAYER_CENTER_Y_FRACTION,
  PLAYER_RADIUS,
  SPAWN_INTERVAL_MS,
  SPAWN_OTHER_LANE_TOP_ZONE_Y,
} from '../src/engine/constants';
import type { Coin, Obstacle } from '../src/engine/types';

const laneCenterX: [number, number] = [100, 300];

const makeObstacle = (overrides: Partial<Obstacle>): Obstacle => ({
  id: overrides.id ?? 'obs',
  lane: LANE_LEFT,
  x: 0,
  y: 0,
  width: OBSTACLE_WIDTH,
  height: OBSTACLE_HEIGHT,
  minDistanceWhileAbove: undefined,
  nearMissAwarded: false,
  ...overrides,
});

const makeCoin = (overrides: Partial<Coin>): Coin => ({
  id: overrides.id ?? 'coin',
  lane: LANE_LEFT,
  x: 0,
  y: 0,
  width: COIN_WIDTH,
  height: COIN_HEIGHT,
  ...overrides,
});

const createState = (overrides: Partial<GameLoopState> = {}): GameLoopState => ({
  phase: 'playing',
  player: { lane: LANE_LEFT, centerY: 300, radius: PLAYER_RADIUS },
  obstacles: [],
  coins: [],
  score: 0,
  accumulatedScoreMs: 0,
  lastSpawnTime: 0,
  lastCoinSpawnTime: 0,
  obstacleSpeed: 280,
  gameTimeMs: 0,
  laneCenterX,
  screenHeight: 600,
  nearMissStreak: 0,
  coinMultiplierActiveUntil: 0,
  reviveGraceUntil: 0,
  ...overrides,
});

describe('engine/gameLoop', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns early when not playing', () => {
    const state = createState({ phase: 'paused' });
    const result = tick(state, 16, 1000);
    expect(result.phase).toBe('paused');
    expect(result.collided).toBe(false);
  });

  it('spawns in other lane when top zone is blocked', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.4);
    const blocker = makeObstacle({
      id: 'blocker',
      lane: LANE_RIGHT,
      y: SPAWN_OTHER_LANE_TOP_ZONE_Y - 10,
    });
    const state = createState({ obstacles: [blocker] });

    tick(state, 0, 2000);

    const spawned = state.obstacles.find((obs) => obs.y === -OBSTACLE_HEIGHT);
    expect(spawned?.lane).toBe(LANE_RIGHT);
    expect(state.lastSpawnTime).toBe(2000);
  });

  it('spawns opposite lane when a coin is in the top zone', () => {
    const coin = makeCoin({ lane: LANE_LEFT, y: 40 });
    const state = createState({ coins: [coin] });

    tick(state, 0, 2000);

    const spawned = state.obstacles.find((obs) => obs.y === -OBSTACLE_HEIGHT);
    expect(spawned?.lane).toBe(LANE_RIGHT);
  });

  it('does not spawn obstacles before interval', () => {
    const state = createState({ lastSpawnTime: 1000 });

    tick(state, 0, 1000 + SPAWN_INTERVAL_MS - 1);

    expect(state.obstacles).toHaveLength(0);
  });

  it('skips spawning obstacles during revive grace', () => {
    const state = createState({ reviveGraceUntil: 5000 });

    tick(state, 0, 2000);

    expect(state.obstacles).toHaveLength(0);
  });

  it('spawns coins with random lane when no top obstacles', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.3);
    const state = createState({
      gameTimeMs: COIN_FIRST_SPAWN_DELAY_MS + 1000,
      lastCoinSpawnTime: 0,
    });

    tick(state, 0, COIN_SPAWN_INTERVAL_MS + 100);

    expect(state.coins).toHaveLength(1);
    expect(state.coins[0].lane).toBe(LANE_LEFT);
  });

  it('spawns coins in empty lane and halves interval during multiplier', () => {
    const state = createState({
      gameTimeMs: COIN_FIRST_SPAWN_DELAY_MS + 1000,
      lastCoinSpawnTime: 0,
      coinMultiplierActiveUntil: 10_000,
      obstacles: [
        makeObstacle({ id: 'top-right', lane: LANE_RIGHT, y: 40 }),
      ],
    });

    tick(state, 0, COIN_SPAWN_INTERVAL_MS);

    expect(state.coins).toHaveLength(1);
    expect(state.coins[0].lane).toBe(LANE_LEFT);
  });

  it('does not spawn coins when interval has not elapsed', () => {
    const state = createState({
      gameTimeMs: COIN_FIRST_SPAWN_DELAY_MS + 1000,
      lastCoinSpawnTime: 1000,
    });

    tick(state, 0, 1000 + COIN_SPAWN_INTERVAL_MS - 1);

    expect(state.coins).toHaveLength(0);
  });

  it('spawns coins in lane with fewer top obstacles', () => {
    const state = createState({
      gameTimeMs: COIN_FIRST_SPAWN_DELAY_MS + 1000,
      lastCoinSpawnTime: 0,
      obstacles: [
        makeObstacle({ id: 'l1', lane: LANE_LEFT, y: 20 }),
        makeObstacle({ id: 'l2', lane: LANE_LEFT, y: 30 }),
        makeObstacle({ id: 'r1', lane: LANE_RIGHT, y: 40 }),
      ],
    });

    tick(state, 0, COIN_SPAWN_INTERVAL_MS + 1);

    expect(state.coins).toHaveLength(1);
    expect(state.coins[0].lane).toBe(LANE_RIGHT);
  });

  it('does not spawn coins before initial delay', () => {
    const state = createState({
      gameTimeMs: COIN_FIRST_SPAWN_DELAY_MS - 1,
      lastCoinSpawnTime: 0,
    });

    tick(state, 0, COIN_SPAWN_INTERVAL_MS + 1);

    expect(state.coins).toHaveLength(0);
  });

  it('keeps coins when there is no overlap', () => {
    const coin = makeCoin({ x: 300, y: 0 });
    const state = createState({ coins: [coin] });

    const result = tick(state, 0, 1000);

    expect(result.coinsCollected).toBe(0);
    expect(state.coins).toHaveLength(1);
  });

  it('collects coins when overlapping the player', () => {
    const playerCenterX = laneCenterX[LANE_LEFT];
    const coin = makeCoin({
      x: playerCenterX - COIN_WIDTH / 2,
      y: 300 - COIN_HEIGHT / 2,
    });
    const state = createState({ coins: [coin] });

    const result = tick(state, 0, 1000);

    expect(result.coinsCollected).toBe(1);
    expect(state.coins).toHaveLength(0);
  });

  it('removes obstacles and coins below the screen', () => {
    const obstacle = makeObstacle({ y: 700 });
    const coin = makeCoin({ y: 700 });
    const state = createState({ obstacles: [obstacle], coins: [coin] });

    tick(state, 0, 1000);

    expect(state.obstacles).toHaveLength(0);
    expect(state.coins).toHaveLength(0);
  });

  it('marks collision and ends the run', () => {
    const playerCenterX = laneCenterX[LANE_LEFT];
    const obstacle = makeObstacle({
      x: playerCenterX - 10,
      y: 300 - 10,
    });
    const state = createState({ obstacles: [obstacle] });

    const result = tick(state, 0, 1000);

    expect(result.collided).toBe(true);
    expect(result.collidedObstacleId).toBe(obstacle.id);
    expect(state.phase).toBe('game_over');
  });

  it('awards near-miss and flags obstacles passing without it', () => {
    const award = makeObstacle({
      id: 'award',
      lane: LANE_RIGHT,
      x: 300,
      y: 320,
      minDistanceWhileAbove: NEAR_MISS_THRESHOLD - 1,
    });
    const pass = makeObstacle({
      id: 'pass',
      lane: LANE_RIGHT,
      x: 300,
      y: 310,
      minDistanceWhileAbove: undefined,
    });
    const state = createState({ obstacles: [award, pass] });

    const result = tick(state, 0, 1000);

    expect(result.nearMissIds).toEqual(['award']);
    expect(result.obstaclePassedWithoutNearMiss).toBe(true);
    expect(state.score).toBe(50);
  });

  it('increments score using capped delta', () => {
    const state = createState();

    const result = tick(state, 250, 1000);

    expect(result.nearMissIds).toEqual([]);
    expect(result.obstaclePassedWithoutNearMiss).toBe(false);
    expect(state.gameTimeMs).toBe(100);
    expect(state.score).toBe(1);
  });

  it('removes obstacles by id and resumes playing', () => {
    const obstacle = makeObstacle({ id: 'remove-me' });
    const state = createState({
      phase: 'game_over',
      obstacles: [obstacle],
    });

    removeObstacleById(state, 'remove-me');

    expect(state.obstacles).toHaveLength(0);
    expect(state.phase).toBe('playing');
  });

  it('clears obstacles and sets revive grace', () => {
    const state = createState({
      obstacles: [makeObstacle({ id: 'a' }), makeObstacle({ id: 'b' })],
    });

    setReviveGrace(state, 5000);

    expect(state.obstacles).toHaveLength(0);
    expect(state.reviveGraceUntil).toBe(5000);
  });

  it('creates initial player with provided or random lane', () => {
    const withLane = createInitialPlayer(600, LANE_RIGHT);
    expect(withLane.lane).toBe(LANE_RIGHT);
    expect(withLane.centerY).toBe(600 * PLAYER_CENTER_Y_FRACTION);
    expect(withLane.radius).toBe(PLAYER_RADIUS);

    jest.spyOn(Math, 'random').mockReturnValue(0.2);
    const randomLane = createInitialPlayer(400);
    expect(randomLane.lane).toBe(LANE_LEFT);

    (Math.random as jest.Mock).mockReturnValue(0.8);
    const randomRight = createInitialPlayer(400);
    expect(randomRight.lane).toBe(LANE_RIGHT);
  });

  it('swaps player lane', () => {
    const state = createState();
    swapPlayerLane(state);
    expect(state.player.lane).toBe(LANE_RIGHT);
    swapPlayerLane(state);
    expect(state.player.lane).toBe(LANE_LEFT);
  });
});
