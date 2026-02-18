/**
 * Design System - Typography Tokens
 * Centralized text styles and font definitions
 */

export type TypographyVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'body'
  | 'bodySmall'
  | 'caption'
  | 'button'
  | 'buttonSmall'
  | 'label';

export type TypographyWeight = '400' | '500' | '600' | '700' | '800';

export interface TypographyStyle {
  fontSize: number;
  fontWeight: TypographyWeight;
  lineHeight?: number;
  letterSpacing?: number;
}

export const typography: Record<TypographyVariant, TypographyStyle> = {
  h1: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 1,
  },
  h2: {
    fontSize: 28,
    fontWeight: '800',
  },
  h3: {
    fontSize: 24,
    fontWeight: '700',
  },
  h4: {
    fontSize: 20,
    fontWeight: '700',
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400',
  },
  caption: {
    fontSize: 12,
    fontWeight: '400',
  },
  button: {
    fontSize: 18,
    fontWeight: '700',
  },
  buttonSmall: {
    fontSize: 16,
    fontWeight: '700',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
};
