const mockSetFromPersisted = jest.fn();
const mockSetSettingsFromPersisted = jest.fn();
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

    expect(mockSetFromPersisted).toHaveBeenCalledWith({
      highScore: 100,
      totalCoins: 200,
      unlockedSkins: ['classic', 'magma'],
      equippedSkinId: 'magma',
      gameOversSinceLastInterstitial: 3,
    });
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

    expect(mockSetFromPersisted).toHaveBeenCalledWith({
      highScore: 0,
      totalCoins: 5,
      gameOversSinceLastInterstitial: 1,
    });
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

    expect(mockSetFromPersisted).toHaveBeenCalledWith({
      highScore: 7,
    });
    expect(mockSetSettingsFromPersisted).not.toHaveBeenCalled();
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
  });
});
