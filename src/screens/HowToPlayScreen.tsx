/**
 * How to Play — rules and controls. Phase 4: theme, i18n, safe area.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { PressableScale } from '../components/PressableScale';
import { useTheme } from '../hooks/useTheme';
import { spacing } from '../theme';

export function HowToPlayScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'HowToPlay'>>();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background, paddingTop: insets.top },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.md,
          paddingTop: spacing.xl,
          paddingBottom: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: colors.backgroundLight,
        },
        backBtn: { paddingVertical: spacing.sm, paddingRight: spacing.md },
        backBtnText: { fontSize: 16, color: colors.primary },
        title: { fontSize: 20, fontWeight: '700', color: colors.text },
        scroll: { flex: 1 },
        scrollContent: { padding: spacing.lg },
        paragraph: { fontSize: 16, color: colors.text, lineHeight: 24, marginBottom: spacing.md },
        highlight: { color: colors.primary, fontWeight: '600' },
      }),
    [colors, insets.top]
  );

  return (
    <Animated.View style={styles.container} entering={FadeIn.duration(220)}>
      <View style={styles.header}>
        <PressableScale style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>{t('common.back')}</Text>
        </PressableScale>
        <Text style={styles.title}>{t('howToPlay.title')}</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.paragraph}>{t('howToPlay.rule1')}</Text>
        <Text style={styles.paragraph}>{t('howToPlay.rule2')}</Text>
        <Text style={styles.paragraph}>{t('howToPlay.rule3')}</Text>
        <Text style={styles.paragraph}>{t('howToPlay.rule4')}</Text>
        <Text style={styles.paragraph}>{t('howToPlay.rule5')}</Text>
      </ScrollView>
    </Animated.View>
  );
}
