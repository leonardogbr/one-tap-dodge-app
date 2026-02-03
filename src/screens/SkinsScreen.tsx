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
import { useGameStore, SKIN_IDS, SKIN_COSTS, SKIN_COLORS } from '../state/store';
import { useTheme } from '../hooks/useTheme';
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
          marginRight: spacing.md,
        },
        skinCircle: { width: 32, height: 32, borderRadius: 16 },
        skinCircleEquipped: { borderWidth: 2, borderColor: colors.success },
        skinInfo: { flex: 1 },
        skinName: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: spacing.xs },
        equipped: { fontSize: 14, color: colors.success },
        equipBtn: { alignSelf: 'flex-start', backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: 8 },
        equipBtnText: { fontSize: 14, fontWeight: '600', color: colors.background },
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
          const skinColor = SKIN_COLORS[skinId] ?? colors.primary;

          return (
            <View key={skinId} style={styles.skinRow}>
              <View style={styles.skinPreview}>
                <View
                  style={[
                    styles.skinCircle,
                    { backgroundColor: skinColor },
                    equipped && styles.skinCircleEquipped,
                  ]}
                />
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
