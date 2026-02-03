/**
 * Hydrate store from AsyncStorage on load, persist on change.
 */

import { useEffect, useRef } from 'react';
import { hydrateStore } from '../state/persistence';
import {
  persistHighScore,
  persistTotalCoins,
  persistUnlockedSkins,
  persistEquippedSkin,
  persistSettings,
  persistGameOversSinceLastInterstitial,
} from '../state/persistence';
import { useGameStore } from '../state/store';

export function usePersistedStore() {
  const hydrated = useRef(false);
  const last = useRef({
    highScore: 0,
    totalCoins: 0,
    unlockedSkins: [] as string[],
    equippedSkinId: 'classic',
    gameOversSinceLastInterstitial: 0,
    soundOn: true,
    musicOn: true,
    hapticsOn: true,
    themeMode: 'system',
    locale: 'system',
  });

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    hydrateStore();
  }, []);

  useEffect(() => {
    return useGameStore.subscribe((state) => {
      if (state.highScore !== last.current.highScore) {
        last.current.highScore = state.highScore;
        persistHighScore(state.highScore);
      }
      if (state.totalCoins !== last.current.totalCoins) {
        last.current.totalCoins = state.totalCoins;
        persistTotalCoins(state.totalCoins);
      }
      if (
        state.unlockedSkins.length !== last.current.unlockedSkins.length ||
        state.unlockedSkins.some((id, i) => id !== last.current.unlockedSkins[i])
      ) {
        last.current.unlockedSkins = [...state.unlockedSkins];
        persistUnlockedSkins(state.unlockedSkins);
      }
      if (state.equippedSkinId !== last.current.equippedSkinId) {
        last.current.equippedSkinId = state.equippedSkinId;
        persistEquippedSkin(state.equippedSkinId);
      }
      if (
        state.gameOversSinceLastInterstitial !==
        last.current.gameOversSinceLastInterstitial
      ) {
        last.current.gameOversSinceLastInterstitial =
          state.gameOversSinceLastInterstitial;
        persistGameOversSinceLastInterstitial(state.gameOversSinceLastInterstitial);
      }
      if (
        state.soundOn !== last.current.soundOn ||
        state.musicOn !== last.current.musicOn ||
        state.hapticsOn !== last.current.hapticsOn ||
        state.themeMode !== last.current.themeMode ||
        state.locale !== last.current.locale
      ) {
        last.current.soundOn = state.soundOn;
        last.current.musicOn = state.musicOn;
        last.current.hapticsOn = state.hapticsOn;
        last.current.themeMode = state.themeMode;
        last.current.locale = state.locale;
        persistSettings({
          soundOn: state.soundOn,
          musicOn: state.musicOn,
          hapticsOn: state.hapticsOn,
          themeMode: state.themeMode,
          locale: state.locale,
        });
      }
    });
  }, []);
}
