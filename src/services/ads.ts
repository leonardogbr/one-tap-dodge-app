/**
 * Ads — rewarded (revive) and interstitial (after N game overs).
 * Ad Unit IDs come from .env via react-native-config; Test IDs used in __DEV__ or when unset.
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
  });
  rewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
    rewardedLoaded = false;
    loadRewarded();
  });
  rewardedAd.addAdEventListener(AdEventType.ERROR, () => {
    rewardedLoaded = false;
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

function loadInterstitial() {
  interstitialAd?.load();
}

export async function initAds(): Promise<void> {
  await MobileAds().initialize();
  createRewarded();
  createInterstitial();
}

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
      finish(true);
    });
    rewardedAd!.addAdEventListener(AdEventType.CLOSED, () => {
      // Resolve after a short delay so EARNED_REWARD (if it fires after CLOSED on some devices) is captured
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
