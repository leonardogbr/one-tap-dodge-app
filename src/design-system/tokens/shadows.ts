/**
 * Design System - Shadow Tokens
 * Centralized shadow and elevation definitions
 */

import type { ViewStyle } from 'react-native';

export type ShadowVariant = 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'primary';

export interface ShadowStyle {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

export const createShadow = (
  color: string,
  offset: { width: number; height: number },
  opacity: number,
  radius: number,
  elevation: number
): ShadowStyle => ({
  shadowColor: color,
  shadowOffset: offset,
  shadowOpacity: opacity,
  shadowRadius: radius,
  elevation,
});

export const shadows: Record<ShadowVariant, (color?: string) => ViewStyle> = {
  none: () => ({}),
  sm: (color = '#000') =>
    createShadow(color, { width: 0, height: 2 }, 0.1, 4, 2),
  md: (color = '#000') =>
    createShadow(color, { width: 0, height: 4 }, 0.15, 8, 4),
  lg: (color = '#000') =>
    createShadow(color, { width: 0, height: 8 }, 0.2, 16, 8),
  xl: (color = '#000') =>
    createShadow(color, { width: 0, height: 12 }, 0.25, 24, 12),
  primary: (color = '#38e8ff') =>
    createShadow(color, { width: 0, height: 0 }, 0.4, 12, 8),
};
