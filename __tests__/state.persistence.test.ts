const setFromPersisted = jest.fn();
const setSettingsFromPersisted = jest.fn();
const changeLanguage = jest.fn();

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

jest.mock('../src/state/store', () => ({
  useGameStore: {
    getState: () => ({
      setFromPersisted,
      setSettingsFromPersisted,
    }),
  },
}));

jest.mock('../src/i18n', () => ({
  changeLanguage,
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  hydrateStore,
  persistEquippedSkin,
  persistGameOversSinceLastInterstitial,
  persistHighScore,
  persistSettings,
  persistTotalCoins,
  persistUnlockedSkins,
} from '../src/state/persistence';

describe('state/persistence', () => {
  beforeEach(() => {
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

    await hydrateStore();

    expect(setFromPersisted).toHaveBeenCalledWith({
      highScore: 100,
      totalCoins: 200,
      unlockedSkins: ['classic', 'magma'],
      equippedSkinId: 'magma',
      gameOversSinceLastInterstitial: 3,
    });
    expect(setSettingsFromPersisted).toHaveBeenCalledWith({
      soundOn: false,
      musicOn: true,
      hapticsOn: false,
      themeMode: 'dark',
      locale: 'es',
    });
    expect(changeLanguage).toHaveBeenCalledWith('es');
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

    await hydrateStore();

    expect(setFromPersisted).toHaveBeenCalledWith({
      highScore: 0,
      totalCoins: 5,
      gameOversSinceLastInterstitial: 1,
    });
    expect(setSettingsFromPersisted).not.toHaveBeenCalled();
    expect(changeLanguage).not.toHaveBeenCalled();
  });

  it('swallows storage errors during hydration', async () => {
    (AsyncStorage.getItem as jest.Mock).mockImplementation(() =>
      Promise.reject(new Error('boom'))
    );

    await expect(hydrateStore()).resolves.toBeUndefined();
    expect(setFromPersisted).not.toHaveBeenCalled();
  });

  it('hydrates settings without optional fields', async () => {
    const storage: Record<string, string> = {
      '@onetapdodge/settings': '{"soundOn":true,"musicOn":false,"hapticsOn":true}',
    };
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) =>
      Promise.resolve(storage[key] ?? null)
    );

    await hydrateStore();

    expect(setSettingsFromPersisted).toHaveBeenCalledWith({
      soundOn: true,
      musicOn: false,
      hapticsOn: true,
    });
    expect(changeLanguage).not.toHaveBeenCalled();
  });

  it('persists data using AsyncStorage', () => {
    persistHighScore(10);
    persistTotalCoins(20);
    persistUnlockedSkins(['classic', 'magma']);
    persistEquippedSkin('magma');
    persistSettings({
      soundOn: true,
      musicOn: false,
      hapticsOn: true,
      themeMode: 'system',
      locale: 'pt-BR',
    });
    persistGameOversSinceLastInterstitial(2);

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
