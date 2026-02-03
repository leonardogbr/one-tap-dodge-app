/**
 * Home / Main menu — Play, How to Play, Skins, Settings. Phase 4: theme, i18n, safe area.
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
import { spacing } from '../theme';

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Home'>>();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: spacing.xl,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
        title: { fontSize: 32, fontWeight: '700', color: colors.text, marginBottom: spacing.sm, textAlign: 'center' },
        subtitle: { fontSize: 16, color: colors.textMuted, marginBottom: spacing.xl, textAlign: 'center' },
        mainBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.xl * 2, paddingVertical: spacing.lg, borderRadius: 12, marginBottom: spacing.lg, minWidth: 200, alignItems: 'center' },
        mainBtnText: { fontSize: 20, fontWeight: '700', color: colors.background },
        menuBtn: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg, marginBottom: spacing.sm, minWidth: 200, alignItems: 'center' },
        menuBtnText: { fontSize: 16, color: colors.primary },
      }),
    [colors, insets.top, insets.bottom]
  );

  return (
    <Animated.View style={styles.container} entering={FadeIn.duration(220)}>
      <Text style={styles.title}>{t('home.title')}</Text>
      <Text style={styles.subtitle}>{t('home.subtitle')}</Text>

      <PressableScale style={styles.mainBtn} onPress={() => navigation.navigate('Game')}>
        <Text style={styles.mainBtnText}>{t('common.play')}</Text>
      </PressableScale>

      <PressableScale style={styles.menuBtn} onPress={() => navigation.navigate('HowToPlay')}>
        <Text style={styles.menuBtnText}>{t('home.howToPlay')}</Text>
      </PressableScale>

      <PressableScale style={styles.menuBtn} onPress={() => navigation.navigate('Skins')}>
        <Text style={styles.menuBtnText}>{t('home.skins')}</Text>
      </PressableScale>

      <PressableScale style={styles.menuBtn} onPress={() => navigation.navigate('Settings')}>
        <Text style={styles.menuBtnText}>{t('common.settings')}</Text>
      </PressableScale>
    </Animated.View>
  );
}
