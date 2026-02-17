/**
 * Zustand store — game, progress, settings.
 * Phase 2: high score, totalCoins, shield, skins, persistence.
 */

import { create } from 'zustand';

export type GamePhase = 'idle' | 'playing' | 'paused' | 'game_over';

/** Progress per challenge id (for the current group's 2 challenges). */
export type CurrentGroupProgress = Record<string, number>;

/** Lifetime stats for cumulative challenges. */
export interface LifetimeStats {
  totalCoins: number;
  totalScore: number;
  gamesPlayed: number;
  totalNearMisses: number;
}

export interface GameSlice {
  phase: GamePhase;
  score: number;
  coinsThisRun: number;
  nearMissesThisRun: number;
  highScore: number;
  /** Last run's score (set when run ends); shown on Home. */
  lastScore: number;
  canRevive: boolean;
  /** How many revives (rewarded ads) used this run; reset on startRun. */
  revivesUsedThisRun: number;
  shieldMeter: number; // 0–1, fills from coins
  /** Score multiplier 1.0–10.0, persistent; applied to raw score. */
  scoreMultiplier: number;
  /** Current challenge group index (0–17). */
  challengeGroupIndex: number;
  /** Progress for the 2 challenges of the current group (challengeId -> value). */
  currentGroupProgress: CurrentGroupProgress;
  /** Lifetime stats baseline when current group started (for cumulative challenges to start from 0). */
  challengeGroupBaseline: LifetimeStats;
  /** True after startRun(), false after claimReward(). Run challenges only count when true. */
  runStartedAfterClaim: boolean;
  /** Lifetime stats for cumulative challenges. */
  lifetimeStats: LifetimeStats;
  /** Actions */
  setPhase: (phase: GamePhase) => void;
  /** rawScore: game loop sends unmultiplied score; store applies scoreMultiplier for display and high score. */
  setScore: (rawScore: number) => void;
  setCoinsThisRun: (n: number) => void;
  addCoinsThisRun: (n: number) => void;
  addNearMissesThisRun: (n: number) => void;
  setHighScore: (n: number) => void;
  setCanRevive: (v: boolean) => void;
  incrementRevivesUsedThisRun: () => void;
  setShieldMeter: (v: number) => void;
  consumeShield: () => boolean;
  startRun: () => void;
  endRun: () => void;
  setScoreMultiplier: (v: number) => void;
  setChallengeGroupIndex: (v: number) => void;
  setCurrentGroupProgress: (v: CurrentGroupProgress) => void;
  setChallengeGroupBaseline: (v: LifetimeStats) => void;
  updateChallengeProgress: (challengeId: string, value: number) => void;
  /** Add run stats to lifetime and update progress for cumulative challenges. */
  addRunToLifetimeStats: (run: { coins: number; score: number; nearMisses: number }) => void;
  completeChallengeGroup: (nextGroupProgress: CurrentGroupProgress) => void;
  /** Set by GameOverScreen when user earns revive from ad; GameScreen reads and triggers revive then clears. */
  reviveEarnedFromAd: boolean;
  setReviveEarnedFromAd: (v: boolean) => void;
  /** True when both challenges in current group are complete and reward can be claimed. */
  rewardAvailable: boolean;
  setRewardAvailable: (v: boolean) => void;
  /** Claim reward: apply multiplier increase and advance to next group. */
  claimReward: () => void;
}

export interface ProgressSlice {
  totalCoins: number;
  unlockedSkins: string[];
  equippedSkinId: string;
  gamesPlayed: number;
  gameOversSinceLastInterstitial: number;
  addTotalCoins: (n: number) => void;
  unlockSkin: (skinId: string) => void;
  equipSkin: (skinId: string) => void;
  incrementGamesPlayed: () => void;
  incrementGameOversSinceLastInterstitial: () => void;
  resetGameOversSinceLastInterstitial: () => void;
  setFromPersisted: (data: Partial<Pick<ProgressSlice, 'totalCoins' | 'unlockedSkins' | 'equippedSkinId' | 'gameOversSinceLastInterstitial'> & { highScore?: number; lastScore?: number; scoreMultiplier?: number; challengeGroupIndex?: number; currentGroupProgress?: CurrentGroupProgress; challengeGroupBaseline?: LifetimeStats; lifetimeStats?: LifetimeStats; rewardAvailable?: boolean }>) => void;
}

