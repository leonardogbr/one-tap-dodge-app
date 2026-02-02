/**
 * One Tap Dodge — Phase 3: Ads (rewarded + interstitial).
 */

import React, { useEffect } from 'react';
import { StatusBar, View, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { RootNavigator } from './src/navigation/RootNavigator';
import { usePersistedStore } from './src/hooks/usePersistedStore';
import { initAds } from './src/services/ads';

function App() {
  usePersistedStore();

  useEffect(() => {
    initAds();
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor="#0d1117" />
        <NavigationContainer>
          <View style={styles.container}>
            <RootNavigator />
          </View>
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
