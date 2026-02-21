/**
 * Challenges screen — current group of 2 challenges, progress, score multiplier.
 */

import React, { useMemo, useRef, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withDelay,
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
  const [celebrating, setCelebrating] = useState(false);
  const [celebrateValue, setCelebrateValue] = useState<number | null>(null);

  const cardScale = useSharedValue(1);
  const multiplierScale = useSharedValue(1);
  const celebrateOpacity = useSharedValue(0);

  const handleClaimReward = () => {
    if (isClaimingRef.current || !rewardAvailable) return;
    isClaimingRef.current = true;
    const newValue = nextMultiplier;
    setCelebrateValue(newValue);
    setCelebrating(true);

    claimReward();

    cardScale.value = withSequence(
      withTiming(1.06, { duration: 200, easing: Easing.out(Easing.cubic) }),
      withDelay(2000, withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) })),
    );

    multiplierScale.value = withSequence(
      withTiming(1.4, { duration: 250, easing: Easing.out(Easing.back(2)) }),
      withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) }),
    );

    celebrateOpacity.value = withSequence(
      withTiming(1, { duration: 250 }),
      withDelay(1800, withTiming(0, { duration: 400 })),
    );

    setTimeout(() => {
      setCelebrating(false);
      setCelebrateValue(null);
      isClaimingRef.current = false;
    }, 2700);
  };

  const challenges = useMemo(
    () => getChallengesForGroup(challengeGroupIndex, challengeShuffleSeed),
    [challengeGroupIndex, challengeShuffleSeed]
  );

  const getProgress = (ch: (typeof challenges)[0]): number => {
    if (CHALLENGE_SCOPE[ch.type] === 'run') {
      const persisted = currentGroupProgress[ch.id];
      if (persisted !== undefined && persisted >= ch.target) {
        return persisted;
      }
      if (!runStartedAfterClaim) return 0;
      if (ch.type === 'coins_run') return coinsThisRun;
      if (ch.type === 'score_run') return score;
      if (ch.type === 'near_miss_run') return nearMissesThisRun;
      return 0;
    }
    const currentValue = getLifetimeValue(ch.type, lifetimeStats);
    const baselineValue = getLifetimeValue(ch.type, challengeGroupBaseline);
    const progress = Math.max(0, currentValue - baselineValue);
    return currentGroupProgress[ch.id] ?? progress;
  };

  const nextMultiplier = challengeGroupIndex < 17 ? scoreMultiplier + 0.5 : 10;

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const multiplierAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: multiplierScale.value }],
  }));

  const celebrateTextStyle = useAnimatedStyle(() => ({
    opacity: celebrateOpacity.value,
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
        multiplierCardCelebrating: {
          borderWidth: 1.5,
          borderColor: colors.primary + '80',
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.5,
          shadowRadius: 16,
          elevation: 8,
        },
        celebrateText: {
          marginTop: spacing.sm,
          alignSelf: 'stretch',
          alignItems: 'center',
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
      }),
    [colors, insets.bottom]
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
        <Animated.View style={cardAnimatedStyle}>
          <Card
            variant="default"
            style={[
              styles.multiplierCard,
              celebrating && styles.multiplierCardCelebrating,
            ]}
          >
            <Text variant="bodySmall" color="muted" style={{ marginBottom: spacing.xs }}>
              {t('challenges.currentMultiplier')}
            </Text>
            <Animated.View style={multiplierAnimatedStyle}>
              <Text variant="h2" color="primary" style={{ fontSize: 32 }}>
                {scoreMultiplier}x
              </Text>
            </Animated.View>
            {celebrating && celebrateValue !== null && (
              <Animated.View style={[styles.celebrateText, celebrateTextStyle]}>
                <Text
                  variant="bodySmall"
                  style={{ color: colors.primary, fontWeight: '700', textAlign: 'center' }}
                >
                  {t('challenges.claimSuccess', { value: celebrateValue })}
                </Text>
              </Animated.View>
            )}
            {!celebrating && challengeGroupIndex <= 17 && !rewardAvailable && (
              <Text variant="bodySmall" color="muted" style={{ marginTop: spacing.sm }}>
                {t('challenges.nextMultiplier', { value: nextMultiplier })}
              </Text>
            )}
            {!celebrating && rewardAvailable && (
              <Animated.View entering={FadeIn.duration(400)} style={{ marginTop: spacing.sm }}>
                <Text
                  variant="bodySmall"
                  style={{ color: colors.success, fontWeight: '700', textAlign: 'center' }}
                >
                  {t('challenges.rewardUnlockMultiplier', { value: nextMultiplier })}
                </Text>
              </Animated.View>
            )}
          </Card>
        </Animated.View>
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
          />
        </Animated.View>
      )}
    </Animated.View>
  );
}
