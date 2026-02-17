/**
 * AsyncStorage persistence — hydrate on load, write on change.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useGameStore } from './store';
import type { CurrentGroupProgress, LifetimeStats } from './store';
import { changeLanguage } from '../i18n';

const KEY_HIGH_SCORE = '@onetapdodge/highScore';
const KEY_LAST_SCORE = '@onetapdodge/lastScore';
const KEY_TOTAL_COINS = '@onetapdodge/totalCoins';
const KEY_UNLOCKED_SKINS = '@onetapdodge/unlockedSkins';
const KEY_EQUIPPED_SKIN = '@onetapdodge/equippedSkinId';
const KEY_SETTINGS = '@onetapdodge/settings';
const KEY_GAME_OVERS_INTERSTITIAL = '@onetapdodge/gameOversSinceLastInterstitial';
const KEY_SCORE_MULTIPLIER = '@onetapdodge/scoreMultiplier';
const KEY_CHALLENGE_GROUP_INDEX = '@onetapdodge/challengeGroupIndex';
const KEY_CURRENT_GROUP_PROGRESS = '@onetapdodge/currentGroupProgress';
const KEY_CHALLENGE_GROUP_BASELINE = '@onetapdodge/challengeGroupBaseline';
const KEY_LIFETIME_STATS = '@onetapdodge/lifetimeStats';
const KEY_REWARD_AVAILABLE = '@onetapdodge/rewardAvailable';

export async function hydrateStore(): Promise<void> {
  try {
    const [
      highScore,
      lastScore,
      totalCoins,
      unlockedSkins,
      equippedSkinId,
      settingsJson,
      gameOvers,
      scoreMultiplier,
      challengeGroupIndex,
      currentGroupProgressJson,
      challengeGroupBaselineJson,
      lifetimeStatsJson,
      rewardAvailable,
    ] = await Promise.all([
      AsyncStorage.getItem(KEY_HIGH_SCORE),
      AsyncStorage.getItem(KEY_LAST_SCORE),
      AsyncStorage.getItem(KEY_TOTAL_COINS),
      AsyncStorage.getItem(KEY_UNLOCKED_SKINS),
      AsyncStorage.getItem(KEY_EQUIPPED_SKIN),
      AsyncStorage.getItem(KEY_SETTINGS),
      AsyncStorage.getItem(KEY_GAME_OVERS_INTERSTITIAL),
      AsyncStorage.getItem(KEY_SCORE_MULTIPLIER),
      AsyncStorage.getItem(KEY_CHALLENGE_GROUP_INDEX),
      AsyncStorage.getItem(KEY_CURRENT_GROUP_PROGRESS),
      AsyncStorage.getItem(KEY_CHALLENGE_GROUP_BASELINE),
      AsyncStorage.getItem(KEY_LIFETIME_STATS),
      AsyncStorage.getItem(KEY_REWARD_AVAILABLE),
    ]);

    const updates: Record<string, unknown> = {};
    if (highScore != null) updates.highScore = parseInt(highScore, 10) || 0;
    if (lastScore != null) updates.lastScore = parseInt(lastScore, 10) || 0;
    if (totalCoins != null) updates.totalCoins = parseInt(totalCoins, 10) || 0;
    if (unlockedSkins != null) {
      try {
        updates.unlockedSkins = JSON.parse(unlockedSkins) as string[];
      } catch {
        // ignore
      }
    }
    if (equippedSkinId != null) updates.equippedSkinId = equippedSkinId;
    if (gameOvers != null)
      updates.gameOversSinceLastInterstitial = parseInt(gameOvers, 10);
    if (scoreMultiplier != null) {
      const v = parseFloat(scoreMultiplier);
      if (Number.isFinite(v) && v >= 1 && v <= 10)
        updates.scoreMultiplier = v;
    }
    if (challengeGroupIndex != null) {
      const v = parseInt(challengeGroupIndex, 10);
      if (Number.isInteger(v) && v >= 0 && v <= 17)
        updates.challengeGroupIndex = v;
    }
    if (currentGroupProgressJson != null) {
      try {
        updates.currentGroupProgress = JSON.parse(currentGroupProgressJson) as CurrentGroupProgress;
      } catch {
        // ignore
      }
    }
    if (challengeGroupBaselineJson != null) {
      try {
        updates.challengeGroupBaseline = JSON.parse(challengeGroupBaselineJson) as LifetimeStats;
      } catch {
        // ignore
      }
    }
    if (lifetimeStatsJson != null) {
      try {
        updates.lifetimeStats = JSON.parse(lifetimeStatsJson) as LifetimeStats;
      } catch {
        // ignore
      }
    }
    if (rewardAvailable != null) {
      updates.rewardAvailable = rewardAvailable === 'true';
    }

    useGameStore.getState().setFromPersisted(updates as never);

    if (settingsJson != null) {
      try {
        const settings = JSON.parse(settingsJson) as {
          soundOn?: boolean;
          musicOn?: boolean;
          hapticsOn?: boolean;
          themeMode?: string;
          locale?: string;
        };
        const settingsToApply: {
          soundOn?: boolean;
          musicOn?: boolean;
          hapticsOn?: boolean;
          themeMode?: 'dark' | 'light' | 'system';
          locale?: 'pt-BR' | 'es' | 'en' | 'system';
        } = {
          soundOn: settings.soundOn,
          musicOn: settings.musicOn,
          hapticsOn: settings.hapticsOn,
        };
        if (settings.themeMode != null) {
          settingsToApply.themeMode = settings.themeMode as 'dark' | 'light' | 'system';
        }
        if (settings.locale != null) {
          settingsToApply.locale = settings.locale as 'pt-BR' | 'es' | 'en' | 'system';
        }
        useGameStore.getState().setSettingsFromPersisted(settingsToApply);
        const savedLocale = settings.locale;
        if (typeof savedLocale === 'string') changeLanguage(savedLocale as 'pt-BR' | 'es' | 'en' | 'system');
      } catch {
        // ignore
      }
    }
  } catch (e) {
    // ignore persistence errors on load
  }
}

export function persistHighScore(highScore: number): void {
  AsyncStorage.setItem(KEY_HIGH_SCORE, String(highScore));
}

export function persistLastScore(lastScore: number): void {
  AsyncStorage.setItem(KEY_LAST_SCORE, String(lastScore));
}

export function persistTotalCoins(totalCoins: number): void {
  AsyncStorage.setItem(KEY_TOTAL_COINS, String(totalCoins));
}

export function persistUnlockedSkins(unlockedSkins: string[]): void {
  AsyncStorage.setItem(KEY_UNLOCKED_SKINS, JSON.stringify(unlockedSkins));
}

export function persistEquippedSkin(equippedSkinId: string): void {
  AsyncStorage.setItem(KEY_EQUIPPED_SKIN, equippedSkinId);
}

export function persistSettings(settings: {
  soundOn: boolean;
  musicOn: boolean;
  hapticsOn: boolean;
  themeMode: string;
  locale: string;
}): void {
  AsyncStorage.setItem(KEY_SETTINGS, JSON.stringify(settings));
}

export function persistGameOversSinceLastInterstitial(n: number): void {
  AsyncStorage.setItem(KEY_GAME_OVERS_INTERSTITIAL, String(n));
}

export function persistScoreMultiplier(v: number): void {
  AsyncStorage.setItem(KEY_SCORE_MULTIPLIER, String(v));
}

export function persistChallengeGroupIndex(v: number): void {
  AsyncStorage.setItem(KEY_CHALLENGE_GROUP_INDEX, String(v));
}

export function persistCurrentGroupProgress(progress: CurrentGroupProgress): void {
  AsyncStorage.setItem(KEY_CURRENT_GROUP_PROGRESS, JSON.stringify(progress));
}

export function persistChallengeGroupBaseline(baseline: LifetimeStats): void {
  AsyncStorage.setItem(KEY_CHALLENGE_GROUP_BASELINE, JSON.stringify(baseline));
}

export function persistLifetimeStats(stats: LifetimeStats): void {
  AsyncStorage.setItem(KEY_LIFETIME_STATS, JSON.stringify(stats));
}

export function persistRewardAvailable(v: boolean): void {
  AsyncStorage.setItem(KEY_REWARD_AVAILABLE, String(v));
}
