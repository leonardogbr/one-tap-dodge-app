/**
 * How to Play — Stitch-style layout, respects app theme (light/dark), illustration + 4 rules + Got it.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { PressableScale } from '../components/PressableScale';
import { useTheme } from '../hooks/useTheme';
import { spacing } from '../theme';
import {
  PLAYER_RADIUS,
  OBSTACLE_WIDTH,
  OBSTACLE_HEIGHT,
} from '../engine/constants';
import { SKIN_VISUALS } from '../state/store';

/** Accent for "near-miss" icon; works on both light and dark backgrounds */
const NEAR_MISS_AMBER = '#d97706';

const ILLUSTRATION_HEIGHT = 180;
const INSTRUCTION_ITEMS: {
  key: 'tapToSwap' | 'dodgeObstacles' | 'nearMissBonus' | 'coinsChargeShield';
  icon: string;
  colorKey: 'primary' | 'obstacle' | 'amber' | 'success';
}[] = [
  { key: 'tapToSwap', icon: '👆', colorKey: 'primary' },
  { key: 'dodgeObstacles', icon: '⚠️', colorKey: 'obstacle' },
  { key: 'nearMissBonus', icon: '⚡', colorKey: 'amber' },
  { key: 'coinsChargeShield', icon: '🛡️', colorKey: 'success' },
];

const CLASSIC_SKIN = SKIN_VISUALS.classic;

export function HowToPlayScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'HowToPlay'>>();

  const getIconColor = (colorKey: 'primary' | 'obstacle' | 'amber' | 'success') => {
    if (colorKey === 'primary') return colors.primary;
    if (colorKey === 'obstacle') return colors.obstacle;
    if (colorKey === 'success') return colors.success;
    return NEAR_MISS_AMBER;
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
          paddingTop: insets.top,
        },
        backBtn: {
          position: 'absolute',
          top: insets.top + spacing.sm,
          left: spacing.md,
          zIndex: 10,
          padding: spacing.sm,
        },
        backBtnText: { fontSize: 16, color: colors.primary },
        scroll: { flex: 1 },
        scrollContent: {
          paddingHorizontal: spacing.lg,
          paddingTop: 52,
          paddingBottom: insets.bottom + 100,
          alignItems: 'center',
        },
        title: {
          fontSize: 30,
          fontWeight: '700',
          color: colors.text,
          textAlign: 'center',
          marginBottom: spacing.xs,
        },
        subtitle: {
          fontSize: 17,
          color: colors.textMuted,
          textAlign: 'center',
          marginBottom: spacing.lg,
        },
        illustrationCard: {
          width: '55%',
          alignSelf: 'center',
          height: ILLUSTRATION_HEIGHT,
          borderRadius: 20,
          flexDirection: 'row',
          marginBottom: spacing.lg,
          overflow: 'hidden',
        },
        lane: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.backgroundLight,
        },
        laneLeftBorder: {
          borderRightWidth: 1,
          borderRightColor: colors.primaryDim,
        },
        laneLeft: { justifyContent: 'flex-end', paddingBottom: spacing.xl },
        laneRight: { justifyContent: 'flex-start', paddingTop: spacing.xl },
        playerWrap: {
          width: PLAYER_RADIUS * 2,
          height: PLAYER_RADIUS * 2,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'visible',
        },
        playerBody: {
          width: PLAYER_RADIUS * 2,
          height: PLAYER_RADIUS * 2,
          borderRadius: PLAYER_RADIUS,
          borderWidth: 2,
          overflow: 'hidden',
        },
        playerShadow: {
          position: 'absolute',
          bottom: -6,
          right: -6,
          width: '80%',
          height: '80%',
          borderRadius: 999,
          opacity: 0.5,
        },
        playerHighlight: {
          position: 'absolute',
          top: -6,
          left: -6,
          width: '70%',
          height: '70%',
          borderRadius: 999,
          opacity: 0.7,
        },
        obstacle: {
          backgroundColor: colors.obstacle,
          opacity: 0.95,
          borderRadius: 8,
          width: OBSTACLE_WIDTH,
          height: OBSTACLE_HEIGHT,
        },
        ruleCard: {
          width: '100%',
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.backgroundLight,
          borderRadius: 16,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.md,
          marginBottom: spacing.sm,
        },
        ruleIconCircle: {
          width: 40,
          height: 40,
          borderRadius: 20,
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: spacing.md,
        },
        ruleText: {
          flex: 1,
          fontSize: 19,
          color: colors.text,
          fontWeight: '500',
        },
        gotItBtnWrap: {
          alignSelf: 'stretch',
          marginTop: spacing.lg,
        },
        gotItBtn: {
          width: '100%',
          backgroundColor: colors.primary,
          borderRadius: 20,
          paddingVertical: spacing.lg,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.sm,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.4,
          shadowRadius: 12,
          elevation: 8,
        },
        gotItText: { fontSize: 18, fontWeight: '700', color: colors.onPrimary },
      }),
    [colors, insets.top, insets.bottom]
  );

  return (
    <Animated.View style={styles.container} entering={FadeIn.duration(220)}>
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
      >
        <Text style={styles.backBtnText}>{t('common.back')}</Text>
      </TouchableOpacity>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{t('howToPlay.title')}</Text>
        <Text style={styles.subtitle}>{t('howToPlay.subtitle')}</Text>

        <View style={styles.illustrationCard}>
          <View style={[styles.lane, styles.laneLeftBorder, styles.laneLeft]}>
            <View style={styles.playerWrap}>
              <View
                style={[
                  styles.playerBody,
                  {
                    backgroundColor: CLASSIC_SKIN.base,
                    borderColor: CLASSIC_SKIN.edge ?? colors.text,
                  },
                ]}
              >
                {CLASSIC_SKIN.shadow && (
                  <View style={[styles.playerShadow, { backgroundColor: CLASSIC_SKIN.shadow }]} />
                )}
                {CLASSIC_SKIN.highlight && (
                  <View
                    style={[styles.playerHighlight, { backgroundColor: CLASSIC_SKIN.highlight }]}
                  />
                )}
              </View>
            </View>
          </View>
          <View style={[styles.lane, styles.laneRight]}>
            <View style={styles.obstacle} />
          </View>
        </View>

        {INSTRUCTION_ITEMS.map(({ key, icon, colorKey }) => (
          <View key={key} style={styles.ruleCard}>
            <View style={[styles.ruleIconCircle, { backgroundColor: getIconColor(colorKey) }]}>
              <Text style={{ fontSize: 20 }}>{icon}</Text>
            </View>
            <Text style={styles.ruleText}>{t(`howToPlay.${key}`)}</Text>
          </View>
        ))}

        <View style={styles.gotItBtnWrap}>
          <PressableScale style={styles.gotItBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.gotItText}>{t('howToPlay.gotIt')}</Text>
            <Text style={styles.gotItText}>✓</Text>
          </PressableScale>
        </View>
      </ScrollView>
    </Animated.View>
  );
}
