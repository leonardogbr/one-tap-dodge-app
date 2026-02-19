/**
 * HUD — score, best (top); shield + coins (bottom). Design: Stitch game layout.
 */

import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { FONT_FAMILY } from '../../design-system/tokens/typography';
import { Icon } from '../../design-system/components/Icon';
import { OdometerNumber } from '../OdometerNumber';
import { spacing } from '../../theme';

interface HUDProps {
  score: number;
  best?: number;
  coinsThisRun?: number;
  shieldMeter?: number; // 0–1
  nearMissFlash?: boolean;
  /** 2x coins bonus active — show badge in HUD (center, below best). */
  coinMultiplierActive?: boolean;
}

export function HUD({
  score,
  best = 0,
  coinsThisRun = 0,
  shieldMeter = 0,
  nearMissFlash,
  coinMultiplierActive = false,
}: HUDProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const scoreScale = useSharedValue(1);
  const prevScoreRef = useRef(score);
  const shieldBreath = useSharedValue(1);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        topContainer: {
          position: 'absolute',
          top: insets.top + spacing.sm,
          left: 0,
          right: 0,
          alignItems: 'center',
          zIndex: 10,
        },
        score: { fontFamily: FONT_FAMILY.bold, fontSize: 36, fontWeight: '700', color: colors.text },
        best: { fontFamily: FONT_FAMILY.regular, fontSize: 14, color: colors.textMuted, marginTop: spacing.xs },
        coinMultiplierBadge: { marginTop: spacing.xs, backgroundColor: colors.success, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: 8 },
        coinMultiplierText: { fontFamily: FONT_FAMILY.bold, fontSize: 14, fontWeight: '700', color: colors.background },
        nearMissBadge: { marginTop: spacing.sm, alignSelf: 'center', backgroundColor: colors.primary, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: 8 },
        nearMissText: { fontFamily: FONT_FAMILY.bold, fontSize: 16, fontWeight: '700', color: colors.onPrimary },
        bottomContainer: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingTop: spacing.sm,
          paddingBottom: insets.bottom + spacing.xs,
          paddingHorizontal: spacing.xl,
          zIndex: 10,
        },
        bottomGradient: {
          backgroundColor: 'transparent',
        },
        bottomContent: {
          maxWidth: 260,
          alignSelf: 'center',
          alignItems: 'center',
          gap: spacing.lg,
        },
        shieldSection: {
          width: '100%',
          gap: spacing.xs,
        },
        shieldHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 4,
          paddingVertical: spacing.xs,
        },
        shieldLabelRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
        },
        shieldLabel: { fontFamily: FONT_FAMILY.regular, fontSize: 12, color: colors.secondary, fontWeight: '600', letterSpacing: 1 },
        shieldLabelReady: { color: colors.success, fontWeight: '700' },
        shieldReadyText: { fontSize: 10, fontWeight: '800', color: colors.success, letterSpacing: 1 },
        shieldBar: {
          width: '100%',
          height: 10,
          flexDirection: 'row',
          backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
          borderRadius: 999,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
        },
        shieldBarReady: { borderColor: colors.success, borderWidth: 1.5 },
        shieldFill: { height: '100%', backgroundColor: colors.secondary, borderRadius: 999, minWidth: 0 },
        shieldFillReady: { backgroundColor: colors.success },
        shieldBarSpacer: { flex: 1, minWidth: 0 },
        coinsPill: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.sm,
          backgroundColor: isDark ? colors.backgroundCard : 'rgba(0,0,0,0.08)',
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.lg,
          borderRadius: 999,
        },
        coinsCount: {
          fontFamily: FONT_FAMILY.bold,
          fontSize: 14,
          fontWeight: '700',
          color: colors.text,
          letterSpacing: 2,
        },
      }),
    [colors, isDark, insets.top, insets.bottom]
  );

  useEffect(() => {
    if (score > prevScoreRef.current) {
      scoreScale.value = withSequence(
        withTiming(1.06, { duration: 80 }),
        withTiming(1, { duration: 120 })
      );
    }
    prevScoreRef.current = score;

    return () => {
      if (scoreScale.value !== 1) scoreScale.value = 1;
    };
  }, [score, scoreScale]);

  useEffect(() => {
    if (shieldMeter >= 1) {
      shieldBreath.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    } else {
      shieldBreath.value = withTiming(1, { duration: 200 });
    }
  }, [shieldMeter, shieldBreath]);

  const scoreAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scoreScale.value }],
  }));

  const shieldBreathStyle = useAnimatedStyle(() => ({
    transform: [{ scale: shieldBreath.value }],
  }));

  return (
    <>
      <View style={styles.topContainer} pointerEvents="none">
        <Animated.View style={scoreAnimatedStyle}>
          <Text style={styles.score}>{score}</Text>
        </Animated.View>
        {best > 0 && (
          <Text style={styles.best}>{t('game.bestShort')} {best}</Text>
        )}
        {coinMultiplierActive && (
          <View style={styles.coinMultiplierBadge}>
            <Text style={styles.coinMultiplierText}>{t('game.doubleCoins')}</Text>
          </View>
        )}
        {nearMissFlash && (
          <Animated.View
            style={styles.nearMissBadge}
            entering={FadeIn.duration(180)}
            exiting={FadeOut.duration(220)}
          >
            <Text style={styles.nearMissText}>{t('game.nearMissBonusLabel')}</Text>
          </Animated.View>
        )}
      </View>

      <View
        style={[
          styles.bottomContainer,
          styles.bottomGradient,
        ]}
        pointerEvents="none"
      >
        <View style={styles.bottomContent}>
          <View style={styles.shieldSection}>
            <View style={styles.shieldHeader}>
              <View style={styles.shieldLabelRow}>
                <Animated.View style={shieldBreathStyle}>
                  <Icon name="shield" size={18} color={shieldMeter >= 1 ? colors.success : colors.secondary} />
                </Animated.View>
                <Text
                  style={[
                    styles.shieldLabel,
                    shieldMeter >= 1 && styles.shieldLabelReady,
                  ]}
                >
                  {t('game.shieldPower')}
                </Text>
              </View>
              {shieldMeter >= 1 && (
                <Text style={styles.shieldReadyText}>{t('game.shieldReady')}</Text>
              )}
            </View>
            <View
              style={[
                styles.shieldBar,
                shieldMeter >= 1 && styles.shieldBarReady,
              ]}
            >
              <View
                style={[
                  styles.shieldFill,
                  shieldMeter >= 1 && styles.shieldFillReady,
                  { flex: shieldMeter },
                ]}
              />
              <View style={[styles.shieldBarSpacer, { flex: 1 - shieldMeter }]} />
            </View>
          </View>
          <View style={styles.coinsPill}>
            <Icon name="monetization_on" size={18} color={colors.coin} />
            <OdometerNumber value={coinsThisRun} style={styles.coinsCount} />
          </View>
        </View>
      </View>
    </>
  );
}
