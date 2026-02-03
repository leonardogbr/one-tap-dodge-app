/**
 * Resolve effective theme (dark/light) from themeMode + system.
 */

import { useColorScheme } from 'react-native';
import { useGameStore } from '../state/store';
import type { ThemeMode } from '../state/store';
import { darkColors, lightColors, type ColorPalette } from '../theme';

export function useTheme(): { colors: ColorPalette; isDark: boolean } {
  const themeMode = useGameStore((s) => s.themeMode);
  const systemDark = useColorScheme() === 'dark';
  const isDark =
    themeMode === 'system' ? systemDark : themeMode === 'dark';
  const colors = isDark ? darkColors : lightColors;
  return { colors, isDark };
}
