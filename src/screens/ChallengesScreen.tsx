/**
 * Challenges screen — current group of 2 challenges, progress, score multiplier.
 */

import React, { useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useGameStore } from '../state/store';
import { getChallengesForGroup, CHALLENGE_SCOPE, getLifetimeValue } from '../engine/challenges';
import { PressableScale } from '../components/PressableScale';
import { useTheme } from '../hooks/useTheme';
import { spacing } from '../theme';

export function ChallengesScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Challenges'>>();

  const scoreMultiplier = useGameStore((s) => s.scoreMultiplier);
  const challengeGroupIndex = useGameStore((s) => s.challengeGroupIndex);
  const coinsThisRun = useGameStore((s) => s.coinsThisRun);
  const score = useGameStore((s) => s.score);
  const nearMissesThisRun = useGameStore((s) => s.nearMissesThisRun);
  const lifetimeStats = useGameStore((s) => s.lifetimeStats);
  const rewardAvailable = useGameStore((s) => s.rewardAvailable);
  const currentGroupProgress = useGameStore((s) => s.currentGroupProgress);
  const challengeGroupBaseline = useGameStore((s) => s.challengeGroupBaseline);
  const runStartedAfterClaim = useGameStore((s) => s.runStartedAfterClaim);
  const claimReward = useGameStore((s) => s.claimReward);
  const isClaimingRef = useRef(false);

  const handleClaimReward = () => {
    if (isClaimingRef.current || !rewardAvailable) return;
    isClaimingRef.current = true;
    try {
      claimReward();
    } finally {
      setTimeout(() => {
        isClaimingRef.current = false;
      }, 500);
    }
  };

  const challenges = useMemo(
    () => getChallengesForGroup(challengeGroupIndex),
    [challengeGroupIndex]
  );

  const getProgress = (ch: (typeof challenges)[0]): number => {
    if (CHALLENGE_SCOPE[ch.type] === 'run') {
      const persisted = currentGroupProgress[ch.id];
      // If challenge was already completed (persisted), always show that (survives app restart)
      if (persisted !== undefined && persisted >= ch.target) {
        return persisted;
      }
      // For in-progress run challenges, only count after user has started a new game (after claim)
      if (!runStartedAfterClaim) return 0;
      if (ch.type === 'coins_run') return coinsThisRun;
      if (ch.type === 'score_run') return score;
      if (ch.type === 'near_miss_run') return nearMissesThisRun;
      return 0;
    }
    // For cumulative challenges, calculate progress as difference from baseline
    // This ensures each group starts counting from 0
    const currentValue = getLifetimeValue(ch.type, lifetimeStats);
    const baselineValue = getLifetimeValue(ch.type, challengeGroupBaseline);
    const progress = Math.max(0, currentValue - baselineValue);
    // Use persisted progress if available (for completed challenges), otherwise use calculated progress
    return currentGroupProgress[ch.id] ?? progress;
  };

  const nextMultiplier = challengeGroupIndex < 17 ? scoreMultiplier + 0.5 : 10;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
          paddingTop: insets.top,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: colors.backgroundLight,
        },
        backBtn: { paddingVertical: spacing.sm, paddingRight: spacing.md },
        backBtnText: { fontSize: 16, color: colors.primary },
        title: { fontSize: 20, fontWeight: '700', color: colors.text },
        scroll: { flex: 1 },
        scrollContent: { padding: spacing.lg },
        multiplierCard: {
          backgroundColor: colors.backgroundLight,
          borderRadius: 12,
          padding: spacing.lg,
          marginBottom: spacing.xl,
          alignItems: 'center',
        },
        multiplierLabel: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.xs },
        multiplierValue: { fontSize: 28, fontWeight: '700', color: colors.primary },
        multiplierNext: { fontSize: 14, color: colors.textMuted, marginTop: spacing.sm },
        rewardBanner: {
          backgroundColor: colors.primary,
          borderRadius: 12,
          padding: spacing.lg,
          marginBottom: spacing.lg,
          alignItems: 'center',
        },
        rewardBannerText: {
          fontSize: 16,
          fontWeight: '700',
          color: colors.onPrimary,
          marginBottom: spacing.md,
        },
        claimBtn: {
          backgroundColor: '#ffffff',
          borderRadius: 8,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.xl,
          minWidth: 200,
          alignItems: 'center',
        },
        claimBtnText: {
          fontSize: 16,
          fontWeight: '700',
          color: '#000',
        },
        challengeCard: {
          backgroundColor: colors.backgroundLight,
          borderRadius: 12,
          padding: spacing.lg,
          marginBottom: spacing.md,
        },
        challengeDesc: { fontSize: 16, color: colors.text, marginBottom: spacing.sm },
        progressBar: {
          height: 8,
          backgroundColor: colors.background,
          borderRadius: 4,
          overflow: 'hidden',
        },
        progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 4 },
        progressText: { fontSize: 12, color: colors.textMuted, marginTop: spacing.xs },
      }),
    [colors, insets.top]
  );

  return (
    <Animated.View style={styles.container} entering={FadeIn.duration(220)}>
      <View style={styles.header}>
        <PressableScale style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>{t('common.back')}</Text>
        </PressableScale>
        <Text style={styles.title}>{t('challenges.title')}</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.multiplierCard}>
          <Text style={styles.multiplierLabel}>{t('challenges.currentMultiplier')}</Text>
          <Text style={styles.multiplierValue}>{scoreMultiplier}x</Text>
          {challengeGroupIndex <= 17 && (
            <Text style={styles.multiplierNext}>
              {t('challenges.nextMultiplier', { value: nextMultiplier })}
            </Text>
          )}
        </View>
        {rewardAvailable && (
          <View style={styles.rewardBanner}>
            <Text style={styles.rewardBannerText}>{t('challenges.rewardAvailable')}</Text>
            <PressableScale style={styles.claimBtn} onPress={handleClaimReward}>
              <Text style={styles.claimBtnText}>{t('challenges.claimReward')}</Text>
            </PressableScale>
          </View>
        )}
        {challenges.map((ch) => {
          const current = getProgress(ch);
          const pct = ch.target > 0 ? Math.min(1, current / ch.target) : 0;
          return (
            <View key={ch.id} style={styles.challengeCard}>
              <Text style={styles.challengeDesc}>
                {t(ch.descriptionKey, { count: ch.target })}
              </Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${pct * 100}%` }]} />
              </View>
              <Text style={styles.progressText}>
                {current} / {ch.target}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </Animated.View>
  );
}
