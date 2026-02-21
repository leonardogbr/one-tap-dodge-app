const mockSetFromPersisted = jest.fn();
const mockSetSettingsFromPersisted = jest.fn();
const mockEvaluateAndUnlockTrophies = jest.fn().mockReturnValue([]);
const mockChangeLanguage = jest.fn();

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

jest.mock('../src/state/store', () => ({
  useGameStore: {
    getState: () => ({
      setFromPersisted: mockSetFromPersisted,
      setSettingsFromPersisted: mockSetSettingsFromPersisted,
      evaluateAndUnlockTrophies: mockEvaluateAndUnlockTrophies,
    }),
  },
}));

jest.mock('../src/i18n', () => ({
  changeLanguage: mockChangeLanguage,
}));

let AsyncStorage: {
  getItem: jest.Mock;
  setItem: jest.Mock;
};
let persistence: typeof import('../src/state/persistence');

const loadModules = () => {
  jest.resetModules();
  AsyncStorage = require('@react-native-async-storage/async-storage');
  persistence = require('../src/state/persistence');
};

describe('state/persistence', () => {
  beforeEach(() => {
    loadModules();
    jest.clearAllMocks();
  });

  it('hydrates store from AsyncStorage', async () => {
    const storage: Record<string, string> = {
      '@onetapdodge/highScore': '100',
      '@onetapdodge/totalCoins': '200',
      '@onetapdodge/unlockedSkins': '["classic","magma"]',
      '@onetapdodge/equippedSkinId': 'magma',
      '@onetapdodge/settings':
        '{"soundOn":false,"musicOn":true,"hapticsOn":false,"themeMode":"dark","locale":"es"}',
      '@onetapdodge/gameOversSinceLastInterstitial': '3',
    };
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) =>
      Promise.resolve(storage[key] ?? null)
    );

    await persistence.hydrateStore();

    expect(mockSetFromPersisted).toHaveBeenCalledWith(
      expect.objectContaining({
        highScore: 100,
        totalCoins: 200,
        unlockedSkins: ['classic', 'magma'],
        equippedSkinId: 'magma',
        gameOversSinceLastInterstitial: 3,
      })
    );
    expect(mockEvaluateAndUnlockTrophies).toHaveBeenCalled();
    expect(mockSetSettingsFromPersisted).toHaveBeenCalledWith({
      soundOn: false,
      musicOn: true,
      hapticsOn: false,
      themeMode: 'dark',
      locale: 'es',
    });
    expect(mockChangeLanguage).toHaveBeenCalledWith('es');
  });

  it('ignores invalid JSON and partial settings', async () => {
    const storage: Record<string, string> = {
      '@onetapdodge/highScore': '0',
      '@onetapdodge/totalCoins': '5',
      '@onetapdodge/unlockedSkins': 'not-json',
      '@onetapdodge/settings': '{invalid',
      '@onetapdodge/gameOversSinceLastInterstitial': '1',
    };
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) =>
      Promise.resolve(storage[key] ?? null)
    );

    await persistence.hydrateStore();

    expect(mockSetFromPersisted).toHaveBeenCalledWith(
      expect.objectContaining({
        highScore: 0,
        totalCoins: 5,
        gameOversSinceLastInterstitial: 1,
      })
    );
    expect(mockSetSettingsFromPersisted).not.toHaveBeenCalled();
    expect(mockChangeLanguage).not.toHaveBeenCalled();
  });

  it('swallows storage errors during hydration', async () => {
    (AsyncStorage.getItem as jest.Mock).mockImplementation(() =>
      Promise.reject(new Error('boom'))
    );

    await expect(persistence.hydrateStore()).resolves.toBeUndefined();
    expect(mockSetFromPersisted).not.toHaveBeenCalled();
  });

  it('hydrates settings without optional fields', async () => {
    const storage: Record<string, string> = {
      '@onetapdodge/settings': '{"soundOn":true,"musicOn":false,"hapticsOn":true}',
    };
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) =>
      Promise.resolve(storage[key] ?? null)
    );

    await persistence.hydrateStore();

    expect(mockSetSettingsFromPersisted).toHaveBeenCalledWith({
      soundOn: true,
      musicOn: false,
      hapticsOn: true,
    });
    expect(mockChangeLanguage).not.toHaveBeenCalled();
  });

  it('handles missing totals and settings', async () => {
    const storage: Record<string, string> = {
      '@onetapdodge/highScore': '7',
    };
    AsyncStorage.getItem.mockImplementation((key: string) =>
      Promise.resolve(storage[key] ?? null)
    );

    await persistence.hydrateStore();

    expect(mockSetFromPersisted).toHaveBeenCalledWith(
      expect.objectContaining({
        highScore: 7,
      })
    );
    expect(mockSetSettingsFromPersisted).not.toHaveBeenCalled();
  });

  it('defaults total coins when stored value is invalid', async () => {
    const storage: Record<string, string> = {
      '@onetapdodge/totalCoins': 'not-a-number',
    };
    AsyncStorage.getItem.mockImplementation((key: string) =>
      Promise.resolve(storage[key] ?? null)
    );

    await persistence.hydrateStore();

    expect(mockSetFromPersisted).toHaveBeenCalledWith(
      expect.objectContaining({
        totalCoins: 0,
      })
    );
  });

  it('generates challengeShuffleSeed when not stored', async () => {
    AsyncStorage.getItem.mockImplementation(() => Promise.resolve(null));

    await persistence.hydrateStore();

    const call = mockSetFromPersisted.mock.calls[0][0];
    expect(call.challengeShuffleSeed).toBeDefined();
    expect(typeof call.challengeShuffleSeed).toBe('number');
    expect(call.challengeShuffleSeed).toBeGreaterThanOrEqual(0);
  });

  it('hydrates earned trophies and seen trophy IDs', async () => {
    const storage: Record<string, string> = {
      '@onetapdodge/earnedTrophies': '["first_step","first_coin"]',
      '@onetapdodge/seenTrophyIds': '["first_step"]',
    };
    AsyncStorage.getItem.mockImplementation((key: string) =>
      Promise.resolve(storage[key] ?? null)
    );

    await persistence.hydrateStore();

    expect(mockSetFromPersisted).toHaveBeenCalledWith(
      expect.objectContaining({
        earnedTrophies: ['first_step', 'first_coin'],
        seenTrophyIds: ['first_step'],
      })
    );
  });

  it('persists data using AsyncStorage', () => {
    persistence.persistHighScore(10);
    persistence.persistTotalCoins(20);
    persistence.persistUnlockedSkins(['classic', 'magma']);
    persistence.persistEquippedSkin('magma');
    persistence.persistSettings({
      soundOn: true,
      musicOn: false,
      hapticsOn: true,
      themeMode: 'system',
      locale: 'pt-BR',
    });
    persistence.persistGameOversSinceLastInterstitial(2);
    persistence.persistEarnedTrophies(['first_step', 'first_coin']);
    persistence.persistSeenTrophyIds(['first_step']);

    const setItem = AsyncStorage.setItem as jest.Mock;
    expect(setItem).toHaveBeenCalledWith('@onetapdodge/highScore', '10');
    expect(setItem).toHaveBeenCalledWith('@onetapdodge/totalCoins', '20');
    expect(setItem).toHaveBeenCalledWith(
      '@onetapdodge/unlockedSkins',
      '["classic","magma"]'
    );
    expect(setItem).toHaveBeenCalledWith('@onetapdodge/equippedSkinId', 'magma');
    expect(setItem).toHaveBeenCalledWith(
      '@onetapdodge/settings',
      '{"soundOn":true,"musicOn":false,"hapticsOn":true,"themeMode":"system","locale":"pt-BR"}'
    );
    expect(setItem).toHaveBeenCalledWith(
      '@onetapdodge/gameOversSinceLastInterstitial',
      '2'
    );
    expect(setItem).toHaveBeenCalledWith(
      '@onetapdodge/earnedTrophies',
      '["first_step","first_coin"]'
    );
    expect(setItem).toHaveBeenCalledWith(
      '@onetapdodge/seenTrophyIds',
      '["first_step"]'
    );
  });

  it('hydrates challenge fields (scoreMultiplier, challengeGroupIndex, challengeShuffleSeed)', async () => {
    const storage: Record<string, string> = {
      '@onetapdodge/scoreMultiplier': '2.5',
      '@onetapdodge/challengeGroupIndex': '3',
      '@onetapdodge/challengeShuffleSeed': '42',
    };
    AsyncStorage.getItem.mockImplementation((key: string) =>
      Promise.resolve(storage[key] ?? null)
    );

    await persistence.hydrateStore();

    expect(mockSetFromPersisted).toHaveBeenCalledWith(
      expect.objectContaining({
        scoreMultiplier: 2.5,
        challengeGroupIndex: 3,
        challengeShuffleSeed: 42,
      })
    );
  });

  it('hydrates challenge progress and baseline', async () => {
    const progress = { challenge_1: 5, challenge_2: 10 };
    const baseline = { totalCoins: 100, totalScore: 500, gamesPlayed: 20, totalNearMisses: 15 };
    const stats = { totalCoins: 200, totalScore: 1000, gamesPlayed: 50, totalNearMisses: 30 };
    const storage: Record<string, string> = {
      '@onetapdodge/currentGroupProgress': JSON.stringify(progress),
      '@onetapdodge/challengeGroupBaseline': JSON.stringify(baseline),
      '@onetapdodge/lifetimeStats': JSON.stringify(stats),
    };
    AsyncStorage.getItem.mockImplementation((key: string) =>
      Promise.resolve(storage[key] ?? null)
    );

    await persistence.hydrateStore();

    expect(mockSetFromPersisted).toHaveBeenCalledWith(
      expect.objectContaining({
        currentGroupProgress: progress,
        challengeGroupBaseline: baseline,
        lifetimeStats: stats,
      })
    );
  });

  it('hydrates rewardAvailable as boolean', async () => {
    const storage: Record<string, string> = {
      '@onetapdodge/rewardAvailable': 'true',
    };
    AsyncStorage.getItem.mockImplementation((key: string) =>
      Promise.resolve(storage[key] ?? null)
    );

    await persistence.hydrateStore();

    expect(mockSetFromPersisted).toHaveBeenCalledWith(
      expect.objectContaining({
        rewardAvailable: true,
      })
    );
  });

  it('persists all challenge and reward functions', () => {
    const progress = { challenge_1: 5 };
    const baseline = { totalCoins: 100, totalScore: 500, gamesPlayed: 20, totalNearMisses: 15 };
    const stats = { totalCoins: 200, totalScore: 1000, gamesPlayed: 50, totalNearMisses: 30 };

    persistence.persistLastScore(42);
    persistence.persistScoreMultiplier(1.5);
    persistence.persistChallengeGroupIndex(7);
    persistence.persistChallengeShuffleSeed(999);
    persistence.persistCurrentGroupProgress(progress);
    persistence.persistChallengeGroupBaseline(baseline);
    persistence.persistLifetimeStats(stats);
    persistence.persistRewardAvailable(true);

    const setItem = AsyncStorage.setItem as jest.Mock;
    expect(setItem).toHaveBeenCalledWith('@onetapdodge/lastScore', '42');
    expect(setItem).toHaveBeenCalledWith('@onetapdodge/scoreMultiplier', '1.5');
    expect(setItem).toHaveBeenCalledWith('@onetapdodge/challengeGroupIndex', '7');
    expect(setItem).toHaveBeenCalledWith('@onetapdodge/challengeShuffleSeed', '999');
    expect(setItem).toHaveBeenCalledWith(
      '@onetapdodge/currentGroupProgress',
      JSON.stringify(progress)
    );
    expect(setItem).toHaveBeenCalledWith(
      '@onetapdodge/challengeGroupBaseline',
      JSON.stringify(baseline)
    );
    expect(setItem).toHaveBeenCalledWith(
      '@onetapdodge/lifetimeStats',
      JSON.stringify(stats)
    );
    expect(setItem).toHaveBeenCalledWith('@onetapdodge/rewardAvailable', 'true');
  });

  it('ignores invalid scoreMultiplier, challengeGroupIndex, and challengeShuffleSeed', async () => {
    const storage: Record<string, string> = {
      '@onetapdodge/scoreMultiplier': '0.5',
      '@onetapdodge/challengeGroupIndex': '-3',
      '@onetapdodge/challengeShuffleSeed': '-10',
    };
    AsyncStorage.getItem.mockImplementation((key: string) =>
      Promise.resolve(storage[key] ?? null)
    );

    await persistence.hydrateStore();

    const call = mockSetFromPersisted.mock.calls[0][0];
    expect(call.scoreMultiplier).toBeUndefined();
    expect(call.challengeGroupIndex).toBeUndefined();
    expect(call.challengeShuffleSeed).toBeUndefined();
  });

  it('ignores NaN values for numeric fields', async () => {
    const storage: Record<string, string> = {
      '@onetapdodge/lastScore': 'not-a-number',
      '@onetapdodge/scoreMultiplier': 'abc',
      '@onetapdodge/challengeGroupIndex': 'xyz',
      '@onetapdodge/challengeShuffleSeed': 'bad',
    };
    AsyncStorage.getItem.mockImplementation((key: string) =>
      Promise.resolve(storage[key] ?? null)
    );

    await persistence.hydrateStore();

    const call = mockSetFromPersisted.mock.calls[0][0];
    expect(call.lastScore).toBe(0);
    expect(call.scoreMultiplier).toBeUndefined();
    expect(call.challengeGroupIndex).toBeUndefined();
    expect(call.challengeShuffleSeed).toBeUndefined();
  });

  it('ignores out-of-range scoreMultiplier (above max)', async () => {
    const storage: Record<string, string> = {
      '@onetapdodge/scoreMultiplier': '99',
      '@onetapdodge/challengeGroupIndex': '25',
    };
    AsyncStorage.getItem.mockImplementation((key: string) =>
      Promise.resolve(storage[key] ?? null)
    );

    await persistence.hydrateStore();

    const call = mockSetFromPersisted.mock.calls[0][0];
    expect(call.scoreMultiplier).toBeUndefined();
    expect(call.challengeGroupIndex).toBeUndefined();
  });
});
