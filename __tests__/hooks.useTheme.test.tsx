import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { useTheme } from '../src/hooks/useTheme';
import { useGameStore } from '../src/state/store';
import { darkColors, lightColors } from '../src/theme';
import { useColorScheme } from 'react-native';

jest.mock('react-native', () => ({
  useColorScheme: jest.fn(),
}));

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

const ThemeProbe = ({ onResult }: { onResult: (result: ReturnType<typeof useTheme>) => void }) => {
  const theme = useTheme();
  onResult(theme);
  return null;
};

describe('hooks/useTheme', () => {
  beforeEach(() => {
    resetStore();
    (useColorScheme as jest.Mock).mockReset();
  });

  it('uses system theme when set to system', () => {
    useGameStore.getState().setSetting('themeMode', 'system');
    (useColorScheme as jest.Mock).mockReturnValue('dark');

    const onResult = jest.fn();
    act(() => {
      ReactTestRenderer.create(<ThemeProbe onResult={onResult} />);
    });

    expect(onResult).toHaveBeenLastCalledWith({
      colors: darkColors,
      isDark: true,
    });
  });

  it('forces light theme when configured', () => {
    useGameStore.getState().setSetting('themeMode', 'light');
    (useColorScheme as jest.Mock).mockReturnValue('dark');

    const onResult = jest.fn();
    act(() => {
      ReactTestRenderer.create(<ThemeProbe onResult={onResult} />);
    });

    expect(onResult).toHaveBeenLastCalledWith({
      colors: lightColors,
      isDark: false,
    });
  });

  it('forces dark theme when configured', () => {
    useGameStore.getState().setSetting('themeMode', 'dark');
    (useColorScheme as jest.Mock).mockReturnValue('light');

    const onResult = jest.fn();
    act(() => {
      ReactTestRenderer.create(<ThemeProbe onResult={onResult} />);
    });

    expect(onResult).toHaveBeenLastCalledWith({
      colors: darkColors,
      isDark: true,
    });
  });
});
