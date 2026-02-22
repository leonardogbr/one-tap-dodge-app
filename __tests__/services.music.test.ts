const mockPlay = jest.fn();
const mockStop = jest.fn((cb?: () => void) => cb?.());
const mockSetVolume = jest.fn();
const mockSetNumberOfLoops = jest.fn();
const mockRelease = jest.fn();

jest.mock('react-native-sound', () => {
  const Sound = jest.fn(function (
    this: any,
    _file: string,
    _bundle: unknown,
    cb?: (err: unknown) => void,
  ) {
    this.play = mockPlay;
    this.stop = mockStop;
    this.setVolume = mockSetVolume;
    this.setNumberOfLoops = mockSetNumberOfLoops;
    this.release = mockRelease;
    Promise.resolve().then(() => cb?.(null));
  });
  (Sound as any).MAIN_BUNDLE = '';
  (Sound as any).setCategory = jest.fn();
  return Sound;
});

import {
  initMusic,
  playTrack,
  stopMusic,
  duckMusic,
  unduckMusic,
  setMusicEnabled,
  releaseMusic,
  getActiveTrack,
} from '../src/services/music';
import { useGameStore } from '../src/state/store';

const initialState = useGameStore.getState();

const resetStore = () => {
  useGameStore.setState(
    { ...initialState, unlockedSkins: [...initialState.unlockedSkins] },
    true,
  );
};

describe('services/music', () => {
  beforeEach(async () => {
    resetStore();
    releaseMusic();
    jest.clearAllMocks();
    await initMusic();
  });

  it('does not play when music is disabled', () => {
    useGameStore.getState().setSetting('musicOn', false);

    playTrack('ambient');

    expect(mockPlay).not.toHaveBeenCalled();
    expect(getActiveTrack()).toBeNull();
  });

  it('plays track when music is enabled', () => {
    useGameStore.getState().setSetting('musicOn', true);

    playTrack('ambient');

    expect(mockSetVolume).toHaveBeenCalledWith(0);
    expect(mockPlay).toHaveBeenCalled();
    expect(getActiveTrack()).toBe('ambient');
  });

  it('crossfades to a different track', () => {
    useGameStore.getState().setSetting('musicOn', true);

    playTrack('ambient');
    jest.clearAllMocks();
    playTrack('gameplay');

    expect(getActiveTrack()).toBe('gameplay');
    expect(mockSetVolume).toHaveBeenCalled();
  });

  it('does not restart the same track', () => {
    useGameStore.getState().setSetting('musicOn', true);

    playTrack('ambient');
    jest.clearAllMocks();
    playTrack('ambient');

    expect(mockPlay).not.toHaveBeenCalled();
  });

  it('ducks and unducks volume', () => {
    useGameStore.getState().setSetting('musicOn', true);
    playTrack('gameplay');
    jest.clearAllMocks();

    duckMusic();
    expect(mockSetVolume).toHaveBeenCalled();

    jest.clearAllMocks();
    unduckMusic();
    expect(mockSetVolume).toHaveBeenCalled();
  });

  it('stops all tracks', () => {
    useGameStore.getState().setSetting('musicOn', true);
    playTrack('ambient');

    stopMusic();

    expect(getActiveTrack()).toBeNull();
  });

  it('stops music when disabled via setMusicEnabled', () => {
    useGameStore.getState().setSetting('musicOn', true);
    playTrack('ambient');

    setMusicEnabled(false);

    expect(getActiveTrack()).toBeNull();
  });

  it('releases all tracks', () => {
    releaseMusic();

    expect(mockRelease).toHaveBeenCalled();
  });
});
