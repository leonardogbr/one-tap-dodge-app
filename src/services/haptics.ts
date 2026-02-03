/**
 * Haptic feedback — respects hapticsOn from store.
 * Used for: lane swap, near-miss, coin collect, game over (not on UI buttons).
 */

import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { useGameStore } from '../state/store';

const OPTIONS = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

export type HapticEvent = 'swap' | 'nearMiss' | 'coin' | 'gameOver';

const EVENT_TO_METHOD: Record<HapticEvent, 'impactLight' | 'impactMedium' | 'notificationWarning'> = {
  swap: 'impactLight',
  nearMiss: 'impactMedium',
  coin: 'impactLight',
  gameOver: 'notificationWarning',
};

export function triggerHaptic(event: HapticEvent): void {
  if (!useGameStore.getState().hapticsOn) return;
  const method = EVENT_TO_METHOD[event];
  try {
    ReactNativeHapticFeedback.trigger(method, OPTIONS);
  } catch {
    // ignore if native module not available (e.g. simulator)
  }
}
