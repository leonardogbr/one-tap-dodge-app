/**
 * Skins screen — unlock/equip by ID, different colors per skin. Phase 4: theme, i18n, safe area.
 */

import React, { useMemo } from 'react';
import {
  View,
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
import { Text, Header, Card, Button } from '../design-system';
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
        lockedRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
      }),
    [colors, insets.top]
  );

  return (
    <Animated.View style={styles.container} entering={FadeIn.duration(220)}>
      <Header
        title={t('skins.title')}
        onBack={() => navigation.goBack()}
        backLabel={t('common.back')}
        rightComponent={<Text variant="body">🪙 {totalCoins}</Text>}
        style={{ borderBottomColor: colors.primaryDim }}
      />
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {SKIN_IDS.map((skinId) => {
          const unlocked = unlockedSkins.includes(skinId);
          const equipped = equippedSkinId === skinId;
          const cost = SKIN_COSTS[skinId] ?? 0;
          const canUnlock = !unlocked && totalCoins >= cost;
          const skinVisual = SKIN_VISUALS[skinId] ?? SKIN_VISUALS.classic;

          return (
            <Card key={skinId} variant="default" style={styles.skinRow}>
              <View style={styles.skinPreview}>
                <SkinPreviewCircle skin={skinVisual} equipped={equipped} />
              </View>
              <View style={styles.skinInfo}>
                <Text variant="body" style={{ fontWeight: '600', marginBottom: spacing.xs }}>
                  {t(`skins.${skinId}`)}
                </Text>
                {unlocked ? (
                  equipped ? (
                    <Text variant="bodySmall" color="success">{t('common.equipped')}</Text>
                  ) : (
                    <Button
                      title={t('common.equip')}
                      onPress={() => handleEquip(skinId)}
                      variant="primary"
                      size="small"
                      style={{ alignSelf: 'flex-start' }}
                    />
                  )
                ) : (
                  <View style={styles.lockedRow}>
                    <Text variant="bodySmall" color="muted">{cost} 🪙</Text>
                    <Button
                      title={canUnlock ? t('common.unlock') : t('common.locked')}
                      onPress={() => handleUnlock(skinId)}
                      variant="ghost"
                      size="small"
                      disabled={!canUnlock}
                      style={{ backgroundColor: colors.textMuted }}
                    />
                  </View>
                )}
              </View>
            </Card>
          );
        })}
      </ScrollView>
    </Animated.View>
  );
}
