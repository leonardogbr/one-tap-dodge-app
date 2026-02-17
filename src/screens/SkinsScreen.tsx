/**
 * Skins screen — unlock/equip by ID, different colors per skin. Phase 4: theme, i18n, safe area.
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useGameStore, SKIN_IDS, SKIN_COSTS, SKIN_VISUALS, type SkinVisual } from '../state/store';
import { useTheme } from '../hooks/useTheme';
import { usePulseAnimation } from '../hooks/usePulseAnimation';
import { spacing } from '../theme';

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
      equipSkin(skinId);
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
        container: { flex: 1, backgroundColor: colors.background, paddingTop: insets.top },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.md,
          paddingTop: spacing.xl,
          paddingBottom: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: colors.primaryDim,
        },
        backBtn: { padding: spacing.sm },
        backBtnText: { fontSize: 16, color: colors.primary },
        title: { fontSize: 20, fontWeight: '700', color: colors.text },
        coins: { fontSize: 16, color: colors.text },
        list: { flex: 1 },
        listContent: { padding: spacing.md, paddingBottom: spacing.xl * 2 },
        skinRow: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.backgroundLight,
          borderRadius: 12,
          padding: spacing.md,
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
        skinName: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: spacing.xs },
        equipped: { fontSize: 14, color: colors.success },
        equipBtn: { alignSelf: 'flex-start', backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: 8 },
        equipBtnText: { fontSize: 14, fontWeight: '600', color: colors.onPrimary },
        lockedRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
        cost: { fontSize: 14, color: colors.textMuted },
        unlockBtn: { backgroundColor: colors.textMuted, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: 8 },
        unlockBtnDisabled: { opacity: 0.5 },
        unlockBtnText: { fontSize: 12, color: colors.text },
      }),
    [colors, insets.top]
  );

  return (
    <Animated.View style={styles.container} entering={FadeIn.duration(220)}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>{t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('skins.title')}</Text>
        <Text style={styles.coins}>🪙 {totalCoins}</Text>
      </View>
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {SKIN_IDS.map((skinId) => {
          const unlocked = unlockedSkins.includes(skinId);
          const equipped = equippedSkinId === skinId;
          const cost = SKIN_COSTS[skinId] ?? 0;
          const canUnlock = !unlocked && totalCoins >= cost;
          const skinVisual = SKIN_VISUALS[skinId] ?? SKIN_VISUALS.classic;

          return (
            <View key={skinId} style={styles.skinRow}>
              <View style={styles.skinPreview}>
                <SkinPreviewCircle skin={skinVisual} equipped={equipped} />
              </View>
              <View style={styles.skinInfo}>
                <Text style={styles.skinName}>{t(`skins.${skinId}`)}</Text>
                {unlocked ? (
                  equipped ? (
                    <Text style={styles.equipped}>{t('common.equipped')}</Text>
                  ) : (
                    <TouchableOpacity style={styles.equipBtn} onPress={() => handleEquip(skinId)}>
                      <Text style={styles.equipBtnText}>{t('common.equip')}</Text>
                    </TouchableOpacity>
                  )
                ) : (
                  <View style={styles.lockedRow}>
                    <Text style={styles.cost}>{cost} 🪙</Text>
                    <TouchableOpacity
                      style={[styles.unlockBtn, !canUnlock && styles.unlockBtnDisabled]}
                      onPress={() => handleUnlock(skinId)}
                      disabled={!canUnlock}
                    >
                      <Text style={styles.unlockBtnText}>
                        {canUnlock ? t('common.unlock') : t('common.locked')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </Animated.View>
  );
}
