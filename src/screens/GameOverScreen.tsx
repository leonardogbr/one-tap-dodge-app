/**
 * Game Over — full screen with score, stats, revive option, Play Again, Home.
 * Replaces overlay; back/Home goes to Home. Play Again replaces with Game.
 */

import React, { useMemo, useState, useEffect } from 'react';
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

  const handlePlayAgain = () => {
    navigation.replace('Game');
  };

  const handleHome = () => {
    navigation.pop(2);
  };

  const handleRevive = async () => {
    if (!canRevive || !isRewardedLoaded() || reviveLoading) return;
    setReviveLoading(true);
    const earned = await showRewarded();
    setReviveLoading(false);
    if (earned) {
      setReviveEarnedFromAd(true);
      navigation.goBack();
    }
  };

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
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
        scoreWrap: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', marginBottom: spacing.xs },
        score: {
          fontSize: 48,
          fontWeight: '800',
          color: colors.text,
          textAlign: 'center',
        },
        newBestBadge: {
          backgroundColor: colors.success,
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs,
          borderRadius: 12,
          marginLeft: spacing.sm,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
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
        statLabel: { fontSize: 11, color: colors.textMuted, textTransform: 'uppercase', marginBottom: spacing.xs },
        statValue: { fontSize: 20, fontWeight: '700', color: colors.text },
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
        reviveBtnText: { fontSize: 16, fontWeight: '700', color: '#fff', textAlign: 'center' },
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
        playAgainBtnText: { fontSize: 18, fontWeight: '700', color: '#fff', textAlign: 'center' },
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
    [colors, insets.top, insets.bottom, contentWidth]
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
        <View style={styles.scoreWrap}>
          <Text style={styles.score}>{score.toLocaleString()}</Text>
          {isNewBest && (
            <View style={styles.newBestBadge}>
              <Text style={styles.newBestText}>🏆</Text>
              <Text style={styles.newBestText}>{t('game.newBest')}</Text>
            </View>
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
                <ActivityIndicator color="#fff" size="small" />
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
