/**
 * Design System - Card Component
 * Reusable card component with variants
 */

import React from 'react';
import { View, type ViewStyle, type StyleProp } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { spacing } from '../tokens/spacing';
import { borderRadius } from '../tokens/borders';
import { shadows } from '../tokens/shadows';

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'highlighted';

export interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  style?: StyleProp<ViewStyle>;
  padding?: keyof typeof spacing;
}

export function Card({
  children,
  variant = 'default',
  style,
  padding = 'md',
}: CardProps) {
  const { colors } = useTheme();

  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: borderRadius.md,
      padding: spacing[padding],
    };

    if (variant === 'default') {
      baseStyle.backgroundColor = colors.backgroundLight;
    } else if (variant === 'elevated') {
      baseStyle.backgroundColor = colors.backgroundCard;
      Object.assign(baseStyle, shadows.md());
    } else if (variant === 'outlined') {
      baseStyle.backgroundColor = colors.backgroundLight;
      baseStyle.borderWidth = 1;
      baseStyle.borderColor = colors.primaryDim;
    } else if (variant === 'highlighted') {
      baseStyle.backgroundColor = colors.backgroundCard;
      baseStyle.borderWidth = 1;
      baseStyle.borderColor = colors.primaryDim;
      Object.assign(baseStyle, shadows.md());
    }

    return baseStyle;
  };

  return <View style={[getCardStyle(), style]}>{children}</View>;
}
