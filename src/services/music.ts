/**
 * Music manager — ambient (idle/menus) and gameplay tracks with crossfade.
 * Respects musicOn from store.
 */

import Sound from 'react-native-sound';
import { useGameStore } from '../state/store';

Sound.setCategory('Ambient', true);

export type MusicTrack = 'ambient' | 'gameplay';

const TRACK_FILES: Record<MusicTrack, string> = {
  ambient: 'ambient.wav',
  gameplay: 'gameplay.wav',
};

const FULL_VOLUME = 0.35;
const DUCK_VOLUME = 0.12;
const FADE_STEP_MS = 50;
const FADE_STEPS = 12;

let tracks: Partial<Record<MusicTrack, Sound>> = {};
let activeTrack: MusicTrack | null = null;
let fadeTimers: ReturnType<typeof setInterval>[] = [];
let loaded = false;

function clearFades(): void {
  for (const t of fadeTimers) clearInterval(t);
  fadeTimers = [];
}

function fadeVolume(
  sound: Sound,
  from: number,
  to: number,
  onDone?: () => void,
): void {
  let step = 0;
  const delta = (to - from) / FADE_STEPS;
  sound.setVolume(from);
  const timer = setInterval(() => {
    step++;
    const vol = from + delta * step;
    sound.setVolume(Math.max(0, Math.min(1, vol)));
    if (step >= FADE_STEPS) {
      clearInterval(timer);
      fadeTimers = fadeTimers.filter((t) => t !== timer);
      onDone?.();
    }
  }, FADE_STEP_MS);
  fadeTimers.push(timer);
}

function loadTrack(name: MusicTrack): Promise<Sound | null> {
  return new Promise((resolve) => {
    try {
      const s = new Sound(TRACK_FILES[name], Sound.MAIN_BUNDLE, (err) => {
        if (err) {
          if (__DEV__) console.warn(`[Music] Failed to load ${TRACK_FILES[name]}:`, err);
          resolve(null);
          return;
        }
        s.setNumberOfLoops(-1);
        s.setVolume(0);
        resolve(s);
      });
    } catch (e) {
      if (__DEV__) console.warn(`[Music] Error creating Sound for ${TRACK_FILES[name]}:`, e);
      resolve(null);
    }
  });
}

export async function initMusic(): Promise<void> {
  if (loaded) return;
  loaded = true;
  const [ambient, gameplay] = await Promise.all([
    loadTrack('ambient'),
    loadTrack('gameplay'),
  ]);
  if (ambient) tracks.ambient = ambient;
  if (gameplay) tracks.gameplay = gameplay;
}

export function playTrack(name: MusicTrack): void {
  if (!useGameStore.getState().musicOn) return;
  if (activeTrack === name) return;

  const incoming = tracks[name];
  if (!incoming) return;

  clearFades();

  const outgoing = activeTrack ? tracks[activeTrack] : null;
  if (outgoing) {
    outgoing.stop();
    outgoing.setVolume(0);
  }

  activeTrack = name;
  incoming.setVolume(0);
  incoming.play();
  fadeVolume(incoming, 0, FULL_VOLUME);
}

export function duckMusic(): void {
  if (!activeTrack) return;
  const sound = tracks[activeTrack];
  if (!sound) return;
  clearFades();
  fadeVolume(sound, FULL_VOLUME, DUCK_VOLUME);
}

export function unduckMusic(): void {
  if (!activeTrack) return;
  const sound = tracks[activeTrack];
  if (!sound) return;
  clearFades();
  fadeVolume(sound, DUCK_VOLUME, FULL_VOLUME);
}

export function stopMusic(): void {
  clearFades();
  for (const s of Object.values(tracks)) {
    if (!s) continue;
    try {
      s.stop();
      s.setVolume(0);
    } catch {
      // ignore
    }
  }
  activeTrack = null;
}

/**
 * Call when musicOn toggle changes at runtime.
 * If turned on: resume the track that should be playing (caller should call playTrack after).
 * If turned off: stop everything.
 */
export function setMusicEnabled(enabled: boolean): void {
  if (!enabled) {
    stopMusic();
  }
}

export function releaseMusic(): void {
  stopMusic();
  for (const s of Object.values(tracks)) {
    try {
      s?.release();
    } catch {
      // ignore
    }
  }
  tracks = {};
  loaded = false;
}

export function getActiveTrack(): MusicTrack | null {
  return activeTrack;
}
