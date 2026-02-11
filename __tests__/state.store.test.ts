import { useGameStore, SKIN_IDS, SKIN_COSTS, SKIN_VISUALS } from '../src/state/store';

const initialState = useGameStore.getState();

const resetStore = () => {
  useGameStore.setState(
    {
      ...initialState,
      unlockedSkins: [...initialState.unlockedSkins],
    },
    true
  );
};

describe('state/store', () => {
  beforeEach(() => {
    resetStore();
  });

  it('updates score and tracks high score', () => {
    useGameStore.getState().setScore(10);
    expect(useGameStore.getState().score).toBe(10);
    expect(useGameStore.getState().highScore).toBe(10);

    useGameStore.getState().setScore(5);
    expect(useGameStore.getState().highScore).toBe(10);
  });

  it('clamps shield meter and consumes it at full', () => {
    useGameStore.getState().setShieldMeter(2);
    expect(useGameStore.getState().shieldMeter).toBe(1);

    const consumed = useGameStore.getState().consumeShield();
    expect(consumed).toBe(true);
    expect(useGameStore.getState().shieldMeter).toBe(0);

    useGameStore.getState().setShieldMeter(-1);
    expect(useGameStore.getState().shieldMeter).toBe(0);
    expect(useGameStore.getState().consumeShield()).toBe(false);
  });

  it('starts and ends runs with correct counters', () => {
    useGameStore.getState().setScore(12);
    useGameStore.getState().setCoinsThisRun(3);
    useGameStore.getState().startRun();

    expect(useGameStore.getState().phase).toBe('playing');
    expect(useGameStore.getState().score).toBe(0);
    expect(useGameStore.getState().coinsThisRun).toBe(0);
    expect(useGameStore.getState().revivesUsedThisRun).toBe(0);
    expect(useGameStore.getState().canRevive).toBe(true);

    useGameStore.getState().addCoinsThisRun(5);
    useGameStore.getState().endRun();
    expect(useGameStore.getState().phase).toBe('game_over');
    expect(useGameStore.getState().totalCoins).toBe(5);
    expect(useGameStore.getState().gameOversSinceLastInterstitial).toBe(1);
  });

  it('manages progress, skins, and counters', () => {
    useGameStore.getState().addTotalCoins(-10);
    expect(useGameStore.getState().totalCoins).toBe(0);

    useGameStore.getState().addTotalCoins(20);
    expect(useGameStore.getState().totalCoins).toBe(20);

    useGameStore.getState().unlockSkin('magma');
    expect(useGameStore.getState().unlockedSkins).toContain('magma');
    useGameStore.getState().unlockSkin('magma');
    expect(useGameStore.getState().unlockedSkins.filter((id) => id === 'magma')).toHaveLength(1);

    useGameStore.getState().equipSkin('magma');
    expect(useGameStore.getState().equippedSkinId).toBe('magma');

    useGameStore.getState().incrementGamesPlayed();
    expect(useGameStore.getState().gamesPlayed).toBe(1);

    useGameStore.getState().incrementGameOversSinceLastInterstitial();
    expect(useGameStore.getState().gameOversSinceLastInterstitial).toBe(1);
    useGameStore.getState().resetGameOversSinceLastInterstitial();
    expect(useGameStore.getState().gameOversSinceLastInterstitial).toBe(0);
  });

  it('supports direct setters for game state', () => {
    useGameStore.getState().setPhase('paused');
    expect(useGameStore.getState().phase).toBe('paused');

    useGameStore.getState().setCoinsThisRun(2);
    useGameStore.getState().addCoinsThisRun(3);
    expect(useGameStore.getState().coinsThisRun).toBe(5);

    useGameStore.getState().setHighScore(99);
    expect(useGameStore.getState().highScore).toBe(99);

    useGameStore.getState().setCanRevive(false);
    expect(useGameStore.getState().canRevive).toBe(false);

    useGameStore.getState().incrementRevivesUsedThisRun();
    expect(useGameStore.getState().revivesUsedThisRun).toBe(1);
  });

  it('hydrates and updates settings', () => {
    useGameStore.getState().setFromPersisted({
      totalCoins: 42,
      unlockedSkins: ['classic', 'magma'],
      equippedSkinId: 'magma',
      gameOversSinceLastInterstitial: 3,
      highScore: 77,
    });

    const state = useGameStore.getState();
    expect(state.totalCoins).toBe(42);
    expect(state.unlockedSkins).toEqual(['classic', 'magma']);
    expect(state.equippedSkinId).toBe('magma');
    expect(state.gameOversSinceLastInterstitial).toBe(3);
    expect(state.highScore).toBe(77);

    state.setSetting('themeMode', 'dark');
    state.setSettingsFromPersisted({
      soundOn: false,
      musicOn: false,
      hapticsOn: false,
      themeMode: 'light',
      locale: 'es',
    });

    const updated = useGameStore.getState();
    expect(updated.themeMode).toBe('light');
    expect(updated.soundOn).toBe(false);
    expect(updated.musicOn).toBe(false);
    expect(updated.hapticsOn).toBe(false);
    expect(updated.locale).toBe('es');
  });

  it('exports skin metadata', () => {
    expect(SKIN_IDS.length).toBeGreaterThan(0);
    expect(SKIN_COSTS.classic).toBe(0);
    expect(SKIN_VISUALS.classic.base).toBeDefined();
  });
});
