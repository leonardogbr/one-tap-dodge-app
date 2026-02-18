/**
 * Design System - Color Tokens
 * Aligned with Stitch UI Kit & Color Palette (Complete UI Kit).
 *
 * Accents: Electric Cyan (primary), Neon Purple (secondary), Coral Warning (danger), Coin (yellow/amber).
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
  /** Moeda / ícone monetization_on (doc: yellow-400) */
  coin: string;
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
  coin: '#FACC15', // yellow-400, ícone de moeda (doc)
};

export const lightColors: ColorPalette = {
  // Light Mode Palette
  background: '#F4F7FF',
  backgroundLight: '#FFFFFF',
  backgroundCard: '#E6EBF5',
  // Accents (same as dark for consistency; onPrimary dark for contrast on cyan)
  primary: '#38E8FF',
  primaryDim: '#38E8FF40',
  secondary: '#8A5CFF',
  onPrimary: '#070A12',
  text: '#1E2633',
  textMuted: '#5C6578',
  danger: '#FF4D6D',
  success: '#16A34A',
  obstacle: '#FF4D6D',
  coin: '#EAB308', // yellow-500, um pouco mais escuro no claro para contraste
};

/** Legacy export: defaults to dark. Prefer useTheme(). */
export const colors = darkColors;