export type ThemeMode = 'dark' | 'light' | 'system';
export type LocaleCode = 'pt-BR' | 'es' | 'en' | 'system';

export interface SettingsSlice {
  soundOn: boolean;
  musicOn: boolean;
  hapticsOn: boolean;
  themeMode: ThemeMode;
  locale: LocaleCode;
  setSetting: <K extends keyof Omit<SettingsSlice, 'setSetting' | 'setSettingsFromPersisted'>>(
    key: K,
    value: SettingsSlice[K]
  ) => void;
  setSettingsFromPersisted: (data: Partial<Pick<SettingsSlice, 'soundOn' | 'musicOn' | 'hapticsOn' | 'themeMode' | 'locale'>>) => void;
}

export const SKIN_IDS = [
  'classic',
  'cyber_blue',
  'magma',
  'matrix',
  'void',
  'neon_striker',
  'gold_ace',
  'phantom',
  'inferno',
  'sunset_fade',
  'ocean_fade',
  'aurora_shift',
  'rose_gold',
  'platinum_edge',
  'sapphire',
  'emerald',
  'amethyst',
  'ruby',
  'topaz',
  'diamond',
  'celestial_pulse',
] as const;
export type SkinId = (typeof SKIN_IDS)[number];

export const SKIN_COSTS: Record<string, number> = {
  classic: 0,
  cyber_blue: 500,
  magma: 1200,
  matrix: 2500,
  void: 4000,
  neon_striker: 6500,
  gold_ace: 9500,
  phantom: 14000,
  inferno: 20000,
  sunset_fade: 27000,
  ocean_fade: 35000,
  aurora_shift: 44000,
  rose_gold: 50000,
  platinum_edge: 57000,
  sapphire: 64000,
  emerald: 71000,
  amethyst: 78000,
  ruby: 85000,
  topaz: 92000,
  diamond: 97000,
  celestial_pulse: 100000,
};

/** Skin used for Home preview (most premium). */
export const PRIME_SKIN_ID = 'celestial_pulse';

export type SkinVisual = {
  base: string;
  highlight?: string;
  shadow?: string;
  edge?: string;
  pulse?: boolean;
};

