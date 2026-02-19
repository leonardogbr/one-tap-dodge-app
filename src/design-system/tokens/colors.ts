/**
 * Design System - Color Tokens
 * Aligned with Stitch UI Kit & Color Palette (Complete UI Kit).
 *
 * Accents: Electric Cyan (primary dark), Vibrant Azure (primary light), Neon Purple (secondary), Coral Warning (danger), Coin (yellow/amber).
 * Dark: Primary BG #070A12, Surface #151A26, Secondary Surface #1F2633.
 * Light: Primary BG #F4F7FF, Surface #FFFFFF, Secondary Surface #E6EBF5.
 */

export type ColorPalette = {
  background: string;
  backgroundLight: string;
  backgroundCard: string;
  primary: string;
  primaryDim: string;
  secondary: string;
  onPrimary: string;
  text: string;
  textMuted: string;
  danger: string;
  success: string;
  obstacle: string;
  coin: string;
  onCoin: string;
};

export const darkColors: ColorPalette = {
  // Dark Mode Palette
  background: '#070A12',
  backgroundLight: '#151A26',
  backgroundCard: '#1F2633',
  // Accents
  primary: '#38E8FF',
  primaryDim: '#38E8FF40',
  secondary: '#8A5CFF',
  onPrimary: '#070A12',
  text: '#E6EDF3',
  textMuted: '#8B949E',
  danger: '#FF4D6D',
  success: '#3FB950',
  obstacle: '#FF4D6D',
  coin: '#FACC15',
  onCoin: '#0a0a0a',
};

export const lightColors: ColorPalette = {
  // Light Mode Palette
  background: '#F4F7FF',
  backgroundLight: '#FFFFFF',
  backgroundCard: '#E6EBF5',
  // Accents - Vibrant Azure for light mode (replaces Electric Cyan)
  primary: '#00B4D8', // Vibrant Azure (light mode primary)
  primaryDim: '#00B4D840',
  secondary: '#8A5CFF',
  onPrimary: '#FFFFFF', // White text on Vibrant Azure button (from doc)
  text: '#1E2633',
  textMuted: '#5C6578',
  danger: '#FF4D6D',
  success: '#16A34A',
  obstacle: '#FF4D6D',
  coin: '#EAB308',
  onCoin: '#0a0a0a',
};

/** Legacy export: defaults to dark. Prefer useTheme(). */
export const colors = darkColors;
