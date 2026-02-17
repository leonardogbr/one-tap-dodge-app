/**
 * Touchable with scale-down micro-animation on press. Phase 4 polish.
 * Includes protection against double-click/double-tap.
 */

import React, { useRef } from 'react';
import { TouchableOpacity, type ViewStyle, type StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

interface PressableScaleProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress: () => void;
  disabled?: boolean;
  /** Minimum delay between presses in milliseconds. Default: 300ms */
  debounceMs?: number;
}

export function PressableScale({
  children,
  style,
  onPress,
  disabled = false,
  debounceMs = 300,
}: PressableScaleProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const isProcessingRef = useRef(false);
  const lastPressTimeRef = useRef<number>(0);

  const handlePress = () => {
    if (disabled || isProcessingRef.current) return;
    
    const now = Date.now();
    const timeSinceLastPress = now - lastPressTimeRef.current;
    
    // Prevent double-click if pressed too soon after last press
    if (timeSinceLastPress < debounceMs) {
      return;
    }
    
    lastPressTimeRef.current = now;
    isProcessingRef.current = true;
    
    try {
      onPress();
    } finally {
      // Reset processing flag after debounce delay to allow next press
      setTimeout(() => {
        isProcessingRef.current = false;
      }, debounceMs);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      onPressIn={() => {
        if (!disabled && !isProcessingRef.current) {
          scale.value = withTiming(0.96, { duration: 80 });
        }
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 150 });
      }}
      disabled={disabled || isProcessingRef.current}
      activeOpacity={1}
    >
      <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
    </TouchableOpacity>
  );
}
