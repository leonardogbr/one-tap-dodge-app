declare module 'react-native-config' {
  export interface NativeConfig {
    ADMOB_APP_ID_ANDROID?: string;
    ADMOB_APP_ID_IOS?: string;
    ADMOB_REWARDED_UNIT_ID_ANDROID?: string;
    ADMOB_REWARDED_UNIT_ID_IOS?: string;
    ADMOB_INTERSTITIAL_UNIT_ID_ANDROID?: string;
    ADMOB_INTERSTITIAL_UNIT_ID_IOS?: string;
  }

  export const Config: NativeConfig;
  export default Config;
}
