/**
 * Home / Main menu — title (two lines), score cards, player skin preview, Play, Skins / Guide / Settings.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { PressableScale } from '../components/PressableScale';
import { useTheme } from '../hooks/useTheme';
import { usePulseAnimation } from '../hooks/usePulseAnimation';
import { useGameStore, SKIN_VISUALS, PRIME_SKIN_ID } from '../state/store';
import { spacing } from '../theme';

const PLAYER_PREVIEW_SIZE = 80;

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Home'>>();
  const highScore = useGameStore((s) => s.highScore);
  const lastScore = useGameStore((s) => s.lastScore);
  const skinVisual = SKIN_VISUALS[PRIME_SKIN_ID] ?? SKIN_VISUALS.classic;
  const pulseAnimatedStyle = usePulseAnimation(!!skinVisual.pulse);

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
        titleOneTap: { fontSize: 28, fontWeight: '800', color: colors.text },
        titleDodge: { fontSize: 28, fontWeight: '800', color: colors.primary },
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
          backgroundColor: colors.backgroundLight,
          borderRadius: 16,
          padding: spacing.md,
          alignItems: 'center',
          minWidth: 0,
        },
        scoreCardBest: {
          flex: 1,
          backgroundColor: colors.backgroundCard,
          borderRadius: 16,
          padding: spacing.md,
          alignItems: 'center',
          minWidth: 0,
          borderWidth: 1,
          borderColor: colors.primaryDim,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 8,
          elevation: 6,
        },
        scoreValueBest: {
          fontSize: 28,
          fontWeight: '800',
          color: colors.primary,
          marginBottom: spacing.xs,
          textShadowColor: colors.primary,
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: 4,
        },
        scoreValueLast: {
          fontSize: 28,
          fontWeight: '800',
          color: colors.textMuted,
          marginBottom: spacing.xs,
        },
        scoreLabel: { fontSize: 12, color: colors.textMuted, flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
        scoreLabelText: { fontSize: 12, color: colors.textMuted },
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
        playBtnWrapper: { width: '100%', marginBottom: spacing.xl },
        playBtn: {
          width: '100%',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.sm,
          backgroundColor: colors.primary,
          paddingVertical: spacing.lg,
          paddingHorizontal: spacing.xl * 2,
          borderRadius: 999,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.4,
          shadowRadius: 12,
          elevation: 8,
        },
        playBtnText: { fontSize: 20, fontWeight: '700', color: colors.background },
        navRow: {
          flexDirection: 'row',
          justifyContent: 'center',
          gap: spacing.lg / 2,
          marginBottom: spacing.xl,
        },
        navBtn: {
          width: 100,
          backgroundColor: colors.backgroundLight,
          borderRadius: 16,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.sm,
          alignItems: 'center',
          justifyContent: 'center',
        },
        navIcon: { fontSize: 28, marginBottom: spacing.xs },
        navLabel: { fontSize: 14, fontWeight: '600', color: colors.primary },
      }),
    [colors, insets.top, insets.bottom]
  );

  return (
    <Animated.View style={styles.container} entering={FadeIn.duration(220)}>
      <View style={styles.top}>
        <View style={styles.titleBlock}>
          <Text style={styles.titleOneTap}>{t('home.titleOneTap')}</Text>
          <Text style={styles.titleDodge}>{t('home.titleDodge')}</Text>
        </View>

        <View style={styles.scoreRow}>
          <View style={styles.scoreCardBest}>
            <Text style={styles.scoreValueBest}>{highScore}</Text>
            <View style={styles.scoreLabel}>
              <Text style={styles.scoreLabelText}>🏆</Text>
              <Text style={styles.scoreLabelText}>{t('home.bestScore')}</Text>
            </View>
          </View>
          <View style={styles.scoreCard}>
            <Text style={styles.scoreValueLast}>{lastScore}</Text>
            <View style={styles.scoreLabel}>
              <Text style={styles.scoreLabelText}>↻</Text>
              <Text style={styles.scoreLabelText}>{t('home.lastScore')}</Text>
            </View>
          </View>
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
          <PressableScale style={styles.playBtn} onPress={() => navigation.navigate('Game')}>
            <Text style={styles.playBtnText}>{t('common.play')}</Text>
            <Text style={styles.playBtnText}>▶</Text>
          </PressableScale>
        </View>
      </View>

      <View style={styles.navRow}>
        <PressableScale style={styles.navBtn} onPress={() => navigation.navigate('Skins')}>
          <Text style={styles.navIcon}>👤</Text>
          <Text style={styles.navLabel}>{t('home.skins')}</Text>
        </PressableScale>
        <PressableScale style={styles.navBtn} onPress={() => navigation.navigate('HowToPlay')}>
          <Text style={styles.navIcon}>🎮</Text>
          <Text style={styles.navLabel}>{t('home.guide')}</Text>
        </PressableScale>
        <PressableScale style={styles.navBtn} onPress={() => navigation.navigate('Settings')}>
          <Text style={styles.navIcon}>⚙</Text>
          <Text style={styles.navLabel}>{t('common.settings')}</Text>
        </PressableScale>
      </View>
    </Animated.View>
  );
}
