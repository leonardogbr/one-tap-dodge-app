/**
 * Skins screen — unlock/equip by ID, different colors per skin. Phase 4: theme, i18n, safe area.
 */

import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useGameStore, SKIN_IDS, SKIN_COSTS, SKIN_VISUALS, type SkinVisual } from '../state/store';
import { useTheme } from '../hooks/useTheme';
import { usePulseAnimation } from '../hooks/usePulseAnimation';
import { spacing } from '../theme';
import { Text, Header, Card, Button } from '../design-system';
import { Icon } from '../design-system/components/Icon';
import { borderRadius } from '../design-system/tokens';

export function SkinsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Skins'>>();
  const totalCoins = useGameStore((s) => s.totalCoins);
  const unlockedSkins = useGameStore((s) => s.unlockedSkins);
  const equippedSkinId = useGameStore((s) => s.equippedSkinId);
  const equipSkin = useGameStore((s) => s.equipSkin);
  const unlockSkin = useGameStore((s) => s.unlockSkin);

  const handleEquip = (skinId: string) => {
    if (unlockedSkins.includes(skinId)) equipSkin(skinId);
  };

  const handleUnlock = (skinId: string) => {
    const cost = SKIN_COSTS[skinId] ?? 0;
    if (cost === 0) {
      unlockSkin(skinId);
      return;
    }
    if (totalCoins >= cost) {
      unlockSkin(skinId);
      useGameStore.getState().addTotalCoins(-cost);
    }
  };

  const SkinPreviewCircle = ({ skin, equipped }: { skin: SkinVisual; equipped: boolean }) => {
    const { colors, isDark } = useTheme();
    const pulseStyle = usePulseAnimation(!!skin.pulse);

    return (
      <View style={styles.skinCircleWrap}>
        {skin.pulse && (
          <Animated.View
            style={[
              styles.skinPulse,
              {
                backgroundColor: isDark ? (skin.edge ?? skin.base) : colors.primary,
              },
              pulseStyle,
            ]}
          />
        )}
        <View
          style={[
            styles.skinCircle,
            { backgroundColor: skin.base },
            equipped && styles.skinCircleEquipped,
          ]}
        >
          {skin.shadow && (
            <View style={[styles.skinShadow, { backgroundColor: skin.shadow }]} />
          )}
          {skin.highlight && (
            <View style={[styles.skinHighlight, { backgroundColor: skin.highlight }]} />
          )}
          {skin.edge && <View style={[styles.skinRing, { borderColor: skin.edge }]} />}
        </View>
      </View>
    );
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        list: { flex: 1 },
        listContent: { padding: spacing.md, paddingBottom: spacing.xl * 2 },
        skinRow: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: spacing.sm,
        },
        skinPreview: {
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: colors.primaryDim,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'visible',
          marginRight: spacing.md,
        },
        skinCircleWrap: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
        skinCircle: { width: 32, height: 32, borderRadius: 16, overflow: 'hidden' },
        skinCircleEquipped: { borderWidth: 2, borderColor: colors.success },
        equippedCard: {
          borderWidth: 2,
          borderColor: colors.success,
          backgroundColor: colors.success + '18',
        },
        skinPulse: { position: 'absolute', width: 32, height: 32, borderRadius: 16, opacity: 0 },
        skinHighlight: {
          position: 'absolute',
          top: -4,
          left: -4,
          width: '70%',
          height: '70%',
          borderRadius: 999,
          opacity: 0.75,
        },
        skinShadow: {
          position: 'absolute',
          bottom: -4,
          right: -4,
          width: '80%',
          height: '80%',
          borderRadius: 999,
          opacity: 0.5,
        },
        skinRing: {
          position: 'absolute',
          top: 2,
          left: 2,
          right: 2,
          bottom: 2,
          borderRadius: 999,
          borderWidth: 1,
          opacity: 0.9,
        },
        skinInfo: { flex: 1 },
        actionRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: spacing.sm,
          minHeight: 34,
        },
        actionSpacer: { flex: 1 },
        costRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
        },
        costRowUnlocked: { opacity: 0.5 },
        costTextUnlocked: {
          textDecorationLine: 'line-through',
        },
        actionSlot: {
          width: 34,
          height: 34,
          minWidth: 34,
          alignItems: 'center',
          justifyContent: 'center',
        },
        actionSlotInner: {
          width: 34,
          height: 34,
          alignItems: 'center',
          justifyContent: 'center',
          position: 'absolute',
        },
        actionButton: {
          width: 34,
          height: 34,
          minWidth: 34,
          paddingVertical: 0,
          paddingHorizontal: 0,
        },
        lockIconContainer: {
          width: 34,
          height: 34,
          borderRadius: borderRadius.sm,
          backgroundColor: colors.textMuted + '20',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: colors.textMuted + '40',
        },
        equippedBadge: {
          width: 34,
          height: 34,
          borderRadius: borderRadius.sm,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 2,
        },
      }),
    [colors, insets.top]
  );

  return (
    <Animated.View style={styles.container} entering={FadeIn.duration(220)}>
      <Header
        title={t('skins.title')}
        onBack={() => navigation.goBack()}
        backLabel={t('common.back')}
        rightComponent={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
            <Icon name="monetization_on" size={20} color={colors.coin} />
            <Text variant="body">{totalCoins}</Text>
          </View>
        }
        style={{ borderBottomColor: colors.primaryDim }}
      />
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {SKIN_IDS.map((skinId) => {
          const unlocked = unlockedSkins.includes(skinId);
          const equipped = equippedSkinId === skinId;
          const cost = SKIN_COSTS[skinId] ?? 0;
          const canUnlock = !unlocked && totalCoins >= cost;
          const skinVisual = SKIN_VISUALS[skinId] ?? SKIN_VISUALS.classic;
          const actionKey = unlocked ? (equipped ? 'equipped' : 'equip') : (canUnlock ? 'unlock' : 'locked');

          return (
            <Card
              key={skinId}
              variant="default"
              style={[styles.skinRow, ...(equipped ? [styles.equippedCard] : [])]}
            >
              <View style={styles.skinPreview}>
                <SkinPreviewCircle skin={skinVisual} equipped={equipped} />
              </View>
              <View style={styles.skinInfo}>
                <Text variant="body" style={{ fontWeight: '600', marginBottom: spacing.xs }}>
                  {t(`skins.${skinId}`)}
                </Text>
                <View style={styles.actionRow}>
                  {cost > 0 ? (
                    <View
                      style={[
                        styles.costRow,
                        unlocked && styles.costRowUnlocked,
                      ]}
                    >
                      <Icon
                        name="monetization_on"
                        size={16}
                        color={colors.coin}
                      />
                      <Text
                        variant="bodySmall"
                        color="muted"
                        style={unlocked ? styles.costTextUnlocked : undefined}
                      >
                        {cost}
                      </Text>
                    </View>
                  ) : (
                    <Text variant="bodySmall" color="muted">
                      {t('common.free')}
                    </Text>
                  )}
                  <View style={styles.actionSlot}>
                    <Animated.View
                      key={actionKey}
                      entering={FadeIn.duration(180)}
                      exiting={FadeOut.duration(120)}
                      style={styles.actionSlotInner}
                    >
                      {actionKey === 'locked' && (
                        <View style={styles.lockIconContainer}>
                          <Icon name="lock" size={18} color={colors.textMuted} />
                        </View>
                      )}
                      {actionKey === 'unlock' && (
                        <Button
                          onPress={() => handleUnlock(skinId)}
                          variant="revive"
                          size="small"
                          icon="lock_open"
                          style={styles.actionButton}
                        />
                      )}
                      {actionKey === 'equip' && (
                        <Button
                          onPress={() => handleEquip(skinId)}
                          variant="primary"
                          size="small"
                          icon="check"
                          style={styles.actionButton}
                        />
                      )}
                      {actionKey === 'equipped' && (
                        <View style={[styles.equippedBadge, { backgroundColor: colors.success + '25' }]}>
                          <Icon name="check_circle" size={22} color={colors.success} />
                        </View>
                      )}
                    </Animated.View>
                  </View>
                </View>
              </View>
            </Card>
          );
        })}
      </ScrollView>
    </Animated.View>
  );
}
