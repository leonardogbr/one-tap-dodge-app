/**
 * OdometerNumber — roll/slot-machine style number animation.
 * Digits animate vertically (new digit "pushes" old one out).
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, type TextStyle } from 'react-native';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { FONT_FAMILY } from '../design-system/tokens/typography';
import { darkColors } from '../design-system/tokens/colors';

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const ANIM_DURATION = 220;

function splitIntoDigits(value: number): number[] {
  if (value < 0) return [0];
  if (value === 0) return [0];
  const digits: number[] = [];
  let n = value;
  while (n > 0) {
    digits.unshift(n % 10);
    n = Math.floor(n / 10);
  }
  return digits;
}

interface OdometerDigitProps {
  digit: number;
  fontSize: number;
  color: string;
  letterSpacing?: number;
}

function OdometerDigit({ digit, fontSize, color, letterSpacing = 0 }: OdometerDigitProps) {
  const digitHeight = fontSize * 1.35;
  const translateY = useSharedValue(-digit * digitHeight);

  useEffect(() => {
    translateY.value = withTiming(-digit * digitHeight, {
      duration: ANIM_DURATION,
      easing: Easing.out(Easing.cubic),
    });
  }, [digit, digitHeight, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <View style={[styles.digitSlot, { height: digitHeight, width: fontSize * 0.6 }]}>
      <Animated.View style={[styles.digitStrip, animatedStyle, { height: digitHeight * 10 }]}>
        {DIGITS.map((d) => (
          <Text
            key={d}
            style={[
              styles.digit,
              {
                fontSize,
                color,
                letterSpacing,
                height: digitHeight,
                lineHeight: digitHeight,
              },
            ]}
          >
            {d}
          </Text>
        ))}
      </Animated.View>
    </View>
  );
}

export interface OdometerNumberProps {
  value: number;
  style?: TextStyle;
  /** Min number of digits (pad with leading zeros). Default: 1 */
  minDigits?: number;
}

const FADE_IN_DURATION = 200;

export function OdometerNumber({
  value,
  style,
  minDigits = 1,
}: OdometerNumberProps) {
  const digits = splitIntoDigits(value);
  const padded = digits.length < minDigits
    ? [...Array(minDigits - digits.length).fill(0), ...digits]
    : digits;

  const prevDigitCountRef = useRef(padded.length);
  const didAddDigit = padded.length > prevDigitCountRef.current;
  useEffect(() => {
    prevDigitCountRef.current = padded.length;
  }, [padded.length]);

  const fontSize = (style?.fontSize as number) ?? 14;
  const color = (style?.color as string) ?? darkColors.text;
  const letterSpacing = (style?.letterSpacing as number) ?? 2;

  return (
    <View style={[styles.container, style]}>
      {padded.map((d, i) => {
        const isNewDigit = didAddDigit && i === padded.length - 1;
        const digitEl = (
          <OdometerDigit
            key={i}
            digit={d}
            fontSize={fontSize}
            color={color}
            letterSpacing={letterSpacing}
          />
        );
        return isNewDigit ? (
          <Animated.View
            key={i}
            style={styles.digitWrapper}
            entering={FadeIn.duration(FADE_IN_DURATION)}
          >
            {digitEl}
          </Animated.View>
        ) : (
          digitEl
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  digitWrapper: {
    flexDirection: 'row',
  },
  digitSlot: {
    overflow: 'hidden',
  },
  digitStrip: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  digit: {
    fontFamily: FONT_FAMILY.bold,
    fontWeight: '700',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
});
