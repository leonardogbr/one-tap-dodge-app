/**
 * Zustand store — game, progress, settings.
 * Phase 2: high score, totalCoins, shield, skins, persistence.
 */

import { create } from 'zustand';

export type GamePhase = 'idle' | 'playing' | 'paused' | 'game_over';

export interface GameSlice {
  phase: GamePhase;
  score: number;
  coinsThisRun: number;
  highScore: number;
  canRevive: boolean;
  /** How many revives (rewarded ads) used this run; reset on startRun. */
  revivesUsedThisRun: number;
  shieldMeter: number; // 0–1, fills from coins
  /** Actions */
  setPhase: (phase: GamePhase) => void;
  setScore: (score: number) => void;
  setCoinsThisRun: (n: number) => void;
  addCoinsThisRun: (n: number) => void;
  setHighScore: (n: number) => void;
  setCanRevive: (v: boolean) => void;
  incrementRevivesUsedThisRun: () => void;
  setShieldMeter: (v: number) => void;
  consumeShield: () => boolean;
  startRun: () => void;
  endRun: () => void;
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
  setFromPersisted: (data: Partial<Pick<ProgressSlice, 'totalCoins' | 'unlockedSkins' | 'equippedSkinId' | 'gameOversSinceLastInterstitial'> & { highScore?: number }>) => void;
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
  'celestial_pulse',
] as const;
export type SkinId = (typeof SKIN_IDS)[number];

export const SKIN_COSTS: Record<string, number> = {
  classic: 0,
  cyber_blue: 200,
  magma: 500,
  matrix: 900,
  void: 1300,
  neon_striker: 1800,
  gold_ace: 2500,
  phantom: 3300,
  inferno: 4400,
  sunset_fade: 5800,
  ocean_fade: 7400,
  aurora_shift: 9300,
  rose_gold: 11600,
  platinum_edge: 14300,
  sapphire: 17500,
  emerald: 21200,
  amethyst: 25400,
  celestial_pulse: 30000,
};

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
  celestial_pulse: {
    base: '#00e5ff',
    highlight: '#b3f5ff',
    shadow: '#2962ff',
    edge: '#e0f7ff',
    pulse: true,
  },
};

export const useGameStore = create<GameSlice & ProgressSlice & SettingsSlice>((set, get) => ({
  // Game
  phase: 'idle',
  score: 0,
  coinsThisRun: 0,
  highScore: 0,
  canRevive: true,
  revivesUsedThisRun: 0,
  shieldMeter: 0,
  setPhase: (phase) => set({ phase }),
  setScore: (score) => {
    const { highScore } = get();
    set({ score, highScore: Math.max(highScore, score) });
  },
  setCoinsThisRun: (n) => set({ coinsThisRun: n }),
  addCoinsThisRun: (n) => set((s) => ({ coinsThisRun: s.coinsThisRun + n })),
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
      canRevive: true,
      revivesUsedThisRun: 0,
      shieldMeter: 0,
    }),
  endRun: () => {
    const { coinsThisRun, totalCoins } = get();
    set({
      phase: 'game_over',
      totalCoins: totalCoins + coinsThisRun,
      gameOversSinceLastInterstitial: get().gameOversSinceLastInterstitial + 1,
    });
  },

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
