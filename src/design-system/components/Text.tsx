/**
 * Design System - Text Component
 * Reusable text component with typography variants
 */

import React from 'react';
import { Text as RNText, StyleSheet, TextStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { typography, TypographyVariant } from '../tokens/typography';

export type TextColor = 'default' | 'muted' | 'primary' | 'danger' | 'success';

export interface TextProps {
  children: React.ReactNode;
  variant?: TypographyVariant;
  color?: TextColor;
  style?: TextStyle;
  numberOfLines?: number;
}

export function Text({
  children,
  variant = 'body',
  color = 'default',
  style,
  numberOfLines,
}: TextProps) {
  const { colors } = useTheme();

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      ...typography[variant],
    };

    if (color === 'default') {
      baseStyle.color = colors.text;
    } else if (color === 'muted') {
      baseStyle.color = colors.textMuted;
    } else if (color === 'primary') {
      baseStyle.color = colors.primary;
    } else if (color === 'danger') {
      baseStyle.color = colors.danger;
    } else if (color === 'success') {
      baseStyle.color = colors.success;
    }

    return baseStyle;
  };

  return (
    <RNText style={[getTextStyle(), style]} numberOfLines={numberOfLines}>
      {children}
    </RNText>
  );
}
