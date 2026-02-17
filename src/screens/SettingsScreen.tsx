/**
 * Settings screen — sound, music, haptics, language, theme. Phase 4.
 */

import React from 'react';
import {
  View,
  StyleSheet,
  Switch,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useGameStore, type ThemeMode, type LocaleCode } from '../state/store';
import { changeLanguage } from '../i18n';
import { useTheme } from '../hooks/useTheme';
import { spacing } from '../theme';
import { Text, Header } from '../design-system';
import { borderRadius } from '../design-system/tokens';

const THEME_OPTIONS: { value: ThemeMode; key: string }[] = [
  { value: 'dark', key: 'themeDark' },
  { value: 'light', key: 'themeLight' },
  { value: 'system', key: 'themeSystem' },
];

const LOCALE_OPTIONS: { value: LocaleCode; label: string }[] = [
  { value: 'pt-BR', label: 'Português' },
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
  { value: 'system', label: 'settings.languageSystem' },
];

export function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Settings'>>();
  const soundOn = useGameStore((s) => s.soundOn);
  const musicOn = useGameStore((s) => s.musicOn);
  const hapticsOn = useGameStore((s) => s.hapticsOn);
  const themeMode = useGameStore((s) => s.themeMode);
  const locale = useGameStore((s) => s.locale);
  const setSetting = useGameStore((s) => s.setSetting);

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        scroll: { flex: 1 },
        scrollContent: { padding: spacing.lg },
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: colors.backgroundLight,
        },
        sectionTitle: {
          marginTop: spacing.lg,
          marginBottom: spacing.sm,
        },
        pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
        pickerBtn: {
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: borderRadius.sm,
          backgroundColor: colors.backgroundLight,
        },
        pickerBtnActive: { backgroundColor: colors.primaryDim, borderWidth: 1, borderColor: colors.primary },
      }),
    [colors, insets.top]
  );

  const handleLocale = (value: LocaleCode) => {
    setSetting('locale', value);
    changeLanguage(value);
  };

  return (
    <Animated.View style={styles.container} entering={FadeIn.duration(220)}>
      <Header
        title={t('settings.title')}
        onBack={() => navigation.goBack()}
        backLabel={t('common.back')}
      />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.row}>
          <Text variant="body">{t('settings.soundEffects')}</Text>
          <Switch
            value={soundOn}
            onValueChange={(v) => setSetting('soundOn', v)}
            trackColor={{ false: colors.backgroundLight, true: colors.primaryDim }}
            thumbColor={soundOn ? colors.primary : colors.textMuted}
          />
        </View>
        <View style={styles.row}>
          <Text variant="body">{t('settings.music')}</Text>
          <Switch
            value={musicOn}
            onValueChange={(v) => setSetting('musicOn', v)}
            trackColor={{ false: colors.backgroundLight, true: colors.primaryDim }}
            thumbColor={musicOn ? colors.primary : colors.textMuted}
          />
        </View>
        <View style={styles.row}>
          <Text variant="body">{t('settings.haptics')}</Text>
          <Switch
            value={hapticsOn}
            onValueChange={(v) => setSetting('hapticsOn', v)}
            trackColor={{ false: colors.backgroundLight, true: colors.primaryDim }}
            thumbColor={hapticsOn ? colors.primary : colors.textMuted}
          />
        </View>

        <Text variant="label" color="muted" style={styles.sectionTitle}>{t('settings.language')}</Text>
        <View style={styles.pickerRow}>
          {LOCALE_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.pickerBtn, locale === opt.value && styles.pickerBtnActive]}
              onPress={() => handleLocale(opt.value)}
            >
              <Text
                variant="bodySmall"
                color={locale === opt.value ? 'primary' : 'default'}
                style={locale === opt.value ? { fontWeight: '600' } : {}}
              >
                {opt.value === 'system' ? t(opt.label) : opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text variant="label" color="muted" style={styles.sectionTitle}>{t('settings.theme')}</Text>
        <View style={styles.pickerRow}>
          {THEME_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.pickerBtn, themeMode === opt.value && styles.pickerBtnActive]}
              onPress={() => setSetting('themeMode', opt.value)}
            >
              <Text
                variant="bodySmall"
                color={themeMode === opt.value ? 'primary' : 'default'}
                style={themeMode === opt.value ? { fontWeight: '600' } : {}}
              >
                {t(`settings.${opt.key}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </Animated.View>
  );
}
