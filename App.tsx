/**
 * One Tap Dodge — Phase 4: theme, i18n, polish.
 */

import React, { useEffect } from 'react';
import { StatusBar, View, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { RootNavigator } from './src/navigation/RootNavigator';
import { usePersistedStore } from './src/hooks/usePersistedStore';
import { useTheme } from './src/hooks/useTheme';
import { initI18n, changeLanguage } from './src/i18n';
import { useGameStore } from './src/state/store';
import { initAds } from './src/services/ads';
import { preloadSfx } from './src/services/sfx';
import { initMusic, playTrack, setMusicEnabled } from './src/services/music';

initI18n('system');

function AppContent() {
  const { isDark, colors } = useTheme();

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <View style={styles.container}>
        <RootNavigator />
      </View>
    </>
  );
}

function App() {
  usePersistedStore();
  const locale = useGameStore((s) => s.locale);
  const musicOn = useGameStore((s) => s.musicOn);
  const musicInitRef = React.useRef(false);

  useEffect(() => {
    initAds();
    preloadSfx();
    initMusic().then(() => {
      musicInitRef.current = true;
      if (useGameStore.getState().musicOn) {
        playTrack('ambient');
      }
    });
  }, []);

  useEffect(() => {
    if (!musicInitRef.current) return;
    setMusicEnabled(musicOn);
    if (musicOn) playTrack('ambient');
  }, [musicOn]);

  useEffect(() => {
    changeLanguage(locale);
  }, [locale]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <NavigationContainer>
          <AppContent />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { flex: 1 },
});

export default App;
