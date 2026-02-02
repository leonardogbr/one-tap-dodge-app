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
  shieldMeter: number; // 0–1, fills from coins
  /** Actions */
  setPhase: (phase: GamePhase) => void;
  setScore: (score: number) => void;
  setCoinsThisRun: (n: number) => void;
  addCoinsThisRun: (n: number) => void;
  setHighScore: (n: number) => void;
  setCanRevive: (v: boolean) => void;
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

export interface SettingsSlice {
  soundOn: boolean;
  musicOn: boolean;
  hapticsOn: boolean;
  removeAds: boolean;
  setSetting: <K extends keyof Omit<SettingsSlice, 'setSetting' | 'setFromPersisted'>>(
    key: K,
    value: SettingsSlice[K]
  ) => void;
  setSettingsFromPersisted: (data: Partial<Pick<SettingsSlice, 'soundOn' | 'musicOn' | 'hapticsOn' | 'removeAds'>>) => void;
}

export const SKIN_IDS = ['classic', 'cyber_blue', 'magma', 'matrix', 'void', 'neon_striker'] as const;
export type SkinId = (typeof SKIN_IDS)[number];

export const SKIN_COSTS: Record<string, number> = {
  classic: 0,
  cyber_blue: 0,
  magma: 500,
  matrix: 1000,
  void: 500,
  neon_striker: 1500,
};

export const useGameStore = create<GameSlice & ProgressSlice & SettingsSlice>((set, get) => ({
  // Game
  phase: 'idle',
  score: 0,
  coinsThisRun: 0,
  highScore: 0,
  canRevive: true,
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
  removeAds: false,
  setSetting: (key, value) => set({ [key]: value }),
  setSettingsFromPersisted: (data) => set(data),
}));
