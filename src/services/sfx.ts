/**
 * Sound effects — respects soundOn from store.
 * Mirrors haptics.ts pattern: preload on init, fire-and-forget on trigger.
 */

import Sound from 'react-native-sound';
import { useGameStore } from '../state/store';

Sound.setCategory('Ambient', true);

export type SfxEvent =
  | 'swap'
  | 'nearMiss'
  | 'coin'
  | 'gameOver'
  | 'countdown'
  | 'countdownGo'
  | 'shieldHit';

interface SfxEntry {
  file: string;
  volume: number;
  /** How many concurrent instances to allow (pool size). */
  poolSize: number;
}

const SFX_CONFIG: Record<SfxEvent, SfxEntry> = {
  swap: { file: 'swap.wav', volume: 0.4, poolSize: 2 },
  nearMiss: { file: 'near_miss.wav', volume: 0.6, poolSize: 2 },
  coin: { file: 'coin.wav', volume: 0.5, poolSize: 3 },
  gameOver: { file: 'game_over.wav', volume: 0.8, poolSize: 1 },
  countdown: { file: 'countdown.wav', volume: 0.6, poolSize: 1 },
  countdownGo: { file: 'countdown_go.wav', volume: 0.7, poolSize: 1 },
  shieldHit: { file: 'shield_hit.wav', volume: 0.6, poolSize: 1 },
};

const pools: Partial<Record<SfxEvent, Sound[]>> = {};
const poolIndex: Partial<Record<SfxEvent, number>> = {};

let preloaded = false;

export function preloadSfx(): void {
  if (preloaded) return;
  preloaded = true;

  for (const [event, config] of Object.entries(SFX_CONFIG) as [SfxEvent, SfxEntry][]) {
    const sounds: Sound[] = [];
    for (let i = 0; i < config.poolSize; i++) {
      try {
        const s = new Sound(config.file, Sound.MAIN_BUNDLE, (err) => {
          if (err) {
            if (__DEV__) console.warn(`[SFX] Failed to load ${config.file}:`, err);
            return;
          }
          s.setVolume(config.volume);
        });
        sounds.push(s);
      } catch (e) {
        if (__DEV__) console.warn(`[SFX] Error creating Sound for ${config.file}:`, e);
      }
    }
    pools[event] = sounds;
    poolIndex[event] = 0;
  }
}

export function triggerSFX(event: SfxEvent): void {
  if (!useGameStore.getState().soundOn) return;

  const pool = pools[event];
  if (!pool || pool.length === 0) return;

  const idx = poolIndex[event] ?? 0;
  const sound = pool[idx];
  poolIndex[event] = (idx + 1) % pool.length;

  try {
    sound.stop(() => {
      sound.play();
    });
  } catch {
    // ignore if native module not available
  }
}

export function releaseSfx(): void {
  for (const [event, pool] of Object.entries(pools) as [SfxEvent, Sound[]][]) {
    if (!pool) continue;
    for (const s of pool) {
      try {
        s.release();
      } catch {
        // ignore
      }
    }
    delete pools[event];
  }
  preloaded = false;
}
