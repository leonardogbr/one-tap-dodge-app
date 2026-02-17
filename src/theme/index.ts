/**
 * Theme — dark/light palettes, spacing. Phase 4: light mode + useTheme.
 */

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export type ColorPalette = {
  background: string;
  backgroundLight: string;
  /** Fundo levemente mais claro para destaque (ex.: card Best score). */
  backgroundCard: string;
  primary: string;
  primaryDim: string;
  /** Texto/ícone sobre fundo primary — dark: preto, light: branco (contraste por tema). */
  onPrimary: string;
  text: string;
  textMuted: string;
  danger: string;
  success: string;
  obstacle: string;
};

export const darkColors: ColorPalette = {
  background: '#0d1117',
  backgroundLight: '#161b22',
  backgroundCard: '#21262d',
  primary: '#38e8ff',
  primaryDim: '#38e8ff40',
  onPrimary: '#000',
  text: '#e6edf3',
  textMuted: '#8b949e',
  danger: '#f85149',
  success: '#3fb950',
  obstacle: '#e53935',
};

export const lightColors: ColorPalette = {
  background: '#f0f4f8',
  backgroundLight: '#e2e8f0',
  backgroundCard: '#ffffff',
  primary: '#0ea5e9',
  primaryDim: '#0ea5e940',
  onPrimary: '#ffffff',
  text: '#1e293b',
  textMuted: '#64748b',
  danger: '#dc2626',
  success: '#16a34a',
  obstacle: '#dc2626',
};

/** Legacy export: defaults to dark for backward compatibility. Prefer useTheme(). */
export const colors = darkColors;
