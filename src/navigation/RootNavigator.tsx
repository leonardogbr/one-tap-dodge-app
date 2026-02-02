/**
 * Root stack — Game, Skins. Phase 2.
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GameScreen } from '../screens/GameScreen';
import { SkinsScreen, type RootStackParamList } from '../screens/SkinsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0d1117' },
      }}
    >
      <Stack.Screen name="Game" component={GameScreen} />
      <Stack.Screen name="Skins" component={SkinsScreen} />
    </Stack.Navigator>
  );
}
