/**
 * HUD — score and optional best. Phase 1: score only.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../../theme';

interface HUDProps {
  score: number;
  best?: number;
  nearMissFlash?: boolean;
}

export function HUD({ score, best = 0, nearMissFlash }: HUDProps) {
  return (
    <View style={styles.container} pointerEvents="none">
      <Text style={styles.score}>{score}</Text>
      {best > 0 && (
        <Text style={styles.best}>Best: {best}</Text>
      )}
      {nearMissFlash && (
        <View style={styles.nearMissBadge}>
          <Text style={styles.nearMissText}>+50</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: spacing.xl,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  score: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.text,
  },
  best: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  nearMissBadge: {
    position: 'absolute',
    top: 80,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  nearMissText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.background,
  },
});
