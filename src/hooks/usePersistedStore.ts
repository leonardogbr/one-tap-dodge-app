/**
 * Hydrate store from AsyncStorage on load, persist on change.
 */

import { useEffect, useRef } from 'react';
import { hydrateStore } from '../state/persistence';
import {
  persistHighScore,
  persistLastScore,
  persistTotalCoins,
  persistUnlockedSkins,
  persistEquippedSkin,
  persistSettings,
  persistGameOversSinceLastInterstitial,
  persistScoreMultiplier,
  persistChallengeGroupIndex,
  persistChallengeShuffleSeed,
  persistCurrentGroupProgress,
  persistChallengeGroupBaseline,
  persistLifetimeStats,
  persistRewardAvailable,
  persistEarnedTrophies,
  persistSeenTrophiesCount,
} from '../state/persistence';
import { useGameStore } from '../state/store';
import type { CurrentGroupProgress, LifetimeStats } from '../state/store';

export function usePersistedStore() {
  const hydrated = useRef(false);
  const last = useRef({
    highScore: 0,
    lastScore: 0,
    totalCoins: 0,
    unlockedSkins: [] as string[],
    equippedSkinId: 'classic',
    gameOversSinceLastInterstitial: 0,
    soundOn: true,
    musicOn: true,
    hapticsOn: true,
    themeMode: 'system',
    locale: 'system',
    scoreMultiplier: 1,
    challengeGroupIndex: 0,
    challengeShuffleSeed: 0,
    currentGroupProgress: {} as CurrentGroupProgress,
    challengeGroupBaseline: {
      totalCoins: 0,
      totalScore: 0,
      gamesPlayed: 0,
      totalNearMisses: 0,
    } as LifetimeStats,
    lifetimeStats: {
      totalCoins: 0,
      totalScore: 0,
      gamesPlayed: 0,
      totalNearMisses: 0,
    } as LifetimeStats,
    rewardAvailable: false,
    earnedTrophies: [] as string[],
    seenTrophiesCount: 0,
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
      if (state.lastScore !== last.current.lastScore) {
        last.current.lastScore = state.lastScore;
        persistLastScore(state.lastScore);
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
      if (state.scoreMultiplier !== last.current.scoreMultiplier) {
        last.current.scoreMultiplier = state.scoreMultiplier;
        persistScoreMultiplier(state.scoreMultiplier);
      }
      if (state.challengeGroupIndex !== last.current.challengeGroupIndex) {
        last.current.challengeGroupIndex = state.challengeGroupIndex;
        persistChallengeGroupIndex(state.challengeGroupIndex);
      }
      if (state.challengeShuffleSeed !== last.current.challengeShuffleSeed) {
        last.current.challengeShuffleSeed = state.challengeShuffleSeed;
        persistChallengeShuffleSeed(state.challengeShuffleSeed);
      }
      const progStr = JSON.stringify(state.currentGroupProgress);
      if (progStr !== JSON.stringify(last.current.currentGroupProgress)) {
        last.current.currentGroupProgress = { ...state.currentGroupProgress };
        persistCurrentGroupProgress(state.currentGroupProgress);
      }
      const baselineStr = JSON.stringify(state.challengeGroupBaseline);
      const lastBaselineStr = JSON.stringify(last.current.challengeGroupBaseline);
      if (baselineStr !== lastBaselineStr) {
        last.current.challengeGroupBaseline = { ...state.challengeGroupBaseline };
        persistChallengeGroupBaseline(state.challengeGroupBaseline);
      }
      const stats = state.lifetimeStats;
      const lastStats = last.current.lifetimeStats;
      if (
        stats.totalCoins !== lastStats.totalCoins ||
        stats.totalScore !== lastStats.totalScore ||
        stats.gamesPlayed !== lastStats.gamesPlayed ||
        stats.totalNearMisses !== lastStats.totalNearMisses
      ) {
        last.current.lifetimeStats = { ...stats };
        persistLifetimeStats(stats);
      }
      if (state.rewardAvailable !== last.current.rewardAvailable) {
        last.current.rewardAvailable = state.rewardAvailable;
        persistRewardAvailable(state.rewardAvailable);
      }
      if (
        state.earnedTrophies.length !== last.current.earnedTrophies.length ||
        state.earnedTrophies.some((id, i) => id !== last.current.earnedTrophies[i])
      ) {
        last.current.earnedTrophies = [...state.earnedTrophies];
        persistEarnedTrophies(state.earnedTrophies);
      }
      if (state.seenTrophiesCount !== last.current.seenTrophiesCount) {
        last.current.seenTrophiesCount = state.seenTrophiesCount;
        persistSeenTrophiesCount(state.seenTrophiesCount);
      }
    });
  }, []);
}
