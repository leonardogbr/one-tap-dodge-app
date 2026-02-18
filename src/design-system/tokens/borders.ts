/**
 * Design System - Border Tokens
 * Centralized border radius and border width values
 */

export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
} as const;

export const borderWidth = {
  none: 0,
  thin: 1,
  medium: 1.5,
  thick: 2,
} as const;

export type BorderRadiusKey = keyof typeof borderRadius;
export type BorderWidthKey = keyof typeof borderWidth;
