const mobileAdsInitialize = jest.fn(() => Promise.resolve());
const rewardedInstances: any[] = [];
const interstitialInstances: any[] = [];

const createMockAd = () => {
  const listeners = new Map<string, Set<() => void>>();
  const ad = {
    loaded: false,
    addAdEventListener: jest.fn((type: string, callback: () => void) => {
      if (!listeners.has(type)) {
        listeners.set(type, new Set());
      }
      listeners.get(type)!.add(callback);
      return () => listeners.get(type)?.delete(callback);
    }),
    load: jest.fn(() => {
      ad.loaded = true;
    }),
    show: jest.fn(() => Promise.resolve()),
    __emit: (type: string) => {
      listeners.get(type)?.forEach((cb) => cb());
    },
  };
  return ad;
};

jest.mock('react-native-google-mobile-ads', () => ({
  MobileAds: () => ({ initialize: mobileAdsInitialize }),
  RewardedAd: {
    createForAdRequest: jest.fn(() => {
      const ad = createMockAd();
      rewardedInstances.push(ad);
      return ad;
    }),
  },
  InterstitialAd: {
    createForAdRequest: jest.fn(() => {
      const ad = createMockAd();
      interstitialInstances.push(ad);
      return ad;
    }),
  },
  TestIds: {
    REWARDED: 'test-rewarded',
    INTERSTITIAL: 'test-interstitial',
  },
  RewardedAdEventType: {
    LOADED: 'LOADED',
    EARNED_REWARD: 'EARNED_REWARD',
  },
  AdEventType: {
    LOADED: 'LOADED',
    CLOSED: 'CLOSED',
    ERROR: 'ERROR',
  },
  __getLastRewardedAd: () => rewardedInstances[rewardedInstances.length - 1],
  __getLastInterstitialAd: () =>
    interstitialInstances[interstitialInstances.length - 1],
  __reset: () => {
    rewardedInstances.length = 0;
    interstitialInstances.length = 0;
    mobileAdsInitialize.mockClear();
  },
}));

const loadAds = (options: { dev: boolean; platform: 'android' | 'ios' }) => {
  jest.resetModules();
  global.__DEV__ = options.dev;
  jest.doMock('react-native', () => ({
    Platform: { OS: options.platform },
  }));
  jest.doMock('react-native-config', () => ({
    ADMOB_REWARDED_UNIT_ID_ANDROID: 'rewarded-android',
    ADMOB_REWARDED_UNIT_ID_IOS: 'rewarded-ios',
    ADMOB_INTERSTITIAL_UNIT_ID_ANDROID: 'interstitial-android',
    ADMOB_INTERSTITIAL_UNIT_ID_IOS: 'interstitial-ios',
  }));
  const ads = require('../src/services/ads');
  const adsMock = require('react-native-google-mobile-ads');
  adsMock.__reset();
  return { ads, adsMock };
};

describe('services/ads', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('uses test ad units in dev', async () => {
    const { ads, adsMock } = loadAds({ dev: true, platform: 'android' });
    await ads.initAds();

    expect(adsMock.RewardedAd.createForAdRequest).toHaveBeenCalledWith(
      'test-rewarded',
      {}
    );
    expect(adsMock.InterstitialAd.createForAdRequest).toHaveBeenCalledWith(
      'test-interstitial',
      {}
    );
  });

  it('uses platform ad units in production', async () => {
    const { ads, adsMock } = loadAds({ dev: false, platform: 'android' });
    await ads.initAds();

    expect(adsMock.RewardedAd.createForAdRequest).toHaveBeenCalledWith(
      'rewarded-android',
      {}
    );
    expect(adsMock.InterstitialAd.createForAdRequest).toHaveBeenCalledWith(
      'interstitial-android',
      {}
    );
  });

  it('uses iOS ad units when on iOS', async () => {
    const { ads, adsMock } = loadAds({ dev: false, platform: 'ios' });
    await ads.initAds();

    expect(adsMock.RewardedAd.createForAdRequest).toHaveBeenCalledWith(
      'rewarded-ios',
      {}
    );
    expect(adsMock.InterstitialAd.createForAdRequest).toHaveBeenCalledWith(
      'interstitial-ios',
      {}
    );
  });

  it('initializes ads and tracks loaded state', async () => {
    const { ads, adsMock } = loadAds({ dev: false, platform: 'android' });
    await ads.initAds();
    expect(mobileAdsInitialize).toHaveBeenCalled();

    const rewarded = adsMock.__getLastRewardedAd();
    const interstitial = adsMock.__getLastInterstitialAd();

    expect(ads.isRewardedLoaded()).toBe(false);
    expect(ads.isInterstitialLoaded()).toBe(false);

    rewarded.__emit('LOADED');
    interstitial.__emit('LOADED');
    expect(ads.isRewardedLoaded()).toBe(true);
    expect(ads.isInterstitialLoaded()).toBe(true);

    rewarded.__emit('CLOSED');
    interstitial.__emit('CLOSED');
    expect(ads.isRewardedLoaded()).toBe(false);
    expect(ads.isInterstitialLoaded()).toBe(false);

    rewarded.__emit('ERROR');
    interstitial.__emit('ERROR');
    expect(rewarded.load).toHaveBeenCalled();
    expect(interstitial.load).toHaveBeenCalled();
  });

  it('resolves false when rewarded ad is not loaded', async () => {
    const { ads } = loadAds({ dev: true, platform: 'android' });
    await expect(ads.showRewarded()).resolves.toBe(false);
  });

  it('resolves true when rewarded ad is watched and closed', async () => {
    jest.useFakeTimers();
    const { ads, adsMock } = loadAds({ dev: false, platform: 'android' });
    await ads.initAds();

    const rewarded = adsMock.__getLastRewardedAd();
    rewarded.loaded = true;

    const promise = ads.showRewarded();
    rewarded.__emit('EARNED_REWARD');
    rewarded.__emit('CLOSED');
    jest.runAllTimers();

    await expect(promise).resolves.toBe(true);
    expect(rewarded.show).toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('resolves false when rewarded show fails', async () => {
    const { ads, adsMock } = loadAds({ dev: false, platform: 'android' });
    await ads.initAds();

    const rewarded = adsMock.__getLastRewardedAd();
    rewarded.loaded = true;
    rewarded.show = jest.fn(() => Promise.reject(new Error('no fill')));

    await expect(ads.showRewarded()).resolves.toBe(false);
  });

  it('shows interstitial when loaded and resolves on close', async () => {
    const { ads, adsMock } = loadAds({ dev: false, platform: 'android' });
    await ads.initAds();

    const interstitial = adsMock.__getLastInterstitialAd();
    interstitial.loaded = true;

    const promise = ads.showInterstitial();
    interstitial.__emit('CLOSED');

    await expect(promise).resolves.toBeUndefined();
    expect(interstitial.show).toHaveBeenCalled();
  });

  it('resolves when interstitial is not loaded or show fails', async () => {
    const { ads, adsMock } = loadAds({ dev: false, platform: 'android' });
    await expect(ads.showInterstitial()).resolves.toBeUndefined();

    await ads.initAds();
    const interstitial = adsMock.__getLastInterstitialAd();
    interstitial.loaded = true;
    interstitial.show = jest.fn(() => Promise.reject(new Error('no fill')));

    await expect(ads.showInterstitial()).resolves.toBeUndefined();
  });
});
