import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { usePersistedStore } from '../src/hooks/usePersistedStore';
import { useGameStore } from '../src/state/store';
import {
  hydrateStore,
  persistEquippedSkin,
  persistGameOversSinceLastInterstitial,
  persistHighScore,
  persistSettings,
  persistTotalCoins,
  persistUnlockedSkins,
} from '../src/state/persistence';

jest.mock('../src/state/persistence', () => ({
  hydrateStore: jest.fn(),
  persistHighScore: jest.fn(),
  persistTotalCoins: jest.fn(),
  persistUnlockedSkins: jest.fn(),
  persistEquippedSkin: jest.fn(),
  persistSettings: jest.fn(),
  persistGameOversSinceLastInterstitial: jest.fn(),
}));

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

const HookHarness = () => {
  usePersistedStore();
  return null;
};

describe('hooks/usePersistedStore', () => {
  beforeEach(() => {
    resetStore();
    jest.clearAllMocks();
  });

  it('hydrates once and persists changes', () => {
    act(() => {
      ReactTestRenderer.create(
        <React.StrictMode>
          <HookHarness />
        </React.StrictMode>
      );
    });

    expect(hydrateStore).toHaveBeenCalledTimes(1);

    act(() => {
      useGameStore.setState({
        highScore: 10,
        totalCoins: 5,
        unlockedSkins: ['classic', 'magma'],
        equippedSkinId: 'magma',
        gameOversSinceLastInterstitial: 2,
        soundOn: false,
        musicOn: false,
        hapticsOn: false,
        themeMode: 'dark',
        locale: 'es',
      });
    });

    expect(persistHighScore).toHaveBeenCalledWith(10);
    expect(persistTotalCoins).toHaveBeenCalledWith(5);
    expect(persistUnlockedSkins).toHaveBeenCalledWith(['classic', 'magma']);
    expect(persistEquippedSkin).toHaveBeenCalledWith('magma');
    expect(persistGameOversSinceLastInterstitial).toHaveBeenCalledWith(2);
    expect(persistSettings).toHaveBeenCalledWith({
      soundOn: false,
      musicOn: false,
      hapticsOn: false,
      themeMode: 'dark',
      locale: 'es',
    });

    act(() => {
      useGameStore.setState({ unlockedSkins: ['classic', 'matrix'] });
    });

    expect(persistUnlockedSkins).toHaveBeenLastCalledWith(['classic', 'matrix']);

    act(() => {
      useGameStore.setState({ highScore: 11 });
    });

    expect(persistHighScore).toHaveBeenCalledWith(11);
    expect(persistSettings).toHaveBeenCalledTimes(1);
  });
});
