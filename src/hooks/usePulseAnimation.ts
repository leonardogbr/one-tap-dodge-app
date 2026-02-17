/**
 * Hook para animação de pulse (scale + opacity) usada na skin prime e em skins com pulse.
 * Uma única fase 0→1 em loop com easing sinusoidal; scale e opacity derivados e sincronizados.
 * No light mode usa opacidade maior para o pulse ser visível no fundo claro.
 */

import { useEffect } from 'react';
import {
  cancelAnimation,
  interpolate,
  Extrapolation,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../hooks/useTheme';

const PULSE_DURATION_MS = 2200;
const PULSE_SCALE_PEAK = 1.45;
const PULSE_OPACITY_PEAK_DARK = 0.5;
const PULSE_OPACITY_PEAK_LIGHT = 0.85;

export function usePulseAnimation(enabled: boolean) {
  const { isDark } = useTheme();
  const phase = useSharedValue(0);
  const opacityPeakSv = useSharedValue(isDark ? PULSE_OPACITY_PEAK_DARK : PULSE_OPACITY_PEAK_LIGHT);

  useEffect(() => {
    opacityPeakSv.value = isDark ? PULSE_OPACITY_PEAK_DARK : PULSE_OPACITY_PEAK_LIGHT;
  }, [isDark, opacityPeakSv]);

  useEffect(() => {
    if (enabled) {
      cancelAnimation(phase);
      phase.value = withRepeat(
        withTiming(1, {
          duration: PULSE_DURATION_MS,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        false
      );
    } else {
      cancelAnimation(phase);
      phase.value = withTiming(0, { duration: 200 });
    }
  }, [enabled]);

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    const p = phase.value;
    const scale = interpolate(p, [0, 0.5, 1], [1, PULSE_SCALE_PEAK, 1], Extrapolation.CLAMP);
    const opacity = interpolate(p, [0, 0.5, 1], [0, opacityPeakSv.value, 0], Extrapolation.CLAMP);
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  return animatedStyle;
}
