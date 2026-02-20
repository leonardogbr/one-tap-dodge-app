/**
 * Reward badge — animated dot on Challenges button when reward is available.
 * Uses React Native Animated (not Reanimated) to avoid conflict with player pulse (Reanimated).
 * Different animation runtimes = no interference.
 */

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface RewardBadgeProps {
  visible: boolean;
  style?: ViewStyle;
}

export function RewardBadge({ visible, style }: RewardBadgeProps) {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.25,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      anim.start();
      return () => anim.stop();
    } else {
      Animated.timing(scale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.badge,
        {
          backgroundColor: colors.coin,
          borderColor: colors.background,
          shadowColor: colors.coin,
        },
        style,
        { transform: [{ scale }] },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    zIndex: 1,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 8,
  },
});
