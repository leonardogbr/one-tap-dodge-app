/**
 * Hook that returns whether the rewarded ad is loaded and re-renders when the load state changes.
 * Use this so the "Watch ad to continue" button updates from loading to enabled
 * as soon as the ad finishes loading in the background.
 */

import { useState, useEffect } from 'react';
import { isRewardedLoaded, subscribeRewardedLoadState } from '../services/ads';

export function useRewardedAdLoaded(): boolean {
  const [loaded, setLoaded] = useState(() => isRewardedLoaded());

  useEffect(() => {
    const unsubscribe = subscribeRewardedLoadState(() => {
      setLoaded(isRewardedLoaded());
    });
    return unsubscribe;
  }, []);

  return loaded;
}
