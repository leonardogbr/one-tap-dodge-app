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
  persistLastScore,
  persistScoreMultiplier,
  persistChallengeGroupIndex,
  persistChallengeShuffleSeed,
  persistCurrentGroupProgress,
  persistChallengeGroupBaseline,
  persistLifetimeStats,
  persistRewardAvailable,
  persistEarnedTrophies,
  persistSeenTrophyIds,
} from '../src/state/persistence';

jest.mock('../src/state/persistence', () => ({
  hydrateStore: jest.fn(),
  persistHighScore: jest.fn(),
  persistTotalCoins: jest.fn(),
  persistUnlockedSkins: jest.fn(),
  persistEquippedSkin: jest.fn(),
  persistSettings: jest.fn(),
  persistGameOversSinceLastInterstitial: jest.fn(),
  persistLastScore: jest.fn(),
  persistScoreMultiplier: jest.fn(),
  persistChallengeGroupIndex: jest.fn(),
  persistChallengeShuffleSeed: jest.fn(),
  persistCurrentGroupProgress: jest.fn(),
  persistChallengeGroupBaseline: jest.fn(),
  persistLifetimeStats: jest.fn(),
  persistRewardAvailable: jest.fn(),
  persistEarnedTrophies: jest.fn(),
  persistSeenTrophyIds: jest.fn(),
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

  it('persists challenge, lifetime, trophy, and reward fields', () => {
    act(() => {
      ReactTestRenderer.create(
        <React.StrictMode>
          <HookHarness />
        </React.StrictMode>
      );
    });

    act(() => {
      useGameStore.setState({ lastScore: 42 });
    });
    expect(persistLastScore).toHaveBeenCalledWith(42);

    act(() => {
      useGameStore.setState({ scoreMultiplier: 3 });
    });
    expect(persistScoreMultiplier).toHaveBeenCalledWith(3);

    act(() => {
      useGameStore.setState({ challengeGroupIndex: 2 });
    });
    expect(persistChallengeGroupIndex).toHaveBeenCalledWith(2);

    act(() => {
      useGameStore.setState({ challengeShuffleSeed: 12345 });
    });
    expect(persistChallengeShuffleSeed).toHaveBeenCalledWith(12345);

    const progress = { group_0_challenge_0: 5, group_0_challenge_1: 3 };
    act(() => {
      useGameStore.setState({ currentGroupProgress: progress });
    });
    expect(persistCurrentGroupProgress).toHaveBeenCalledWith(progress);

    const baseline = {
      totalCoins: 10,
      totalScore: 100,
      gamesPlayed: 5,
      totalNearMisses: 3,
    };
    act(() => {
      useGameStore.setState({ challengeGroupBaseline: baseline });
    });
    expect(persistChallengeGroupBaseline).toHaveBeenCalledWith(baseline);

    const stats = {
      totalCoins: 50,
      totalScore: 500,
      gamesPlayed: 20,
      totalNearMisses: 15,
    };
    act(() => {
      useGameStore.setState({ lifetimeStats: stats });
    });
    expect(persistLifetimeStats).toHaveBeenCalledWith(stats);

    act(() => {
      useGameStore.setState({ rewardAvailable: true });
    });
    expect(persistRewardAvailable).toHaveBeenCalledWith(true);

    act(() => {
      useGameStore.setState({ earnedTrophies: ['first_step', 'first_coin'] });
    });
    expect(persistEarnedTrophies).toHaveBeenCalledWith([
      'first_step',
      'first_coin',
    ]);

    act(() => {
      useGameStore.setState({ seenTrophyIds: ['first_step'] });
    });
    expect(persistSeenTrophyIds).toHaveBeenCalledWith(['first_step']);

    // Trigger content-change branch (same length, different IDs)
    act(() => {
      useGameStore.setState({ seenTrophyIds: ['first_coin'] });
    });
    expect(persistSeenTrophyIds).toHaveBeenLastCalledWith(['first_coin']);
  });
});
