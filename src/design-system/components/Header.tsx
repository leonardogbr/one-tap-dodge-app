/**
 * Design System - Header Component
 * Reusable header component with back button and title
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PressableScale } from '../../components/PressableScale';
import { Text } from './Text';
import { useTheme } from '../../hooks/useTheme';
import { spacing } from '../tokens/spacing';

export interface HeaderProps {
  title: string;
  onBack?: () => void;
  backLabel?: string;
  rightComponent?: React.ReactNode;
  style?: ViewStyle;
}

export function Header({
  title,
  onBack,
  backLabel,
  rightComponent,
  style,
}: HeaderProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.md,
          paddingTop: insets.top + spacing.sm,
          paddingBottom: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: colors.backgroundLight,
        },
        style,
      ]}
    >
      {onBack && (
        <PressableScale
          style={{ paddingVertical: spacing.sm, paddingRight: spacing.md }}
          onPress={onBack}
        >
          <Text variant="body" color="primary">
            {backLabel || 'Back'}
          </Text>
        </PressableScale>
      )}
      <Text variant="h4" style={{ flex: 1 }}>
        {title}
      </Text>
      {rightComponent && <View>{rightComponent}</View>}
    </View>
  );
}
