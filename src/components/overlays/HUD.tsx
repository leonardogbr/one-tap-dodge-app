/**
 * HUD — score, best, coins, shield meter, near-miss. Phase 4: Reanimated + score bounce + theme.
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
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
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
  const { colors } = useTheme();
  const scoreScale = useSharedValue(1);
  const prevScoreRef = useRef(score);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          position: 'absolute',
          top: insets.top + spacing.sm,
          left: 0,
          right: 0,
          alignItems: 'center',
          zIndex: 10,
        },
        score: { fontSize: 36, fontWeight: '700', color: colors.text },
        best: { fontSize: 14, color: colors.textMuted, marginTop: spacing.xs },
        coinMultiplierBadge: { marginTop: spacing.xs, backgroundColor: colors.success, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: 8 },
        coinMultiplierText: { fontSize: 14, fontWeight: '700', color: colors.background },
        row: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, gap: spacing.sm },
        coins: { fontSize: 14, color: colors.text },
        shieldWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
        shieldBar: { width: 80, height: 8, backgroundColor: colors.backgroundLight, borderRadius: 4, overflow: 'hidden', borderWidth: 1, borderColor: 'transparent' },
        shieldBarReady: { borderColor: colors.success, borderWidth: 1.5 },
        shieldFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 4 },
        shieldFillReady: { backgroundColor: colors.success },
        shieldLabel: { fontSize: 12, color: colors.textMuted, minWidth: 52 },
        shieldLabelReady: { color: colors.success, fontWeight: '700' },
        nearMissBadge: { marginTop: spacing.sm, alignSelf: 'center', backgroundColor: colors.primary, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: 8 },
        nearMissText: { fontSize: 16, fontWeight: '700', color: colors.onPrimary },
      }),
    [colors, insets.top]
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
      // Cleanup: reset scale on unmount
      if (scoreScale.value !== 1) {
        scoreScale.value = 1;
      }
    };
  }, [score, scoreScale]);

  const scoreAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scoreScale.value }],
  }));

  return (
    <View style={styles.container} pointerEvents="none">
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
      <View style={styles.row}>
        <Text style={styles.coins}>🪙 {coinsThisRun}</Text>
        <View style={styles.shieldWrap}>
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
                { width: `${Math.min(100, shieldMeter * 100)}%` },
              ]}
            />
          </View>
          <Text
            style={[
              styles.shieldLabel,
              shieldMeter >= 1 && styles.shieldLabelReady,
            ]}
          >
            {shieldMeter >= 1 ? t('game.shieldReady') : t('game.shield')}
          </Text>
        </View>
      </View>
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
  );
}
