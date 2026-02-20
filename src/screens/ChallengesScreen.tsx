/**
 * Challenges screen — current group of 2 challenges, progress, score multiplier.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useGameStore } from '../state/store';
import { getChallengesForGroup, CHALLENGE_SCOPE, getLifetimeValue } from '../engine/challenges';
import { useTheme } from '../hooks/useTheme';
import { spacing } from '../theme';
import { Text, Card, Header, Button, Icon } from '../design-system';
import { borderRadius } from '../design-system/tokens';

export function ChallengesScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Challenges'>>();

  const scoreMultiplier = useGameStore((s) => s.scoreMultiplier);
  const challengeGroupIndex = useGameStore((s) => s.challengeGroupIndex);
  const challengeShuffleSeed = useGameStore((s) => s.challengeShuffleSeed);
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
  const [claimSuccessValue, setClaimSuccessValue] = useState<number | null>(null);

  const handleClaimReward = () => {
    if (isClaimingRef.current || !rewardAvailable) return;
    isClaimingRef.current = true;
    setClaimSuccessValue(nextMultiplier);
    claimReward();
    setTimeout(() => {
      setClaimSuccessValue(null);
      isClaimingRef.current = false;
    }, 1400);
  };

  const challenges = useMemo(
    () => getChallengesForGroup(challengeGroupIndex, challengeShuffleSeed),
    [challengeGroupIndex, challengeShuffleSeed]
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

  const rewardBadgeScale = useSharedValue(1);
  useEffect(() => {
    if (rewardAvailable) {
      rewardBadgeScale.value = withRepeat(
        withSequence(
          withTiming(1.04, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    } else {
      rewardBadgeScale.value = withTiming(1, { duration: 200 });
    }
  }, [rewardAvailable, rewardBadgeScale]);

  const rewardBadgeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: rewardBadgeScale.value }],
  }));

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
        rewardBadge: {
          marginTop: spacing.md,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.md,
          backgroundColor: colors.success + '25',
          borderRadius: borderRadius.sm,
          borderWidth: 1.5,
          borderColor: colors.success + '70',
          alignSelf: 'stretch',
          alignItems: 'center',
          shadowColor: colors.success,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.4,
          shadowRadius: 8,
          elevation: 4,
        },
        fixedCtaWrap: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: spacing.lg,
          paddingBottom: insets.bottom + spacing.lg,
          paddingTop: spacing.md,
          backgroundColor: colors.background,
        },
        challengeCard: {
          marginBottom: spacing.md,
        },
        challengeCardCompleted: {
          borderWidth: 1.5,
          borderColor: colors.success + '60',
          backgroundColor: colors.success + '0C',
        },
        challengeHeaderRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: spacing.sm,
        },
        progressBar: {
          height: 8,
          backgroundColor: colors.background,
          borderRadius: borderRadius.xs,
          overflow: 'hidden',
        },
        progressFill: { height: '100%', backgroundColor: colors.secondary, borderRadius: borderRadius.xs },
        progressFillComplete: { backgroundColor: colors.success },
        claimSuccessOverlay: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 100,
        },
        claimSuccessCard: {
          backgroundColor: colors.success,
          paddingHorizontal: spacing.xl * 2,
          paddingVertical: spacing.lg,
          borderRadius: borderRadius.lg,
          alignItems: 'center',
          shadowColor: colors.success,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.5,
          shadowRadius: 12,
          elevation: 12,
        },
      }),
    [colors, insets.top, insets.bottom]
  );

  return (
    <Animated.View style={styles.container} entering={FadeIn.duration(220)}>
      <Header
        title={t('challenges.title')}
        onBack={() => navigation.goBack()}
        backLabel={t('common.back')}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          rewardAvailable && { paddingBottom: 100 },
        ]}
      >
        <Card variant="default" style={styles.multiplierCard}>
          <Text variant="bodySmall" color="muted" style={{ marginBottom: spacing.xs }}>
            {t('challenges.currentMultiplier')}
          </Text>
          <Text variant="h2" color="primary">{scoreMultiplier}x</Text>
          {challengeGroupIndex <= 17 && !rewardAvailable && (
            <Text variant="bodySmall" color="muted" style={{ marginTop: spacing.sm }}>
              {t('challenges.nextMultiplier', { value: nextMultiplier })}
            </Text>
          )}
          {rewardAvailable && (
            <Animated.View entering={FadeIn.duration(500)} exiting={FadeOut.duration(280)}>
              <Animated.View style={[styles.rewardBadge, rewardBadgeAnimatedStyle]}>
                <Text variant="bodySmall" style={{ color: colors.success, fontWeight: '700', textAlign: 'center' }}>
                  🎉 {t('challenges.rewardUnlockMultiplier', { value: nextMultiplier })}
                </Text>
              </Animated.View>
            </Animated.View>
          )}
        </Card>
        {challenges.map((ch) => {
          const current = getProgress(ch);
          const pct = ch.target > 0 ? Math.min(1, current / ch.target) : 0;
          const isComplete = pct >= 1;
          return (
            <Card
              key={ch.id}
              variant="default"
              style={[styles.challengeCard, isComplete && styles.challengeCardCompleted]}
            >
              <View style={styles.challengeHeaderRow}>
                <Text variant="body" style={{ flex: 1 }}>
                  {t(ch.descriptionKey, { count: ch.target })}
                </Text>
                {isComplete && (
                  <Icon name="check_circle" size={22} color={colors.success} />
                )}
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    isComplete && styles.progressFillComplete,
                    { width: `${pct * 100}%` },
                  ]}
                />
              </View>
              <Text variant="caption" color="muted" style={{ marginTop: spacing.xs }}>
                {current} / {ch.target}
              </Text>
            </Card>
          );
        })}
      </ScrollView>
      {rewardAvailable && (
        <Animated.View
          style={styles.fixedCtaWrap}
          entering={FadeIn.duration(400).delay(150)}
          exiting={FadeOut.duration(280)}
        >
          <Button
            title={t('challenges.claimReward')}
            onPress={handleClaimReward}
            variant="primary"
            size="large"
            fullWidth
            icon="target"
            iconCommunity
          />
        </Animated.View>
      )}
      {claimSuccessValue !== null && (
        <Animated.View
          style={styles.claimSuccessOverlay}
          pointerEvents="none"
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(400)}
        >
          <View style={styles.claimSuccessCard}>
            <Text variant="h2" style={{ color: colors.onPrimary }}>
              🎉 {t('challenges.claimSuccess', { value: claimSuccessValue })}
            </Text>
          </View>
        </Animated.View>
      )}
    </Animated.View>
  );
}
