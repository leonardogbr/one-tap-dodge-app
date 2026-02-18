/**
 * Ads — rewarded (revive) and interstitial (after N game overs).
 * Ad Unit IDs come from .env via react-native-config; Test IDs used in __DEV__ or when unset.
 *
 * This app targets children (Google Play Families). We set RequestConfiguration before init:
 * - tagForChildDirectedTreatment: COPPA compliance, no interest-based/remarketing ads
 * - tagForUnderAgeOfConsent: GDPR/EEA under-age treatment
 * - maxAdContentRating G: only age-appropriate ads (Families policy).
 */

import { Platform } from 'react-native';
import Config from 'react-native-config';
import {
  MobileAds,
  RewardedAd,
  InterstitialAd,
  TestIds,
  RewardedAdEventType,
  AdEventType,
  MaxAdContentRating,
} from 'react-native-google-mobile-ads';

const REWARDED_AD_UNIT_ID: string =
  (!__DEV__ && (Platform.OS === 'android' ? Config.ADMOB_REWARDED_UNIT_ID_ANDROID : Config.ADMOB_REWARDED_UNIT_ID_IOS)) ||
  TestIds.REWARDED;
const INTERSTITIAL_AD_UNIT_ID: string =
  (!__DEV__ && (Platform.OS === 'android' ? Config.ADMOB_INTERSTITIAL_UNIT_ID_ANDROID : Config.ADMOB_INTERSTITIAL_UNIT_ID_IOS)) ||
  TestIds.INTERSTITIAL;

let rewardedAd: RewardedAd | null = null;
let interstitialAd: InterstitialAd | null = null;

let rewardedLoaded = false;
let interstitialLoaded = false;

/** Listeners notified when rewarded ad load state changes (LOADED or ERROR). Used so UI can re-render. */
const rewardedLoadListeners = new Set<() => void>();

function notifyRewardedLoadState(): void {
  rewardedLoadListeners.forEach((listener) => listener());
}

/**
 * Subscribe to rewarded ad load state changes. Callback is called when the ad loads or fails.
 * Returns unsubscribe function.
 */
export function subscribeRewardedLoadState(listener: () => void): () => void {
  rewardedLoadListeners.add(listener);
  return () => {
    rewardedLoadListeners.delete(listener);
  };
}

export function isRewardedLoaded(): boolean {
  return rewardedLoaded && rewardedAd?.loaded === true;
}

export function isInterstitialLoaded(): boolean {
  return interstitialLoaded && interstitialAd?.loaded === true;
}

function createRewarded() {
  rewardedAd = RewardedAd.createForAdRequest(REWARDED_AD_UNIT_ID, {});
  rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
    rewardedLoaded = true;
    notifyRewardedLoadState();
  });
  rewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
    rewardedLoaded = false;
    notifyRewardedLoadState();
    loadRewarded();
  });
  rewardedAd.addAdEventListener(AdEventType.ERROR, () => {
    rewardedLoaded = false;
    notifyRewardedLoadState();
    loadRewarded();
  });
  loadRewarded();
}

function createInterstitial() {
  interstitialAd = InterstitialAd.createForAdRequest(INTERSTITIAL_AD_UNIT_ID, {});
  interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
    interstitialLoaded = true;
  });
  interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
    interstitialLoaded = false;
    loadInterstitial();
  });
  interstitialAd.addAdEventListener(AdEventType.ERROR, () => {
    interstitialLoaded = false;
    loadInterstitial();
  });
  loadInterstitial();
}

function loadRewarded() {
  rewardedAd?.load();
}

/** Call to retry loading the rewarded ad (e.g. after a failure). UI can call this on "Tentar novamente". */
export function retryLoadRewarded(): void {
  if (rewardedAd && !rewardedLoaded) loadRewarded();
}

function loadInterstitial() {
  interstitialAd?.load();
}

export async function initAds(): Promise<void> {
  // Must run BEFORE initialize() — required for Google Play Families / child-directed apps.
  await MobileAds().setRequestConfiguration({
    maxAdContentRating: MaxAdContentRating.G,
    tagForChildDirectedTreatment: true,
    tagForUnderAgeOfConsent: true,
  });
  await MobileAds().initialize();
  createRewarded();
  createInterstitial();
}

/**
 * Resolves only when the ad is closed. Resolve value is true if the user
 * earned the reward (watched long enough); game must only resume after close.
 */
export function showRewarded(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!rewardedAd?.loaded) {
      resolve(false);
      return;
    }
    let settled = false;
    let earnedReward = false;
    const finish = (earned: boolean) => {
      if (!settled) {
        settled = true;
        resolve(earned);
      }
    };
    rewardedAd!.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      earnedReward = true;
      // Do NOT resolve here — wait for CLOSED so the game only resumes after the user closes the ad.
    });
    rewardedAd!.addAdEventListener(AdEventType.CLOSED, () => {
      // Resolve only when ad is closed; value is whether they earned the reward.
      setTimeout(() => finish(earnedReward), 200);
    });
    rewardedAd!.show().catch(() => finish(false));
  });
}

export function showInterstitial(): Promise<void> {
  if (!interstitialAd?.loaded) return Promise.resolve();
  return new Promise((resolve) => {
    const unsubscribe = interstitialAd!.addAdEventListener(AdEventType.CLOSED, () => {
      unsubscribe?.();
      resolve();
    });
    interstitialAd!.show().catch(() => {
      unsubscribe?.();
      resolve();
    });
  });
}
