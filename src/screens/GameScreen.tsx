/**
 * Game screen — tap to swap lanes, player + obstacles, HUD.
 * Phase 1: single screen, no navigation.
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  useWindowDimensions,
} from 'react-native';
import { useGameLoop, type GameLoopDimensions } from '../hooks/useGameLoop';
import { HUD } from '../components/overlays/HUD';
import { colors, spacing } from '../theme';
import { PLAYER_RADIUS, OBSTACLE_WIDTH, OBSTACLE_HEIGHT } from '../engine/constants';

export function GameScreen() {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const laneCenterX: [number, number] = [
    screenWidth / 4,
    (screenWidth * 3) / 4,
  ];
  const dimensions: GameLoopDimensions | null =
    screenWidth > 0 && screenHeight > 0
      ? { width: screenWidth, height: screenHeight, laneCenterX }
      : null;

  const {
    phase,
    score,
    player,
    obstacles,
    nearMissFlash,
    startGame,
    swapLane,
  } = useGameLoop(dimensions);

  const handlePress = useCallback(() => {
    if (phase === 'playing') {
      swapLane();
    } else if (phase === 'idle' || phase === 'game_over') {
      startGame();
    }
  }, [phase, swapLane, startGame]);

  if (!dimensions) {
    return <View style={[styles.container, { width: screenWidth, height: screenHeight }]} />;
  }

  const { width, height, laneCenterX: laneCenters } = dimensions;

  return (
    <TouchableWithoutFeedback onPress={handlePress}>
      <View style={[styles.container, { width: screenWidth, height: screenHeight }]}>
        {/* Game area */}
        <View style={[styles.gameArea, { width, height }]}>
          {/* Lanes background */}
          <View style={styles.lanes}>
            <View style={[styles.lane, { width: width / 2 }]} />
            <View style={[styles.lane, { width: width / 2 }]} />
          </View>

          {/* Obstacles */}
          {obstacles.map((obs) => (
            <View
              key={obs.id}
              style={[
                styles.obstacle,
                {
                  left: obs.x,
                  top: obs.y,
                  width: OBSTACLE_WIDTH,
                  height: OBSTACLE_HEIGHT,
                },
              ]}
            />
          ))}

          {/* Player */}
          {player && (
            <View
              style={[
                styles.player,
                {
                  left: laneCenters[player.lane] - PLAYER_RADIUS,
                  top: player.centerY - PLAYER_RADIUS,
                  width: PLAYER_RADIUS * 2,
                  height: PLAYER_RADIUS * 2,
                  borderRadius: PLAYER_RADIUS,
                },
              ]}
            />
          )}
        </View>

        <HUD score={score} nearMissFlash={nearMissFlash} />

        {/* Idle / Game Over overlay */}
        {(phase === 'idle' || phase === 'game_over') && (
          <View style={styles.overlay}>
            <Text style={styles.overlayTitle}>
              {phase === 'idle' ? 'One Tap Dodge' : 'Game Over'}
            </Text>
            {phase === 'game_over' && (
              <Text style={styles.overlayScore}>Score: {score}</Text>
            )}
            <Text style={styles.overlayHint}>
              Tap to {phase === 'idle' ? 'start' : 'play again'}
            </Text>
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  gameArea: {
    position: 'absolute',
    left: 0,
    top: 0,
    overflow: 'hidden',
  },
  lanes: {
    flexDirection: 'row',
    flex: 1,
  },
  lane: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
    borderRightWidth: 1,
    borderRightColor: colors.primaryDim,
  },
  obstacle: {
    position: 'absolute',
    backgroundColor: colors.obstacle,
    opacity: 0.95,
    borderRadius: 8,
  },
  player: {
    position: 'absolute',
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.text,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  overlayScore: {
    fontSize: 20,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  overlayHint: {
    fontSize: 16,
    color: colors.textMuted,
  },
});
