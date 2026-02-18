/**
 * Game Over — full screen with score, stats, revive option, Play Again, Home.
 * Replaces overlay; back/Home goes to Home. Play Again replaces with Game.
 */

import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  BackHandler,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  cancelAnimation,
  Easing,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../state/store';
import { useInterstitialBeforeGame } from '../hooks/useInterstitialBeforeGame';
import { useRewardedAdLoaded } from '../hooks/useRewardedAdLoaded';
import { spacing } from '../theme';
import { isRewardedLoaded, showRewarded } from '../services/ads';
import { Text, Card, Button } from '../design-system';
import { Icon } from '../design-system/components/Icon';
import { borderRadius, shadows } from '../design-system/tokens';

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function GameOverScreen() {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const route = useRoute<RouteProp<RootStackParamList, 'GameOver'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'GameOver'>>();
  const { score, isNewBest, runTimeMs, nearMisses, coins, canRevive } = route.params;
  const setReviveEarnedFromAd = useGameStore((s) => s.setReviveEarnedFromAd);
  const [reviveLoading, setReviveLoading] = useState(false);
  const contentWidth = screenWidth - spacing.xl * 2;
  const isNavigatingRef = useRef(false);
  const maybeShowInterstitialThenProceed = useInterstitialBeforeGame();
  const rewardedAdLoaded = useRewardedAdLoaded();

  // Floating animation for NEW BEST badge
  // Always initialize hooks to maintain consistent order
  const floatPhase = useSharedValue(0);
  const scalePhase = useSharedValue(0);
  const opacityPhase = useSharedValue(0);

  useEffect(() => {
    if (isNewBest) {
      // Initial entrance animation: fade in + scale bounce
      opacityPhase.value = withTiming(1, { duration: 200 });
      scalePhase.value = withSequence(
        withTiming(1.3, { duration: 300, easing: Easing.out(Easing.cubic) }),
        withTiming(1, { duration: 200, easing: Easing.in(Easing.cubic) })
      );

      // Start floating animation after initial bounce
      floatPhase.value = withDelay(
        500,
        withRepeat(
          withTiming(1, {
            duration: 3000,
            easing: Easing.inOut(Easing.sin),
          }),
          -1,
          false
        )
      );
    } else {
      // Cancel animations and reset when not showing
      cancelAnimation(floatPhase);
      cancelAnimation(scalePhase);
      cancelAnimation(opacityPhase);
      // Reset values synchronously to avoid warnings
      floatPhase.value = 0;
      scalePhase.value = 0;
      opacityPhase.value = 0;
    }

    // Cleanup: cancel animations when component unmounts
    return () => {
      cancelAnimation(floatPhase);
      cancelAnimation(scalePhase);
      cancelAnimation(opacityPhase);
      // Reset values on cleanup
      floatPhase.value = 0;
      scalePhase.value = 0;
      opacityPhase.value = 0;
    };
  }, [isNewBest, floatPhase, scalePhase, opacityPhase]);

  const floatAnimatedStyle = useAnimatedStyle(() => {
    'worklet';
    const translateY = interpolate(
      floatPhase.value,
      [0, 0.5, 1],
      [0, -8, 0],
      Extrapolation.CLAMP
    );
    const rotate = interpolate(
      floatPhase.value,
      [0, 0.5, 1],
      [0, 2, 0],
      Extrapolation.CLAMP
    );
    return {
      opacity: opacityPhase.value,
      transform: [
        { translateY },
        { rotate: `${rotate}deg` },
        { scale: scalePhase.value },
      ],
    };
  });

  const handlePlayAgain = () => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    maybeShowInterstitialThenProceed(() => {
      // Reset navigation stack: remove both Game and GameOver, then navigate to new Game
      // This ensures we start with a clean stack: Home -> Game (new)
      navigation.reset({
        index: 1,
        routes: [
          { name: 'Home' },
          { name: 'Game' },
        ],
      });
    }).finally(() => {
      setTimeout(() => {
        isNavigatingRef.current = false;
      }, 1000);
    });
  };

  const handleHome = () => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    // Pop both GameOver and Game screens to go back to Home
    navigation.pop(2);
    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 1000);
  };

  const handleRevive = async () => {
    if (!canRevive || !isRewardedLoaded() || reviveLoading || isNavigatingRef.current) return;
    setReviveLoading(true);
    isNavigatingRef.current = true;
    try {
      const earned = await showRewarded();
      if (earned) {
        setReviveEarnedFromAd(true);
        navigation.goBack();
      }
    } finally {
      setReviveLoading(false);
      setTimeout(() => {
        isNavigatingRef.current = false;
      }, 1000);
    }
  };

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      // Pop both GameOver and Game screens to go back to Home
      navigation.pop(2);
      return true;
    });
    return () => sub.remove();
  }, [navigation]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
        scroll: { flex: 1 },
        scrollContent: {
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing.xl,
          alignItems: 'center',
          width: '100%',
        },
        titleUnderline: {
          width: 64,
          height: 3,
          borderRadius: 2,
          backgroundColor: colors.danger,
          marginBottom: spacing.xl,
        },
        scoreContainer: {
          position: 'relative',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.xs,
          minHeight: 60,
          width: '100%',
          paddingHorizontal: spacing.md,
        },
        scoreWrap: { alignItems: 'center', justifyContent: 'center' },
        newBestBadge: {
          position: 'absolute',
          top: -10,
          left: '50%',
          marginLeft: Math.min(screenWidth * 0.15, 70),
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs,
          borderRadius: borderRadius.md,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
          maxWidth: screenWidth * 0.35,
        },
        statsRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          width: '100%',
          maxWidth: 320,
          marginBottom: spacing.xl,
        },
        statCard: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'space-between',
          marginHorizontal: spacing.xs,
          minHeight: 112,
        },
        statCardTop: {
          alignItems: 'center',
          justifyContent: 'flex-start',
        },
        statCardValue: {
          alignSelf: 'stretch',
          alignItems: 'center',
          paddingTop: spacing.sm,
        },
        statIcon: { fontSize: 24, marginBottom: spacing.xs },
        reviveCard: {
          width: '100%',
          maxWidth: 340,
          marginBottom: spacing.lg,
        },
        buttonsWrap: {
          width: contentWidth,
          alignSelf: 'center',
        },
      }),
    [colors, insets.top, insets.bottom, contentWidth, screenWidth]
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text variant="h1" color="danger" style={{ textTransform: 'uppercase', marginBottom: spacing.sm, textAlign: 'center' }}>
          {t('game.gameOver')}
        </Text>
        <View style={styles.titleUnderline} />
        <View style={styles.scoreContainer}>
          <View style={styles.scoreWrap}>
            <Text variant="h1" style={{ fontSize: 48, textAlign: 'center' }}>{score.toLocaleString()}</Text>
          </View>
          {isNewBest && (
            <Animated.View
              style={[
                styles.newBestBadge,
                { backgroundColor: colors.success },
                shadows.md(colors.success),
                floatAnimatedStyle,
              ]}
            >
              <Text variant="caption" style={{ color: colors.background, fontWeight: '700' }}>🏆</Text>
              <Text variant="caption" style={{ color: colors.background, fontWeight: '700' }}>{t('game.newBest')}</Text>
            </Animated.View>
          )}
        </View>
        <Text variant="bodySmall" color="muted" style={{ marginBottom: spacing.lg, textAlign: 'center' }}>
          {t('game.finalScore')}
        </Text>

        <View style={styles.statsRow}>
          <Card variant="default" style={styles.statCard}>
            <View style={styles.statCardTop}>
              <Icon name="timer" size={28} color={colors.primary} style={{ marginBottom: spacing.sm }} />
              <Text variant="caption" color="muted" style={{ textTransform: 'uppercase', marginBottom: spacing.xs, textAlign: 'center' }}>
                {t('game.time')}
              </Text>
            </View>
            <View style={styles.statCardValue}>
              <Text variant="h4" style={{ textAlign: 'center' }}>{formatTime(runTimeMs)}</Text>
            </View>
          </Card>
          <Card variant="default" style={styles.statCard}>
            <View style={styles.statCardTop}>
              <Icon name="warning" size={28} color={colors.obstacle} style={{ marginBottom: spacing.sm }} />
              <Text variant="caption" color="muted" style={{ textTransform: 'uppercase', marginBottom: spacing.xs, textAlign: 'center' }}>
                {t('game.nearMiss')}
              </Text>
            </View>
            <View style={styles.statCardValue}>
              <Text variant="h4" style={{ textAlign: 'center' }}>{nearMisses}</Text>
            </View>
          </Card>
          <Card variant="default" style={styles.statCard}>
            <View style={styles.statCardTop}>
              <Icon name="monetization_on" size={28} color={colors.coin} style={{ marginBottom: spacing.sm }} />
              <Text variant="caption" color="muted" style={{ textTransform: 'uppercase', marginBottom: spacing.xs, textAlign: 'center' }}>
                {t('game.coins')}
              </Text>
            </View>
            <View style={styles.statCardValue}>
              <Text variant="h4" style={{ textAlign: 'center' }}>{coins}</Text>
            </View>
          </Card>
        </View>

        {canRevive && (
          <Card variant="default" style={styles.reviveCard}>
            <Text variant="h4" style={{ marginBottom: spacing.xs, textAlign: 'left' }}>
              {t('game.oneLastChance')}
            </Text>
            <Text variant="bodySmall" color="muted" style={{ marginBottom: spacing.md, textAlign: 'left' }}>
              {t('game.watchAdReviveDescription')}
            </Text>
            <Button
              title={rewardedAdLoaded ? t('game.watchAdToContinue') : t('game.loadingAd')}
              onPress={handleRevive}
              variant="revive"
              size="medium"
              icon="play_circle"
              disabled={!rewardedAdLoaded || reviveLoading}
              fullWidth
            />
          </Card>
        )}

        <View style={styles.buttonsWrap}>
          <Button
            title={t('game.playAgain')}
            onPress={handlePlayAgain}
            variant="primary"
            size="large"
            icon="replay"
            fullWidth
            style={{ marginBottom: spacing.md }}
          />
          <Button
            title={t('common.home')}
            onPress={handleHome}
            variant="secondary"
            size="medium"
            icon="home"
            fullWidth
          />
        </View>
      </ScrollView>
    </View>
  );
}