/** Skin visuals for preview and in-game player (gradients, metals, gems, pulse). */
export const SKIN_VISUALS: Record<string, SkinVisual> = {
  classic: {
    base: '#38e8ff',
    highlight: '#a7f4ff',
    shadow: '#0bbcd4',
  },
  cyber_blue: {
    base: '#2196f3',
    highlight: '#90caf9',
    shadow: '#0d47a1',
  },
  magma: {
    base: '#ff5722',
    highlight: '#ff8a50',
    shadow: '#d84315',
  },
  matrix: {
    base: '#9c27b0',
    highlight: '#d05ce3',
    shadow: '#6a0080',
  },
  void: {
    base: '#673ab7',
    highlight: '#9a67ea',
    shadow: '#311b92',
  },
  neon_striker: {
    base: '#00e676',
    highlight: '#69f0ae',
    shadow: '#00a152',
  },
  gold_ace: {
    base: '#ffd700',
    highlight: '#fff3b0',
    shadow: '#c8a400',
    edge: '#fff5cc',
  },
  phantom: {
    base: '#b0bec5',
    highlight: '#e2f1f8',
    shadow: '#78909c',
  },
  inferno: {
    base: '#ff1744',
    highlight: '#ff8a80',
    shadow: '#c51162',
  },
  sunset_fade: {
    base: '#ff6f61',
    highlight: '#ffd1b3',
    shadow: '#c62828',
  },
  ocean_fade: {
    base: '#00bcd4',
    highlight: '#b2ebf2',
    shadow: '#006064',
  },
  aurora_shift: {
    base: '#7c4dff',
    highlight: '#69f0ae',
    shadow: '#311b92',
  },
  rose_gold: {
    base: '#e6a8a1',
    highlight: '#f9dcd6',
    shadow: '#b76e79',
    edge: '#ffe7e2',
  },
  platinum_edge: {
    base: '#cfd8dc',
    highlight: '#ffffff',
    shadow: '#90a4ae',
    edge: '#eceff1',
  },
  sapphire: {
    base: '#1e88e5',
    highlight: '#90caf9',
    shadow: '#0d47a1',
    edge: '#b3e5fc',
  },
  emerald: {
    base: '#00c853',
    highlight: '#69f0ae',
    shadow: '#007e33',
    edge: '#b9f6ca',
  },
  amethyst: {
    base: '#8e24aa',
    highlight: '#ce93d8',
    shadow: '#4a148c',
    edge: '#e1bee7',
  },
  ruby: {
    base: '#d32f2f',
    highlight: '#ff8a80',
    shadow: '#8e0000',
    edge: '#ffcdd2',
  },
  topaz: {
    base: '#ffb300',
    highlight: '#ffe082',
    shadow: '#ef6c00',
    edge: '#fff3b0',
  },
  diamond: {
    base: '#e0f7fa',
    highlight: '#ffffff',
    shadow: '#4dd0e1',
    edge: '#b2ebf2',
  },
  celestial_pulse: {
    base: '#00e5ff',
    highlight: '#b3f5ff',
    shadow: '#2962ff',
    edge: '#e0f7ff',
    pulse: true,
  },
};

const MAX_SCORE_MULTIPLIER = 10;

const defaultLifetimeStats: LifetimeStats = {
  totalCoins: 0,
  totalScore: 0,
  gamesPlayed: 0,
  totalNearMisses: 0,
};

