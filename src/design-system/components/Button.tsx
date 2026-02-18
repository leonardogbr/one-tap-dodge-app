/**
 * Design System - Button Component
 * Matches code.html (Stitch UI Kit):
 * - Primary: bg-primary, text-dark-bg, shadow-glow-primary (PLAY)
 * - Ghost: border border-primary text-primary (GHOST BUTTON)
 * - Secondary: border neutral, text muted (SECONDARY ACTION)
 */

import React from 'react';
import { Text, ViewStyle, TextStyle } from 'react-native';
import { PressableScale } from '../../components/PressableScale';
import { useTheme } from '../../hooks/useTheme';
import { spacing } from '../tokens/spacing';
import { borderRadius } from '../tokens/borders';
import { typography } from '../tokens/typography';
import { shadows } from '../tokens/shadows';
import { Icon } from './Icon';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' | 'revive';
export type ButtonSize = 'small' | 'medium' | 'large';

export interface ButtonProps {
  title?: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  icon?: string;
  style?: ViewStyle;
  fullWidth?: boolean;
}

export function Button({
  title = '',
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  icon,
  style,
  fullWidth = false,
}: ButtonProps) {
  const { colors } = useTheme();

  const hasText = title && title.trim().length > 0;
  const hasIcon = !!icon;
  const hasBoth = hasText && hasIcon;

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: borderRadius.md, // code.html: rounded-xl (12px)
    };

    if (size === 'small') {
      baseStyle.paddingVertical = spacing.sm;
      baseStyle.paddingHorizontal = spacing.md;
      // Aplicar gap apenas se houver tanto ícone quanto texto
      if (hasBoth) {
        baseStyle.gap = spacing.xs;
      }
    } else if (size === 'medium') {
      baseStyle.paddingVertical = spacing.md;
      baseStyle.paddingHorizontal = spacing.xl;
      if (hasBoth) {
        baseStyle.gap = spacing.sm;
      }
    } else if (size === 'large') {
      baseStyle.paddingVertical = spacing.lg;
      baseStyle.paddingHorizontal = spacing.xl * 2;
      if (hasBoth) {
        baseStyle.gap = spacing.sm;
      }
    }

    // Se for apenas ícone, ajustar padding para manter proporção
    if (hasIcon && !hasText) {
      if (size === 'small') {
        baseStyle.paddingHorizontal = spacing.sm;
      } else if (size === 'medium') {
        baseStyle.paddingHorizontal = spacing.md;
      } else if (size === 'large') {
        baseStyle.paddingHorizontal = spacing.lg;
      }
    }

    // code.html: PLAY = bg-primary text-dark-bg; GHOST = border-primary text-primary; SECONDARY ACTION = border-slate-700 text-slate-400
    if (variant === 'primary') {
      baseStyle.backgroundColor = colors.primary;
      baseStyle.borderWidth = 0;
      Object.assign(baseStyle, shadows.primary(colors.primary));
    } else if (variant === 'secondary') {
      baseStyle.backgroundColor = 'transparent';
      baseStyle.borderWidth = 1;
      baseStyle.borderColor = colors.backgroundCard;
    } else if (variant === 'danger') {
      baseStyle.backgroundColor = 'transparent';
      baseStyle.borderWidth = 1;
      baseStyle.borderColor = colors.danger;
    } else if (variant === 'success') {
      baseStyle.backgroundColor = colors.success;
      baseStyle.borderWidth = 0;
    } else if (variant === 'ghost') {
      baseStyle.backgroundColor = 'transparent';
      baseStyle.borderWidth = 1;
      baseStyle.borderColor = colors.primary;
    } else if (variant === 'revive') {
      baseStyle.backgroundColor = colors.secondary;
      baseStyle.borderWidth = 0;
      Object.assign(baseStyle, shadows.primary(colors.secondary));
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

    if (variant === 'primary' || variant === 'success' || variant === 'revive') {
      baseStyle.color = variant === 'revive' ? '#fff' : colors.onPrimary;
    } else if (variant === 'secondary') {
      baseStyle.color = colors.textMuted;
    } else if (variant === 'danger') {
      baseStyle.color = colors.danger;
    } else if (variant === 'ghost') {
      baseStyle.color = colors.primary;
    } else {
      baseStyle.color = colors.text;
    }

    return baseStyle;
  };

  const buttonStyle = getButtonStyle();
  const textStyle = getTextStyle();
  const iconSize = size === 'small' ? 18 : 20;
  const iconColor = textStyle.color ? String(textStyle.color) : undefined;

  return (
    <PressableScale
      style={[buttonStyle, style]}
      onPress={onPress}
      disabled={disabled}
    >
      {icon && (
        <Icon name={icon} size={iconSize} color={iconColor} />
      )}
      {hasText && <Text style={textStyle}>{title}</Text>}
    </PressableScale>
  );
}
