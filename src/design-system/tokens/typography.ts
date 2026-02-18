/**
 * Design System - Typography Tokens
 * Aligned with Stitch UI Kit: Inter Bold (h1/h2), Inter SemiBold (subheading), Inter Regular (body).
 * Desktop reference: H1 36px, H2 24px, Subheading 20px, Body 16px.
 * Font files: Inter_*pt-*.ttf in assets/fonts/ (static set). Optical sizes:
 * - 18pt: small UI (caption, bodySmall, label)
 * - 24pt: medium (body, h3, h4, button)
 * - 28pt: large (h1, h2)
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

/** Font family names (file name without .ttf). Optical size by usage. */
export const FONT_FAMILY = {
  /** 18pt – small text (12–14px) */
  regular18: 'Inter_18pt-Regular',
  semiBold18: 'Inter_18pt-SemiBold',
  bold18: 'Inter_18pt-Bold',
  /** 24pt – medium text (16–20px) */
  regular24: 'Inter_24pt-Regular',
  semiBold24: 'Inter_24pt-SemiBold',
  bold24: 'Inter_24pt-Bold',
  /** 28pt – large text (24–36px) */
  regular28: 'Inter_28pt-Regular',
  semiBold28: 'Inter_28pt-SemiBold',
  bold28: 'Inter_28pt-Bold',
  /** Aliases for inline styles when optical size is not critical */
  regular: 'Inter_24pt-Regular',
  semiBold: 'Inter_24pt-SemiBold',
  bold: 'Inter_28pt-Bold',
} as const;

export interface TypographyStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: TypographyWeight;
  lineHeight?: number;
  letterSpacing?: number;
}

export const typography: Record<TypographyVariant, TypographyStyle> = {
  h1: {
    fontFamily: FONT_FAMILY.bold28,
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  h2: {
    fontFamily: FONT_FAMILY.bold28,
    fontSize: 24,
    fontWeight: '700',
  },
  h3: {
    fontFamily: FONT_FAMILY.semiBold24,
    fontSize: 20,
    fontWeight: '600',
  },
  h4: {
    fontFamily: FONT_FAMILY.semiBold24,
    fontSize: 18,
    fontWeight: '600',
  },
  body: {
    fontFamily: FONT_FAMILY.regular24,
    fontSize: 16,
    fontWeight: '400',
  },
  bodySmall: {
    fontFamily: FONT_FAMILY.regular18,
    fontSize: 14,
    fontWeight: '400',
  },
  caption: {
    fontFamily: FONT_FAMILY.regular18,
    fontSize: 12,
    fontWeight: '400',
  },
  button: {
    fontFamily: FONT_FAMILY.bold24,
    fontSize: 18,
    fontWeight: '700',
  },
  buttonSmall: {
    fontFamily: FONT_FAMILY.bold24,
    fontSize: 16,
    fontWeight: '700',
  },
  label: {
    fontFamily: FONT_FAMILY.semiBold18,
    fontSize: 14,
    fontWeight: '600',
  },
};
