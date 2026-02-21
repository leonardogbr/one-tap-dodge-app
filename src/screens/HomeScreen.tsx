/**
 * Home / Main menu — title (two lines), score cards, player skin preview, Play, Skins / Guide / Settings.
 */

import React, { useMemo, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { PressableScale } from '../components/PressableScale';
import { RewardBadge } from '../components/RewardBadge';
import { useTheme } from '../hooks/useTheme';
import { usePulseAnimation } from '../hooks/usePulseAnimation';
import { useInterstitialBeforeGame } from '../hooks/useInterstitialBeforeGame';
import { useGameStore, SKIN_VISUALS, PRIME_SKIN_ID } from '../state/store';
import { spacing } from '../theme';
import { Text, Card, Button, Icon } from '../design-system';
import { borderRadius, shadows } from '../design-system/tokens';

const PLAYER_PREVIEW_SIZE = 80;

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Home'>>();
  const highScore = useGameStore((s) => s.highScore);
  const lastScore = useGameStore((s) => s.lastScore);
  const rewardAvailable = useGameStore((s) => s.rewardAvailable);
  const hasNewTrophies = useGameStore(
    (s) => s.earnedTrophies.some((id) => !s.seenTrophyIds.includes(id)),
  );
  const skinVisual = SKIN_VISUALS[PRIME_SKIN_ID] ?? SKIN_VISUALS.classic;
  const pulseAnimatedStyle = usePulseAnimation(!!skinVisual.pulse);
  const isNavigatingRef = useRef(false);
  const maybeShowInterstitialThenProceed = useInterstitialBeforeGame();

  const handlePlay = () => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    maybeShowInterstitialThenProceed(() => {
      navigation.navigate('Game');
    }).finally(() => {
      setTimeout(() => {
        isNavigatingRef.current = false;
      }, 1000);
    });
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
          paddingHorizontal: spacing.xl,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        top: { alignItems: 'center', alignSelf: 'stretch' },
        titleBlock: { alignItems: 'center', marginBottom: spacing.lg },
        scoreRow: {
          flexDirection: 'row',
          justifyContent: 'center',
          gap: spacing.md,
          marginBottom: spacing.xl + spacing.md,
          width: '100%',
          maxWidth: 320,
        },
        scoreCard: {
          flex: 1,
          alignItems: 'center',
          minWidth: 0,
        },
        scoreCardBest: {
          flex: 1,
          alignItems: 'center',
          minWidth: 0,
        },
        scoreValueBest: {
          marginBottom: spacing.xs,
          textShadowColor: colors.primary,
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: 2,
        },
        scoreValueLast: {
          marginBottom: spacing.xs,
        },
        scoreLabel: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
        playerPreviewWrap: {
          width: PLAYER_PREVIEW_SIZE,
          height: PLAYER_PREVIEW_SIZE,
          marginBottom: spacing.xl + spacing.md,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'visible',
        },
        playerPreviewPulse: {
          position: 'absolute',
          width: PLAYER_PREVIEW_SIZE,
          height: PLAYER_PREVIEW_SIZE,
          borderRadius: PLAYER_PREVIEW_SIZE / 2,
        },
        playerPreviewBody: {
          position: 'absolute',
          width: PLAYER_PREVIEW_SIZE,
          height: PLAYER_PREVIEW_SIZE,
          borderRadius: PLAYER_PREVIEW_SIZE / 2,
          borderWidth: 2,
          overflow: 'hidden',
        },
        playerPreviewHighlight: {
          position: 'absolute',
          top: -6,
          left: -6,
          width: '70%',
          height: '70%',
          borderRadius: 999,
          opacity: 0.7,
        },
        playerPreviewShadow: {
          position: 'absolute',
          bottom: -6,
          right: -6,
          width: '80%',
          height: '80%',
          borderRadius: 999,
          opacity: 0.5,
        },
        playerPreviewRing: {
          position: 'absolute',
          top: 2,
          left: 2,
          right: 2,
          bottom: 2,
          borderRadius: 999,
          borderWidth: 1,
          opacity: 0.9,
        },
        playBtnWrapper: { width: '100%', marginBottom: spacing.md },
        challengesBtnWrapper: {
          width: '100%',
          marginBottom: spacing.xl,
          position: 'relative',
        },
        challengesSection: {
          width: '100%',
          // alignItems: 'center',
          gap: spacing.xs,
        },
        rewardHintText: {
          fontSize: 12,
          fontWeight: '600',
          color: colors.coin,
        },
        challengesBtnRewardGlow: {
          borderWidth: 2,
          borderColor: colors.coin,
          shadowColor: colors.coin,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.7,
          shadowRadius: 12,
          elevation: 8,
        },
        navRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignSelf: 'stretch',
          gap: spacing.sm,
          marginBottom: spacing.xl,
        },
        navBtn: {
          minWidth: 80,
          backgroundColor: colors.backgroundLight,
          borderRadius: borderRadius.lg,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.sm,
          alignItems: 'center',
          justifyContent: 'center',
        },
        navIcon: { fontSize: 28, marginBottom: spacing.xs },
      }),
    [colors, insets.top, insets.bottom]
  );

  return (
    <Animated.View style={styles.container} entering={FadeIn.duration(220)}>
      <View style={styles.top}>
        <View style={styles.titleBlock}>
          <Text variant="h2">{t('home.titleOneTap')}</Text>
          <Text variant="h2" color="primary">{t('home.titleDodge')}</Text>
        </View>

        <View style={styles.scoreRow}>
          <Card variant="highlighted" style={styles.scoreCardBest}>
            <Text variant="h2" color="primary" style={styles.scoreValueBest}>{highScore}</Text>
            <View style={styles.scoreLabel}>
              <Text variant="caption" color="muted">🏆</Text>
              <Text variant="caption" color="muted">{t('home.bestScore')}</Text>
            </View>
          </Card>
          <Card variant="default" style={styles.scoreCard}>
            <Text variant="h2" color="muted" style={styles.scoreValueLast}>{lastScore > 0 ? lastScore : '-'}</Text>
            <View style={styles.scoreLabel}>
              <Icon name="history" size={14} color={colors.textMuted} />
              <Text variant="caption" color="muted">{t('home.lastScore')}</Text>
            </View>
          </Card>
        </View>

        <View style={styles.playerPreviewWrap}>
          {skinVisual.pulse && (
            <Animated.View
              style={[
                styles.playerPreviewPulse,
                {
                  backgroundColor: isDark
                    ? (skinVisual.edge ?? skinVisual.base)
                    : colors.primary,
                },
                pulseAnimatedStyle,
              ]}
            />
          )}
          <View
            style={[
              styles.playerPreviewBody,
              {
                backgroundColor: skinVisual.base,
                borderColor: skinVisual.edge ?? colors.text,
              }]}
          >
            {skinVisual.shadow && (
              <View style={[styles.playerPreviewShadow, { backgroundColor: skinVisual.shadow }]} />
            )}
            {skinVisual.highlight && (
              <View
                style={[styles.playerPreviewHighlight, { backgroundColor: skinVisual.highlight }]}
              />
            )}
            {skinVisual.edge && (
              <View style={[styles.playerPreviewRing, { borderColor: skinVisual.edge }]} />
            )}
          </View>
        </View>

        <View style={styles.playBtnWrapper}>
          <Button
            title={t('common.play')}
            onPress={handlePlay}
            variant="primary"
            size="large"
            icon="play_arrow"
            fullWidth
          />
        </View>
        <View style={styles.challengesSection}>
          {rewardAvailable && (
            <Text style={styles.rewardHintText}>{t('home.rewardBanner')}</Text>
          )}
          <View style={styles.challengesBtnWrapper}>
            <RewardBadge visible={!!rewardAvailable} />
            <Button
              title={t('challenges.title')}
              onPress={() => navigation.navigate('Challenges')}
              variant="secondary"
              size="medium"
              icon="target"
              fullWidth
              style={rewardAvailable ? styles.challengesBtnRewardGlow : undefined}
            />
          </View>
        </View>
      </View>

      <View style={styles.navRow}>
        <PressableScale style={styles.navBtn} onPress={() => navigation.navigate('HowToPlay')}>
          <Icon name="help_outline" size={28} color={colors.text} style={styles.navIcon} />
        </PressableScale>
        <PressableScale style={styles.navBtn} onPress={() => navigation.navigate('Skins')}>
          <Icon name="checkroom" size={28} color={colors.text} style={styles.navIcon} />
        </PressableScale>
        <PressableScale style={styles.navBtn} onPress={() => navigation.navigate('Trophies')}>
          <RewardBadge visible={hasNewTrophies} />
          <Icon name="emoji_events" size={28} color={colors.text} style={styles.navIcon} />
        </PressableScale>
        <PressableScale style={styles.navBtn} onPress={() => navigation.navigate('Settings')}>
          <Icon name="settings" size={28} color={colors.text} style={styles.navIcon} />
        </PressableScale>
      </View>
    </Animated.View>
  );
}
