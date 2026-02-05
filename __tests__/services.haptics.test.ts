jest.mock('react-native-haptic-feedback', () => ({
  trigger: jest.fn(),
}));

import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { triggerHaptic } from '../src/services/haptics';
import { useGameStore } from '../src/state/store';

const initialState = useGameStore.getState();

const resetStore = () => {
  useGameStore.setState(
    {
      ...initialState,
      unlockedSkins: [...initialState.unlockedSkins],
    },
    true
  );
};

describe('services/haptics', () => {
  beforeEach(() => {
    resetStore();
    jest.clearAllMocks();
  });

  it('does nothing when haptics are disabled', () => {
    useGameStore.getState().setSettingsFromPersisted({ hapticsOn: false });

    triggerHaptic('swap');

    expect(ReactNativeHapticFeedback.trigger).not.toHaveBeenCalled();
  });

  it('triggers haptic feedback when enabled', () => {
    useGameStore.getState().setSettingsFromPersisted({ hapticsOn: true });

    triggerHaptic('nearMiss');

    expect(ReactNativeHapticFeedback.trigger).toHaveBeenCalledWith(
      'impactMedium',
      expect.objectContaining({
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: false,
      })
    );
  });

  it('swallows native errors', () => {
    useGameStore.getState().setSettingsFromPersisted({ hapticsOn: true });
    (ReactNativeHapticFeedback.trigger as jest.Mock).mockImplementation(() => {
      throw new Error('native missing');
    });

    expect(() => triggerHaptic('gameOver')).not.toThrow();
  });
});
