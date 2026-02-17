/**
 * Game Over — full screen with score, stats, revive option, Play Again, Home.
 * Replaces overlay; back/Home goes to Home. Play Again replaces with Game.
 */

import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
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
import { PressableScale } from '../components/PressableScale';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../state/store';
import { spacing } from '../theme';
import { isRewardedLoaded, showRewarded } from '../services/ads';

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
      opacityPhase.value = 0;
      scalePhase.value = 0;
      floatPhase.value = 0;
    }
    
    // Cleanup: cancel animations when component unmounts
    return () => {
      cancelAnimation(floatPhase);
      cancelAnimation(scalePhase);
      cancelAnimation(opacityPhase);
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
    // Reset navigation stack: remove both Game and GameOver, then navigate to new Game
    // This ensures we start with a clean stack: Home -> Game (new)
    navigation.reset({
      index: 1,
      routes: [
        { name: 'Home' },
        { name: 'Game' },
      ],
    });
    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 1000);
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
        title: {
          fontSize: 32,
          fontWeight: '800',
          color: colors.danger,
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginBottom: spacing.sm,
          textAlign: 'center',
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
          paddingHorizontal: spacing.md, // Add padding to ensure badge doesn't go off screen
        },
        scoreWrap: { alignItems: 'center', justifyContent: 'center' },
        score: {
          fontSize: 48,
          fontWeight: '800',
          color: colors.text,
          textAlign: 'center',
        },
        newBestBadge: {
          position: 'absolute',
          top: -10,
          left: '50%',
          marginLeft: Math.min(screenWidth * 0.15, 70), // Position to the right of score center, but limit to stay on screen
          backgroundColor: colors.success,
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs,
          borderRadius: 12,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
          shadowColor: colors.success,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.5,
          shadowRadius: 8,
          elevation: 8,
          maxWidth: screenWidth * 0.35, // Ensure badge doesn't exceed screen width
        },
        newBestText: { fontSize: 12, fontWeight: '700', color: colors.background },
        finalScoreLabel: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.lg, textAlign: 'center' },
        statsRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          width: '100%',
          maxWidth: 320,
          marginBottom: spacing.xl,
        },
        statCard: {
          flex: 1,
          backgroundColor: colors.backgroundLight,
          borderRadius: 16,
          padding: spacing.md,
          alignItems: 'center',
          marginHorizontal: spacing.xs,
        },
        statIcon: { fontSize: 24, marginBottom: spacing.xs },
        statLabel: {
          fontSize: 11,
          color: colors.textMuted,
          textTransform: 'uppercase',
          marginBottom: spacing.xs,
          textAlign: 'center',
        },
        statValue: { fontSize: 20, fontWeight: '700', color: colors.text, textAlign: 'center' },
        reviveCard: {
          width: '100%',
          maxWidth: 340,
          backgroundColor: colors.backgroundLight,
          borderRadius: 20,
          padding: spacing.lg,
          marginBottom: spacing.lg,
        },
        reviveTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.xs, textAlign: 'left' },
        reviveDesc: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.md, textAlign: 'left' },
        reviveBtn: {
          alignSelf: 'stretch',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.sm,
          backgroundColor: colors.primary,
          paddingVertical: spacing.md,
          borderRadius: 999,
        },
        reviveBtnText: { fontSize: 16, fontWeight: '700', color: colors.onPrimary, textAlign: 'center' },
        buttonsWrap: {
          width: contentWidth,
          alignSelf: 'center',
        },
        playAgainBtn: {
          width: '100%',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.sm,
          backgroundColor: colors.primary,
          paddingVertical: spacing.lg,
          borderRadius: 999,
          marginBottom: spacing.md,
        },
        playAgainBtnText: { fontSize: 18, fontWeight: '700', color: colors.onPrimary, textAlign: 'center' },
        homeBtn: {
          width: '100%',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.sm,
          backgroundColor: colors.backgroundLight,
          borderWidth: 1,
          borderColor: colors.textMuted,
          paddingVertical: spacing.md,
          borderRadius: 999,
        },
        homeBtnText: { fontSize: 17, fontWeight: '700', color: colors.text, textAlign: 'center' },
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
        <Text style={styles.title}>{t('game.gameOver')}</Text>
        <View style={styles.titleUnderline} />
        <View style={styles.scoreContainer}>
          <View style={styles.scoreWrap}>
            <Text style={styles.score}>{score.toLocaleString()}</Text>
          </View>
          {isNewBest && (
            <Animated.View style={[styles.newBestBadge, floatAnimatedStyle]}>
              <Text style={styles.newBestText}>🏆</Text>
              <Text style={styles.newBestText}>{t('game.newBest')}</Text>
            </Animated.View>
          )}
        </View>
        <Text style={styles.finalScoreLabel}>{t('game.finalScore')}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🕐</Text>
            <Text style={styles.statLabel}>{t('game.time')}</Text>
            <Text style={styles.statValue}>{formatTime(runTimeMs)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>⚠️</Text>
            <Text style={styles.statLabel}>{t('game.nearMiss')}</Text>
            <Text style={styles.statValue}>{nearMisses}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🪙</Text>
            <Text style={styles.statLabel}>{t('game.coins')}</Text>
            <Text style={styles.statValue}>{coins}</Text>
          </View>
        </View>

        {canRevive && (
          <View style={styles.reviveCard}>
            <Text style={styles.reviveTitle}>{t('game.oneLastChance')}</Text>
            <Text style={styles.reviveDesc}>{t('game.watchAdReviveDescription')}</Text>
            <PressableScale
              style={styles.reviveBtn}
              onPress={handleRevive}
              disabled={!isRewardedLoaded() || reviveLoading}
            >
              {reviveLoading ? (
                <ActivityIndicator color={colors.onPrimary} size="small" />
              ) : (
                <>
                  <Text style={styles.reviveBtnText}>▶</Text>
                  <Text style={styles.reviveBtnText}>
                    {isRewardedLoaded() ? t('game.watchAdToContinue') : t('game.loadingAd')}
                  </Text>
                </>
              )}
            </PressableScale>
          </View>
        )}

        <View style={styles.buttonsWrap}>
          <PressableScale style={styles.playAgainBtn} onPress={handlePlayAgain}>
            <Text style={styles.playAgainBtnText}>↻</Text>
            <Text style={styles.playAgainBtnText}>{t('game.playAgain')}</Text>
          </PressableScale>
          <PressableScale style={styles.homeBtn} onPress={handleHome}>
            <Text style={styles.homeBtnText}>⌂</Text>
            <Text style={styles.homeBtnText}>{t('common.home')}</Text>
          </PressableScale>
        </View>
      </ScrollView>
    </View>
  );
}
