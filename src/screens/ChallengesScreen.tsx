/**
 * Challenges screen — current group of 2 challenges, progress, score multiplier.
 */

import React, { useMemo, useRef } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useGameStore } from '../state/store';
import { getChallengesForGroup, CHALLENGE_SCOPE, getLifetimeValue } from '../engine/challenges';
import { useTheme } from '../hooks/useTheme';
import { spacing } from '../theme';
import { Text, Card, Header, Button } from '../design-system';
import { borderRadius } from '../design-system/tokens';

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
        },
        scroll: { flex: 1 },
        scrollContent: { padding: spacing.lg },
        multiplierCard: {
          marginBottom: spacing.xl,
          alignItems: 'center',
        },
        rewardBanner: {
          backgroundColor: colors.primary,
          borderRadius: borderRadius.md,
          padding: spacing.lg,
          marginBottom: spacing.lg,
          alignItems: 'center',
        },
        challengeCard: {
          marginBottom: spacing.md,
        },
        progressBar: {
          height: 8,
          backgroundColor: colors.background,
          borderRadius: borderRadius.xs,
          overflow: 'hidden',
        },
        progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: borderRadius.xs },
      }),
    [colors, insets.top]
  );

  return (
    <Animated.View style={styles.container} entering={FadeIn.duration(220)}>
      <Header
        title={t('challenges.title')}
        onBack={() => navigation.goBack()}
        backLabel={t('common.back')}
      />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Card variant="default" style={styles.multiplierCard}>
          <Text variant="bodySmall" color="muted" style={{ marginBottom: spacing.xs }}>
            {t('challenges.currentMultiplier')}
          </Text>
          <Text variant="h2" color="primary">{scoreMultiplier}x</Text>
          {challengeGroupIndex <= 17 && (
            <Text variant="bodySmall" color="muted" style={{ marginTop: spacing.sm }}>
              {t('challenges.nextMultiplier', { value: nextMultiplier })}
            </Text>
          )}
        </Card>
        {rewardAvailable && (
          <View style={styles.rewardBanner}>
            <Text variant="button" style={{ color: colors.onPrimary, marginBottom: spacing.md }}>
              {t('challenges.rewardAvailable')}
            </Text>
            <Button
              title={t('challenges.claimReward')}
              onPress={handleClaimReward}
              variant="ghost"
              size="medium"
              style={{ backgroundColor: '#ffffff', minWidth: 200 }}
            />
          </View>
        )}
        {challenges.map((ch) => {
          const current = getProgress(ch);
          const pct = ch.target > 0 ? Math.min(1, current / ch.target) : 0;
          return (
            <Card key={ch.id} variant="default" style={styles.challengeCard}>
              <Text variant="body" style={{ marginBottom: spacing.sm }}>
                {t(ch.descriptionKey, { count: ch.target })}
              </Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${pct * 100}%` }]} />
              </View>
              <Text variant="caption" color="muted" style={{ marginTop: spacing.xs }}>
                {current} / {ch.target}
              </Text>
            </Card>
          );
        })}
      </ScrollView>
    </Animated.View>
  );
}
