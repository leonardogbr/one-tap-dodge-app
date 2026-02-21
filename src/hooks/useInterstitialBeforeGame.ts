/**
 * Interstitial before new game: every 5 game overs the user must see an interstitial
 * before starting the next game. Exception: if the user just watched a Rewarded ad (revive),
 * we skip the next interstitial so they don't see two ads in a row.
 */

import { useCallback } from 'react';
import { useGameStore } from '../state/store';
import { INTERSTITIAL_AFTER_GAME_OVERS } from '../engine/constants';
import { showInterstitial } from '../services/ads';

/**
 * Returns a function that runs before starting a new game: if 5+ game overs since last
 * interstitial and not right after a rewarded ad, shows interstitial then calls onProceed;
 * otherwise calls onProceed immediately. After a rewarded ad we skip the interstitial
 * and clear the flag.
 */
export function useInterstitialBeforeGame(): (onProceed: () => void) => Promise<void> {
  return useCallback(async (onProceed: () => void) => {
    const state = useGameStore.getState();
    const {
      gameOversSinceLastInterstitial,
      reviveEarnedFromAd,
      setReviveEarnedFromAd,
      resetGameOversSinceLastInterstitial,
    } = state;

    if (gameOversSinceLastInterstitial >= INTERSTITIAL_AFTER_GAME_OVERS) {
      if (reviveEarnedFromAd) {
        setReviveEarnedFromAd(false);
        onProceed();
      } else {
        await showInterstitial();
        resetGameOversSinceLastInterstitial();
        onProceed();
      }
    } else {
      onProceed();
    }
  }, []);
}
