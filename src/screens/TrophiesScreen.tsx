/**
 * Trophies screen — 46 trophies grouped by tier, matching Stitch design.
 * Uses DS components (Card, Icon, Text, Header) and color tokens.
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useGameStore } from '../state/store';
import { useTheme } from '../hooks/useTheme';
import type { ColorPalette } from '../theme';
import { spacing } from '../theme';
import { Text, Card, Header, Icon } from '../design-system';
import { borderRadius } from '../design-system/tokens';
import { shadows } from '../design-system/tokens/shadows';
import {
  TROPHIES,
  TIER_COLORS,
  type TrophyDef,
  type TrophyTier,
} from '../engine/trophies';

const TOTAL_TROPHIES = TROPHIES.length;
const EARNABLE_COUNT = TOTAL_TROPHIES - 1;

const TIER_ORDER: TrophyTier[] = ['inicio', 'bronze', 'prata', 'ouro', 'elite', 'platina'];

function groupTrophiesByTier(): Record<TrophyTier, TrophyDef[]> {
  const groups: Record<TrophyTier, TrophyDef[]> = {
    inicio: [], bronze: [], prata: [], ouro: [], elite: [], platina: [],
  };
  for (const t of TROPHIES) groups[t.tier].push(t);
  return groups;
}

function TierSeparator({ tier, colors }: { tier: TrophyTier; colors: ColorPalette }) {
  const { t } = useTranslation();
  const tierColor = TIER_COLORS[tier];
  const isPlatina = tier === 'platina';

  return (
    <View style={separatorStyles.wrap}>
      <View style={[separatorStyles.line, { backgroundColor: tierColor + '30' }]} />
      <Text
        variant="caption"
        style={{
          color: tierColor,
          fontWeight: '800',
          fontSize: 10,
          letterSpacing: isPlatina ? 2.5 : 1.8,
          textTransform: 'uppercase',
        }}
      >
        {isPlatina
          ? t('trophies.tier_platina')
          : `Tier: ${t(`trophies.tier_${tier}`)}`}
      </Text>
      <View style={[separatorStyles.line, { backgroundColor: tierColor + '30' }]} />
    </View>
  );
}

const separatorStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  line: { flex: 1, height: 1 },
});

function TrophyCard({
  trophy,
  unlocked,
  isNew,
  colors,
}: {
  trophy: TrophyDef;
  unlocked: boolean;
  isNew: boolean;
  colors: ColorPalette;
}) {
  const { t } = useTranslation();
  const tierColor = TIER_COLORS[trophy.tier];

  return (
    <Card
      variant="elevated"
      padding="md"
      style={[
        trophyCardStyles.card,
        {
          borderWidth: 1,
          borderColor: isNew ? colors.primary + '60' : colors.backgroundLight,
        },
      ]}
    >
      {isNew && (
        <View style={[trophyCardStyles.ribbonWrap]}>
          <View style={[trophyCardStyles.ribbon, { backgroundColor: colors.primary }]}>
            <Text
              variant="caption"
              style={{
                color: colors.background,
                fontWeight: '900',
                fontSize: 7,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
                textAlign: 'center',
              }}
            >
              NEW
            </Text>
          </View>
        </View>
      )}
      <View style={[trophyCardStyles.content, !unlocked && { opacity: 0.45 }]}>
        <View
          style={[
            trophyCardStyles.iconWrap,
            {
              backgroundColor: unlocked ? tierColor + '15' : colors.backgroundLight,
              borderColor: unlocked ? tierColor + '30' : colors.backgroundLight,
            },
          ]}
        >
          <Icon
            name={trophy.icon}
            size={28}
            color={unlocked ? tierColor : colors.textMuted}
          />
        </View>

        <View style={trophyCardStyles.textWrap}>
          <View style={trophyCardStyles.nameRow}>
            <Text
              variant="bodySmall"
              style={{
                fontWeight: '700',
                ...(unlocked ? {} : { color: colors.textMuted }),
                fontSize: 14,
              }}
            >
              {t(trophy.nameKey)}
            </Text>
            <View
              style={[
                trophyCardStyles.tierBadge,
                {
                  backgroundColor: tierColor + '18',
                  borderColor: tierColor + '25',
                },
              ]}
            >
              <Text
                variant="caption"
                style={{
                  color: tierColor,
                  fontWeight: '800',
                  fontSize: 9,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                }}
              >
                {t(`trophies.tier_${trophy.tier}`)}
              </Text>
            </View>
          </View>
          <Text variant="caption" color="muted" style={{ fontSize: 11 }}>
            {t(trophy.descriptionKey)}
          </Text>
        </View>

        <View
          style={[
            trophyCardStyles.statusIcon,
            { backgroundColor: unlocked ? colors.primaryDim : 'transparent' },
          ]}
        >
          <Icon
            name={unlocked ? 'check' : 'lock'}
            size={14}
            color={unlocked ? colors.primary : colors.textMuted}
          />
        </View>
      </View>
    </Card>
  );
}

const trophyCardStyles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
    overflow: 'hidden',
    padding: 0,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  textWrap: { flex: 1, gap: 2 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 2,
  },
  tierBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  statusIcon: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ribbonWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 48,
    height: 48,
    overflow: 'hidden',
    zIndex: 1,
  },
  ribbon: {
    position: 'absolute',
    top: 10,
    left: -16,
    width: 72,
    paddingVertical: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-45deg' }],
  },
});

function PlatinumCardLocked({
  earnedCount,
  colors,
}: {
  earnedCount: number;
  colors: ColorPalette;
}) {
  const { t } = useTranslation();
  const platinum = TROPHIES.find((tr) => tr.id === 'platinum')!;
  const tierColor = TIER_COLORS.platina;
  const progressPct = EARNABLE_COUNT > 0 ? earnedCount / EARNABLE_COUNT : 0;

  return (
    <Card
      variant="elevated"
      padding="md"
      style={[trophyCardStyles.card, { borderWidth: 1, borderColor: colors.backgroundLight, marginBottom: spacing.sm }]}
    >
      <View style={[trophyCardStyles.content, { opacity: 0.45 }]}>
        <View
          style={[
            trophyCardStyles.iconWrap,
            {
              backgroundColor: colors.backgroundLight,
              borderColor: colors.backgroundLight,
            },
          ]}
        >
          <Icon name="workspace_premium" size={28} color={colors.textMuted} />
        </View>

        <View style={trophyCardStyles.textWrap}>
          <View style={trophyCardStyles.nameRow}>
            <Text
              variant="bodySmall"
              style={{ fontWeight: '700', color: colors.textMuted, fontSize: 14 }}
            >
              {t(platinum.nameKey)}
            </Text>
            <View
              style={[
                trophyCardStyles.tierBadge,
                {
                  backgroundColor: tierColor + '18',
                  borderColor: tierColor + '25',
                },
              ]}
            >
              <Text
                variant="caption"
                style={{
                  color: tierColor,
                  fontWeight: '800',
                  fontSize: 9,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                }}
              >
                {t('trophies.tier_platina')}
              </Text>
            </View>
          </View>
          <Text variant="caption" color="muted" style={{ fontSize: 11 }}>
            {t(platinum.descriptionKey)}
          </Text>
        </View>

        <View style={trophyCardStyles.statusIcon}>
          <Icon name="lock" size={14} color={colors.textMuted} />
        </View>
      </View>

      <View style={[platStyles.progressSection, { paddingHorizontal: spacing.md, paddingBottom: spacing.sm }]}>
        <View style={platStyles.progressLabelRow}>
          <Text
            variant="caption"
            color="muted"
            style={{
              fontWeight: '800',
              fontSize: 10,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
            }}
          >
            {t('trophies.journey_progress')}
          </Text>
          <Text
            variant="bodySmall"
            color="primary"
            style={{ fontWeight: '900', fontVariant: ['tabular-nums'] }}
          >
            {earnedCount} / {EARNABLE_COUNT}
          </Text>
        </View>
        <View style={[platStyles.progressBar, { backgroundColor: colors.backgroundLight }]}>
          <View
            style={[
              platStyles.progressFill,
              {
                width: `${progressPct * 100}%`,
                backgroundColor: colors.primary,
                shadowColor: colors.primary,
              },
            ]}
          />
        </View>
      </View>
    </Card>
  );
}

function PlatinumCardUnlocked({
  earnedCount,
  colors,
}: {
  earnedCount: number;
  colors: ColorPalette;
}) {
  const { t } = useTranslation();
  const platinum = TROPHIES.find((tr) => tr.id === 'platinum')!;
  const primaryShadow = shadows.primary(colors.primary);

  return (
    <View
      style={[
        platStyles.card,
        {
          borderColor: colors.primary + '80',
          backgroundColor: colors.primary + '0F',
          ...primaryShadow,
        },
      ]}
    >
      <View style={platStyles.topRow}>
        <View style={platStyles.textCol}>
          <View style={platStyles.badgeWrap}>
            <View
              style={[
                platStyles.badge,
                {
                  backgroundColor: colors.primaryDim,
                  borderColor: colors.primary + '66',
                  shadowColor: colors.primary,
                },
              ]}
            >
              <Text
                variant="caption"
                style={{
                  color: colors.primary,
                  fontWeight: '900',
                  fontSize: 10,
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                }}
              >
                {t('trophies.tier_platina')}
              </Text>
            </View>
          </View>
          <Text variant="h2">
            {t(platinum.nameKey)}
          </Text>
          <Text
            variant="bodySmall"
            color="muted"
            style={{ lineHeight: 20, maxWidth: 200 }}
          >
            {t(platinum.descriptionKey)}
          </Text>
        </View>
        <View
          style={[
            platStyles.iconWrap,
            {
              backgroundColor: colors.primary + '25',
              borderColor: colors.primary + '80',
              shadowColor: colors.primary,
            },
          ]}
        >
          <Icon name="workspace_premium" size={52} color={colors.primary} />
        </View>
      </View>

      <View style={platStyles.progressSection}>
        <View style={platStyles.progressLabelRow}>
          <Text
            variant="caption"
            color="muted"
            style={{
              fontWeight: '800',
              fontSize: 10,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
            }}
          >
            {t('trophies.journey_progress')}
          </Text>
          <Text
            variant="bodySmall"
            color="primary"
            style={{ fontWeight: '900', fontVariant: ['tabular-nums'] }}
          >
            {earnedCount} / {EARNABLE_COUNT}
          </Text>
        </View>
        <View style={[platStyles.progressBar, { backgroundColor: colors.backgroundLight }]}>
          <View
            style={[
              platStyles.progressFill,
              {
                width: '100%',
                backgroundColor: colors.primary,
                shadowColor: colors.primary,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const platStyles = StyleSheet.create({
  card: {
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    padding: spacing.lg,
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  textCol: { flex: 1, gap: spacing.sm },
  badgeWrap: { flexDirection: 'row' },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 4,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '6deg' }],
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 8,
  },
  progressSection: { marginTop: spacing.md, gap: spacing.sm },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressBar: {
    height: 8,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.full,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 4,
  },
});

export function TrophiesScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'Trophies'>>();
  const earnedTrophies = useGameStore((s) => s.earnedTrophies);
  const seenTrophyIds = useGameStore((s) => s.seenTrophyIds);
  const markTrophiesSeen = useGameStore((s) => s.markTrophiesSeen);
  const earnedCount = earnedTrophies.length;
  const groups = useMemo(() => groupTrophiesByTier(), []);

  const seenAtOpenRef = useRef<Set<string> | null>(null);
  if (seenAtOpenRef.current === null) {
    seenAtOpenRef.current = new Set(seenTrophyIds);
  }
  const newTrophyIds = useMemo(
    () => earnedTrophies.filter((id) => !seenAtOpenRef.current!.has(id)),
    [earnedTrophies],
  );

  useEffect(() => {
    markTrophiesSeen();
  }, [earnedCount]);

  const earnedCountWithoutPlatinum = earnedTrophies.filter(
    (id) => id !== 'platinum',
  ).length;
  const progressPct = TOTAL_TROPHIES > 0 ? earnedCount / TOTAL_TROPHIES : 0;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        scroll: { flex: 1 },
        scrollContent: {
          paddingHorizontal: spacing.md,
          paddingBottom: insets.bottom + spacing.xl,
        },
        progressTopRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        },
        progressTextCol: { gap: spacing.xs },
        progressIconWrap: {
          width: 56,
          height: 56,
          borderRadius: borderRadius.full,
          backgroundColor: colors.primaryDim,
          borderWidth: 1,
          borderColor: colors.primary + '30',
          alignItems: 'center',
          justifyContent: 'center',
        },
        progressBar: {
          height: 10,
          backgroundColor: colors.backgroundLight,
          borderRadius: borderRadius.full,
          overflow: 'hidden',
        },
        progressFill: {
          height: '100%',
          backgroundColor: colors.primary,
          borderRadius: borderRadius.full,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 12,
          elevation: 4,
        },
      }),
    [colors, insets.bottom],
  );

  return (
    <Animated.View style={styles.container} entering={FadeIn.duration(220)}>
      <Header
        title={t('trophies.title')}
        onBack={() => navigation.goBack()}
        backLabel={t('common.back')}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card
          variant="highlighted"
          style={{ marginTop: spacing.md, marginBottom: spacing.sm, gap: spacing.md }}
        >
          <View style={styles.progressTopRow}>
            <View style={styles.progressTextCol}>
              <Text
                variant="h2"
                color="primary"
                style={{ fontSize: 28 }}
              >
                {earnedCount}/{TOTAL_TROPHIES}
              </Text>
              <Text
                variant="caption"
                color="muted"
                style={{
                  fontWeight: '600',
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                }}
              >
                {t('trophies.unlocked')}
              </Text>
            </View>
            <View style={styles.progressIconWrap}>
              <Icon name="emoji_events" size={28} color={colors.primary} />
            </View>
          </View>

          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${progressPct * 100}%` },
              ]}
            />
          </View>

          <Text variant="caption" color="muted" style={{ lineHeight: 18 }}>
            {t('trophies.motivational')}
          </Text>
        </Card>

        {TIER_ORDER.filter((tier) => tier !== 'platina').map((tier) => {
          const trophiesInTier = groups[tier];
          if (trophiesInTier.length === 0) return null;
          return (
            <View key={tier}>
              <TierSeparator tier={tier} colors={colors} />
              {trophiesInTier.map((trophy) => (
                <TrophyCard
                  key={trophy.id}
                  trophy={trophy}
                  unlocked={earnedTrophies.includes(trophy.id)}
                  isNew={newTrophyIds.includes(trophy.id)}
                  colors={colors}
                />
              ))}
            </View>
          );
        })}

        <TierSeparator tier="platina" colors={colors} />
        {earnedTrophies.includes('platinum') ? (
          <PlatinumCardUnlocked
            earnedCount={earnedCountWithoutPlatinum}
            colors={colors}
          />
        ) : (
          <PlatinumCardLocked
            earnedCount={earnedCountWithoutPlatinum}
            colors={colors}
          />
        )}
      </ScrollView>
    </Animated.View>
  );
}
