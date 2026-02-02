/**
 * Skins screen — unlock/equip by ID. Phase 2: IDs only, no art.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useGameStore, SKIN_IDS, SKIN_COSTS } from '../state/store';
import { colors, spacing } from '../theme';

export type RootStackParamList = {
  Game: undefined;
  Skins: undefined;
};

const SKIN_LABELS: Record<string, string> = {
  classic: 'Classic',
  cyber_blue: 'Cyber Blue',
  magma: 'Magma',
  matrix: 'Matrix',
  void: 'Void',
  neon_striker: 'Neon Striker',
};

export function SkinsScreen() {
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Customization</Text>
        <Text style={styles.coins}>🪙 {totalCoins}</Text>
      </View>
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {SKIN_IDS.map((skinId) => {
          const unlocked = unlockedSkins.includes(skinId);
          const equipped = equippedSkinId === skinId;
          const cost = SKIN_COSTS[skinId] ?? 0;
          const canUnlock = !unlocked && totalCoins >= cost;

          return (
            <View key={skinId} style={styles.skinRow}>
              <View style={styles.skinPreview}>
                <View
                  style={[
                    styles.skinCircle,
                    equipped && styles.skinCircleEquipped,
                  ]}
                />
              </View>
              <View style={styles.skinInfo}>
                <Text style={styles.skinName}>{SKIN_LABELS[skinId] ?? skinId}</Text>
                {unlocked ? (
                  equipped ? (
                    <Text style={styles.equipped}>Equipped</Text>
                  ) : (
                    <TouchableOpacity
                      style={styles.equipBtn}
                      onPress={() => handleEquip(skinId)}
                    >
                      <Text style={styles.equipBtnText}>Equip</Text>
                    </TouchableOpacity>
                  )
                ) : (
                  <View style={styles.lockedRow}>
                    <Text style={styles.cost}>
                      {cost} 🪙
                    </Text>
                    <TouchableOpacity
                      style={[styles.unlockBtn, !canUnlock && styles.unlockBtnDisabled]}
                      onPress={() => handleUnlock(skinId)}
                      disabled={!canUnlock}
                    >
                      <Text style={styles.unlockBtnText}>
                        {canUnlock ? 'Unlock' : 'Locked'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
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
  backBtn: {
    padding: spacing.sm,
  },
  backBtnText: {
    fontSize: 16,
    color: colors.primary,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  coins: {
    fontSize: 16,
    color: colors.text,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
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
  skinCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
  },
  skinCircleEquipped: {
    borderWidth: 2,
    borderColor: colors.success,
  },
  skinInfo: {
    flex: 1,
  },
  skinName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  equipped: {
    fontSize: 14,
    color: colors.success,
  },
  equipBtn: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  equipBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.background,
  },
  lockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cost: {
    fontSize: 14,
    color: colors.textMuted,
  },
  unlockBtn: {
    backgroundColor: colors.textMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  unlockBtnDisabled: {
    opacity: 0.5,
  },
  unlockBtnText: {
    fontSize: 12,
    color: colors.text,
  },
});
