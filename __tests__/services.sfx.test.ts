const mockPlay = jest.fn();
const mockStop = jest.fn((cb?: () => void) => cb?.());
const mockSetVolume = jest.fn();
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
    this.release = mockRelease;
    Promise.resolve().then(() => cb?.(null));
  });
  (Sound as any).MAIN_BUNDLE = '';
  (Sound as any).setCategory = jest.fn();
  return Sound;
});

import { preloadSfx, triggerSFX, releaseSfx } from '../src/services/sfx';
import { useGameStore } from '../src/state/store';

const initialState = useGameStore.getState();

const resetStore = () => {
  useGameStore.setState(
    { ...initialState, unlockedSkins: [...initialState.unlockedSkins] },
    true,
  );
};

describe('services/sfx', () => {
  beforeEach(() => {
    resetStore();
    releaseSfx();
    jest.clearAllMocks();
  });

  it('does nothing when sound is disabled', () => {
    preloadSfx();
    useGameStore.getState().setSetting('soundOn', false);

    triggerSFX('swap');

    expect(mockStop).not.toHaveBeenCalled();
    expect(mockPlay).not.toHaveBeenCalled();
  });

  it('plays sound when enabled', () => {
    preloadSfx();
    useGameStore.getState().setSetting('soundOn', true);

    triggerSFX('coin');

    expect(mockStop).toHaveBeenCalled();
    expect(mockPlay).toHaveBeenCalled();
  });

  it('does nothing before preload', () => {
    useGameStore.getState().setSetting('soundOn', true);

    triggerSFX('swap');

    expect(mockPlay).not.toHaveBeenCalled();
  });

  it('releases all sounds', () => {
    preloadSfx();

    releaseSfx();

    expect(mockRelease).toHaveBeenCalled();
  });

  it('swallows native errors on trigger', () => {
    preloadSfx();
    useGameStore.getState().setSetting('soundOn', true);
    mockStop.mockImplementationOnce(() => {
      throw new Error('native missing');
    });

    expect(() => triggerSFX('gameOver')).not.toThrow();
  });
});
