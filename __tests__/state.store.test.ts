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

  describe('trophies', () => {
    it('unlockTrophy adds a trophy to earnedTrophies', () => {
      useGameStore.getState().unlockTrophy('first_step');
      expect(useGameStore.getState().earnedTrophies).toContain('first_step');
    });

    it('unlockTrophy does not duplicate already earned trophies', () => {
      useGameStore.getState().unlockTrophy('first_step');
      useGameStore.getState().unlockTrophy('first_step');
      const earned = useGameStore.getState().earnedTrophies.filter((id) => id === 'first_step');
      expect(earned).toHaveLength(1);
    });

    it('evaluateAndUnlockTrophies unlocks trophies based on state', () => {
      useGameStore.setState({
        highScore: 200,
        lifetimeStats: { totalCoins: 5, totalScore: 200, gamesPlayed: 3, totalNearMisses: 2 },
      });
      const newlyUnlocked = useGameStore.getState().evaluateAndUnlockTrophies();
      expect(newlyUnlocked).toContain('first_step');
      expect(newlyUnlocked).toContain('first_coin');
      expect(newlyUnlocked).toContain('first_near_miss');
      expect(newlyUnlocked).toContain('high_score_100');
      expect(useGameStore.getState().earnedTrophies).toEqual(expect.arrayContaining(newlyUnlocked));
    });

    it('evaluateAndUnlockTrophies uses runStats when provided', () => {
      useGameStore.setState({
        lifetimeStats: { totalCoins: 0, totalScore: 0, gamesPlayed: 0, totalNearMisses: 0 },
      });
      const result = useGameStore.getState().evaluateAndUnlockTrophies({ coins: 15, nearMisses: 5 });
      expect(result).toContain('coins_run_15');
      expect(result).toContain('near_miss_run_5');
    });

    it('evaluateAndUnlockTrophies does not re-unlock earned trophies', () => {
      useGameStore.setState({
        highScore: 200,
        lifetimeStats: { totalCoins: 5, totalScore: 200, gamesPlayed: 3, totalNearMisses: 2 },
      });
      const first = useGameStore.getState().evaluateAndUnlockTrophies();
      expect(first.length).toBeGreaterThan(0);

      const second = useGameStore.getState().evaluateAndUnlockTrophies();
      expect(second).toEqual([]);
    });

    it('markTrophiesSeen copies earnedTrophies to seenTrophyIds', () => {
      useGameStore.getState().unlockTrophy('first_step');
      useGameStore.getState().unlockTrophy('first_coin');
      expect(useGameStore.getState().seenTrophyIds).toEqual([]);

      useGameStore.getState().markTrophiesSeen();
      expect(useGameStore.getState().seenTrophyIds).toEqual(['first_step', 'first_coin']);
    });

    it('setFromPersisted restores earnedTrophies and seenTrophyIds', () => {
      useGameStore.getState().setFromPersisted({
        earnedTrophies: ['first_step', 'high_score_100'],
        seenTrophyIds: ['first_step'],
      });
      expect(useGameStore.getState().earnedTrophies).toEqual(['first_step', 'high_score_100']);
      expect(useGameStore.getState().seenTrophyIds).toEqual(['first_step']);
    });

    it('unlockSkin triggers trophy evaluation', () => {
      useGameStore.setState({
        highScore: 200,
        lifetimeStats: { totalCoins: 5, totalScore: 200, gamesPlayed: 1, totalNearMisses: 1 },
      });
      useGameStore.getState().unlockSkin('magma');
      expect(useGameStore.getState().earnedTrophies).toContain('first_skin');
    });
  });

  describe('challenge and lifetime stats', () => {
    it('addNearMissesThisRun increments near misses', () => {
      useGameStore.setState({ nearMissesThisRun: 0 });
      useGameStore.getState().addNearMissesThisRun(3);
      expect(useGameStore.getState().nearMissesThisRun).toBe(3);
    });

    it('setScoreMultiplier clamps between 1 and max', () => {
      useGameStore.getState().setScoreMultiplier(5);
      expect(useGameStore.getState().scoreMultiplier).toBe(5);

      useGameStore.getState().setScoreMultiplier(0);
      expect(useGameStore.getState().scoreMultiplier).toBe(1);

      useGameStore.getState().setScoreMultiplier(999);
      expect(useGameStore.getState().scoreMultiplier).toBe(10);
    });

    it('setChallengeGroupIndex clamps between 0 and 17', () => {
      useGameStore.getState().setChallengeGroupIndex(5);
      expect(useGameStore.getState().challengeGroupIndex).toBe(5);

      useGameStore.getState().setChallengeGroupIndex(-1);
      expect(useGameStore.getState().challengeGroupIndex).toBe(0);

      useGameStore.getState().setChallengeGroupIndex(99);
      expect(useGameStore.getState().challengeGroupIndex).toBe(17);
    });

    it('setCurrentGroupProgress and updateChallengeProgress', () => {
      useGameStore.getState().setCurrentGroupProgress({ ch_a: 0, ch_b: 0 });
      expect(useGameStore.getState().currentGroupProgress).toEqual({ ch_a: 0, ch_b: 0 });

      useGameStore.getState().updateChallengeProgress('ch_a', 7);
      expect(useGameStore.getState().currentGroupProgress).toEqual({ ch_a: 7, ch_b: 0 });
    });

    it('setChallengeGroupBaseline stores baseline stats', () => {
      const baseline = { totalCoins: 10, totalScore: 50, gamesPlayed: 3, totalNearMisses: 2 };
      useGameStore.getState().setChallengeGroupBaseline(baseline);
      expect(useGameStore.getState().challengeGroupBaseline).toEqual(baseline);
    });

    it('addRunToLifetimeStats accumulates stats', () => {
      useGameStore.setState({
        lifetimeStats: { totalCoins: 0, totalScore: 0, gamesPlayed: 0, totalNearMisses: 0 },
      });
      useGameStore.getState().addRunToLifetimeStats({ coins: 5, score: 100, nearMisses: 3 });
      expect(useGameStore.getState().lifetimeStats).toEqual({
        totalCoins: 5,
        totalScore: 100,
        gamesPlayed: 1,
        totalNearMisses: 3,
      });
    });

    it('setReviveEarnedFromAd and setRewardAvailable', () => {
      useGameStore.getState().setReviveEarnedFromAd(true);
      expect(useGameStore.getState().reviveEarnedFromAd).toBe(true);

      useGameStore.getState().setRewardAvailable(true);
      expect(useGameStore.getState().rewardAvailable).toBe(true);
    });

    it('claimReward advances group and resets progress', () => {
      useGameStore.setState({
        challengeGroupIndex: 2,
        scoreMultiplier: 1,
        rewardAvailable: true,
        lifetimeStats: { totalCoins: 20, totalScore: 300, gamesPlayed: 5, totalNearMisses: 4 },
      });

      useGameStore.getState().claimReward();

      const s = useGameStore.getState();
      expect(s.challengeGroupIndex).toBe(3);
      expect(s.scoreMultiplier).toBe(1.5);
      expect(s.rewardAvailable).toBe(false);
      expect(s.runStartedAfterClaim).toBe(false);
      expect(Object.keys(s.currentGroupProgress).length).toBe(2);
      Object.values(s.currentGroupProgress).forEach((v) => expect(v).toBe(0));
      expect(s.challengeGroupBaseline).toEqual({
        totalCoins: 20,
        totalScore: 300,
        gamesPlayed: 5,
        totalNearMisses: 4,
      });
    });

    it('claimReward at max group (17) stays at 17', () => {
      useGameStore.setState({ challengeGroupIndex: 17, scoreMultiplier: 9 });
      useGameStore.getState().claimReward();

      const s = useGameStore.getState();
      expect(s.challengeGroupIndex).toBe(17);
      expect(s.scoreMultiplier).toBe(9.5);
    });

  });
});