export const useGameStore = create<GameSlice & ProgressSlice & SettingsSlice>((set, get) => ({
  // Game
  phase: 'idle',
  score: 0,
  coinsThisRun: 0,
  nearMissesThisRun: 0,
  highScore: 0,
  lastScore: 0,
  canRevive: true,
  revivesUsedThisRun: 0,
  shieldMeter: 0,
  scoreMultiplier: 1,
  challengeGroupIndex: 0,
  currentGroupProgress: {},
  challengeGroupBaseline: defaultLifetimeStats,
  runStartedAfterClaim: false,
  lifetimeStats: defaultLifetimeStats,
  reviveEarnedFromAd: false,
  rewardAvailable: false,
  setPhase: (phase) => set({ phase }),
  setScore: (score) => {
    // Score already has multiplier applied in game loop
    const { highScore } = get();
    set({ score, highScore: Math.max(highScore, score) });
  },
  setCoinsThisRun: (n) => set({ coinsThisRun: n }),
  addCoinsThisRun: (n) => set((s) => ({ coinsThisRun: s.coinsThisRun + n })),
  addNearMissesThisRun: (n) =>
    set((s) => ({ nearMissesThisRun: s.nearMissesThisRun + n })),
  setHighScore: (n) => set({ highScore: n }),
  setCanRevive: (v) => set({ canRevive: v }),
  incrementRevivesUsedThisRun: () =>
    set((s) => ({ revivesUsedThisRun: s.revivesUsedThisRun + 1 })),
  setShieldMeter: (v) => set({ shieldMeter: Math.min(1, Math.max(0, v)) }),
  consumeShield: () => {
    const { shieldMeter } = get();
    if (shieldMeter >= 1) {
      set({ shieldMeter: 0 });
      return true;
    }
    return false;
  },
  startRun: () =>
    set({
      phase: 'playing',
      score: 0,
      coinsThisRun: 0,
      nearMissesThisRun: 0,
      canRevive: true,
      revivesUsedThisRun: 0,
      shieldMeter: 0,
      runStartedAfterClaim: true,
    }),
  endRun: () => {
    const { coinsThisRun, totalCoins, score } = get();
    // Score already has multiplier applied
    set({
      phase: 'game_over',
      totalCoins: totalCoins + coinsThisRun,
      gameOversSinceLastInterstitial: get().gameOversSinceLastInterstitial + 1,
      lastScore: score,
    });
  },
  setScoreMultiplier: (v) =>
    set({ scoreMultiplier: Math.min(MAX_SCORE_MULTIPLIER, Math.max(1, v)) }),
  setChallengeGroupIndex: (v) =>
    set({ challengeGroupIndex: Math.max(0, Math.min(17, v)) }),
  setCurrentGroupProgress: (v) => set({ currentGroupProgress: v }),
  setChallengeGroupBaseline: (v) => set({ challengeGroupBaseline: v }),
  updateChallengeProgress: (challengeId, value) =>
    set((s) => ({
      currentGroupProgress: { ...s.currentGroupProgress, [challengeId]: value },
    })),
  addRunToLifetimeStats: (run) =>
    set((s) => ({
      lifetimeStats: {
        totalCoins: s.totalCoins,
        totalScore: s.lifetimeStats.totalScore + run.score,
        gamesPlayed: s.lifetimeStats.gamesPlayed + 1,
        totalNearMisses: s.lifetimeStats.totalNearMisses + run.nearMisses,
      },
    })),
  setReviveEarnedFromAd: (v) => set({ reviveEarnedFromAd: v }),
  setRewardAvailable: (v) => set({ rewardAvailable: v }),
  claimReward: () =>
    set((s) => {
      const nextGroupIdx = Math.min(17, s.challengeGroupIndex + 1);
      const { getInitialProgressForGroup } = require('../engine/challenges');
      
      // Get initial progress for new group (all zeros - both run and cumulative start from 0)
      const nextProgress = nextGroupIdx <= 17 ? getInitialProgressForGroup(nextGroupIdx) : {};
      
      // Set baseline to current lifetime stats so cumulative challenges count from this point forward
      const newBaseline = { ...s.lifetimeStats };
      
      return {
        scoreMultiplier: Math.min(MAX_SCORE_MULTIPLIER, s.scoreMultiplier + 0.5),
        challengeGroupIndex: nextGroupIdx,
        currentGroupProgress: nextProgress, // All challenges start from 0
        challengeGroupBaseline: newBaseline, // Save baseline for cumulative challenges
        runStartedAfterClaim: false, // Run challenges only count from the next game
        rewardAvailable: false,
      };
    }),
  completeChallengeGroup: (nextGroupProgress) =>
    set((s) => ({
      scoreMultiplier: Math.min(MAX_SCORE_MULTIPLIER, s.scoreMultiplier + 0.5),
      challengeGroupIndex: Math.min(17, s.challengeGroupIndex + 1),
      currentGroupProgress: nextGroupProgress,
    })),

  // Progress
  totalCoins: 0,
  unlockedSkins: ['classic'],
  equippedSkinId: 'classic',
  gamesPlayed: 0,
  gameOversSinceLastInterstitial: 0,
  addTotalCoins: (n) =>
    set((s) => ({ totalCoins: Math.max(0, s.totalCoins + n) })),
  unlockSkin: (skinId) =>
    set((s) =>
      s.unlockedSkins.includes(skinId) ? s : { unlockedSkins: [...s.unlockedSkins, skinId] }
    ),
  equipSkin: (skinId) => set({ equippedSkinId: skinId }),
  incrementGamesPlayed: () => set((s) => ({ gamesPlayed: s.gamesPlayed + 1 })),
  incrementGameOversSinceLastInterstitial: () =>
    set((s) => ({ gameOversSinceLastInterstitial: s.gameOversSinceLastInterstitial + 1 })),
  resetGameOversSinceLastInterstitial: () => set({ gameOversSinceLastInterstitial: 0 }),
  setFromPersisted: (data) => set(data),

  // Settings
  soundOn: true,
  musicOn: true,
  hapticsOn: true,
  themeMode: 'system',
  locale: 'system',
  setSetting: (key, value) => set({ [key]: value }),
  setSettingsFromPersisted: (data) => set(data),
}));
