/**
 * Splash / Loading — logo then navigate to Home. Phase 4: theme, i18n, safe area.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useTheme } from '../hooks/useTheme';
import { spacing } from '../theme';

const SPLASH_DURATION_MS = 2000;

export function SplashScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Splash'>>();

  React.useEffect(() => {
    const id = setTimeout(() => {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    }, SPLASH_DURATION_MS);
    return () => clearTimeout(id);
  }, [navigation]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
          justifyContent: 'center',
          alignItems: 'center',
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
        title: { fontSize: 28, fontWeight: '700', color: colors.primary, marginBottom: spacing.sm, textAlign: 'center' },
        subtitle: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
      }),
    [colors, insets.top, insets.bottom]
  );

  return (
    <Animated.View style={styles.container} entering={FadeIn.duration(400)}>
      <Text style={styles.title}>{t('home.title')}</Text>
      <Text style={styles.subtitle}>{t('splash.loading')}</Text>
    </Animated.View>
  );
}
