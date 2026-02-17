/**
 * Design System - Button Component
 * Reusable button component with variants
 */

import React from 'react';
import { Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { PressableScale } from '../../components/PressableScale';
import { useTheme } from '../../hooks/useTheme';
import { spacing } from '../tokens/spacing';
import { borderRadius } from '../tokens/borders';
import { typography } from '../tokens/typography';
import { shadows } from '../tokens/shadows';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
export type ButtonSize = 'small' | 'medium' | 'large';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  icon?: string;
  style?: ViewStyle;
  fullWidth?: boolean;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  icon,
  style,
  fullWidth = false,
}: ButtonProps) {
  const { colors } = useTheme();

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: borderRadius.full,
    };

    // Size styles
    if (size === 'small') {
      baseStyle.paddingVertical = spacing.sm;
      baseStyle.paddingHorizontal = spacing.md;
      baseStyle.gap = spacing.xs;
    } else if (size === 'medium') {
      baseStyle.paddingVertical = spacing.md;
      baseStyle.paddingHorizontal = spacing.xl;
      baseStyle.gap = spacing.sm;
    } else if (size === 'large') {
      baseStyle.paddingVertical = spacing.lg;
      baseStyle.paddingHorizontal = spacing.xl * 2;
      baseStyle.gap = spacing.sm;
    }

    // Variant styles
    if (variant === 'primary') {
      baseStyle.backgroundColor = colors.primary;
      Object.assign(baseStyle, shadows.primary(colors.primary));
    } else if (variant === 'secondary') {
      baseStyle.backgroundColor = 'transparent';
      baseStyle.borderWidth = 1;
      baseStyle.borderColor = colors.primaryDim;
    } else if (variant === 'danger') {
      baseStyle.backgroundColor = 'transparent';
      baseStyle.borderWidth = 1;
      baseStyle.borderColor = colors.danger;
    } else if (variant === 'success') {
      baseStyle.backgroundColor = colors.success;
    } else if (variant === 'ghost') {
      baseStyle.backgroundColor = colors.backgroundLight;
    }

    if (fullWidth) {
      baseStyle.width = '100%';
    }

    if (disabled) {
      baseStyle.opacity = 0.5;
    }

    return baseStyle;
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      ...(size === 'small' ? typography.buttonSmall : typography.button),
    };

    if (variant === 'primary' || variant === 'success') {
      baseStyle.color = colors.onPrimary;
    } else if (variant === 'secondary') {
      baseStyle.color = colors.primary;
    } else if (variant === 'danger') {
      baseStyle.color = colors.danger;
    } else {
      baseStyle.color = colors.text;
    }

    return baseStyle;
  };

  const buttonStyle = getButtonStyle();
  const textStyle = getTextStyle();

  return (
    <PressableScale
      style={[buttonStyle, style]}
      onPress={onPress}
      disabled={disabled}
    >
      {icon && <Text style={textStyle}>{icon}</Text>}
      <Text style={textStyle}>{title}</Text>
    </PressableScale>
  );
}
