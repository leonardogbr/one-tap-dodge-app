/**
 * AsyncStorage persistence — hydrate on load, write on change.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useGameStore } from './store';
import { changeLanguage } from '../i18n';

const KEY_HIGH_SCORE = '@onetapdodge/highScore';
const KEY_TOTAL_COINS = '@onetapdodge/totalCoins';
const KEY_UNLOCKED_SKINS = '@onetapdodge/unlockedSkins';
const KEY_EQUIPPED_SKIN = '@onetapdodge/equippedSkinId';
const KEY_SETTINGS = '@onetapdodge/settings';
const KEY_GAME_OVERS_INTERSTITIAL = '@onetapdodge/gameOversSinceLastInterstitial';

export async function hydrateStore(): Promise<void> {
  try {
    const [highScore, totalCoins, unlockedSkins, equippedSkinId, settingsJson, gameOvers] =
      await Promise.all([
        AsyncStorage.getItem(KEY_HIGH_SCORE),
        AsyncStorage.getItem(KEY_TOTAL_COINS),
        AsyncStorage.getItem(KEY_UNLOCKED_SKINS),
        AsyncStorage.getItem(KEY_EQUIPPED_SKIN),
        AsyncStorage.getItem(KEY_SETTINGS),
        AsyncStorage.getItem(KEY_GAME_OVERS_INTERSTITIAL),
      ]);

    const updates: Record<string, unknown> = {};
    if (highScore != null) updates.highScore = parseInt(highScore, 10) || 0;
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

    useGameStore.getState().setFromPersisted(updates as never);

    if (settingsJson != null) {
      try {
        const settings = JSON.parse(settingsJson) as Record<string, boolean>;
        useGameStore.getState().setSettingsFromPersisted({
          soundOn: settings.soundOn,
          musicOn: settings.musicOn,
          hapticsOn: settings.hapticsOn,
          ...(settings.themeMode != null && { themeMode: settings.themeMode }),
          ...(settings.locale != null && { locale: settings.locale }),
        });
        const savedLocale = (settings as { locale?: string }).locale;
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
