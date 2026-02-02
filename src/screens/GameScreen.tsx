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
  TouchableOpacity,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from './SkinsScreen';
import { useGameLoop, type GameLoopDimensions } from '../hooks/useGameLoop';
import { useGameStore } from '../state/store';
import { HUD } from '../components/overlays/HUD';
import { isRewardedLoaded, showRewarded, showInterstitial } from '../services/ads';
import { colors, spacing } from '../theme';
import {
  PLAYER_RADIUS,
  OBSTACLE_WIDTH,
  OBSTACLE_HEIGHT,
  COIN_WIDTH,
  COIN_HEIGHT,
  INTERSTITIAL_AFTER_GAME_OVERS,
} from '../engine/constants';

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
    coins,
    nearMissFlash,
    coinMultiplierActive,
    highScore,
    startGame,
    swapLane,
    revive,
  } = useGameLoop(dimensions);

  const [reviveLoading, setReviveLoading] = useState(false);
  const coinsThisRun = useGameStore((s) => s.coinsThisRun);
  const shieldMeter = useGameStore((s) => s.shieldMeter);
  const canRevive = useGameStore((s) => s.canRevive);
  const gameOversSinceLastInterstitial = useGameStore(
    (s) => s.gameOversSinceLastInterstitial
  );
  const removeAds = useGameStore((s) => s.removeAds);
  const resetGameOversSinceLastInterstitial = useGameStore(
    (s) => s.resetGameOversSinceLastInterstitial
  );
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Game'>>();

  // Interstitial only from "Play again" or "Skins" (game_over). Never after Rewarded (revive).
  const handlePlayAgain = useCallback(async () => {
    if (phase !== 'game_over') return;
    if (
      !removeAds &&
      gameOversSinceLastInterstitial >= INTERSTITIAL_AFTER_GAME_OVERS
    ) {
      await showInterstitial();
      resetGameOversSinceLastInterstitial();
      // Next frame so ad teardown can finish; reduces perceived delay vs blocking
      requestAnimationFrame(() => {
        startGame();
      });
      return;
    }
    startGame();
  }, [
    phase,
    startGame,
    removeAds,
    gameOversSinceLastInterstitial,
    resetGameOversSinceLastInterstitial,
  ]);

  const handleSkins = useCallback(async () => {
    if (
      phase === 'game_over' &&
      !removeAds &&
      gameOversSinceLastInterstitial >= INTERSTITIAL_AFTER_GAME_OVERS
    ) {
      await showInterstitial();
      resetGameOversSinceLastInterstitial();
      requestAnimationFrame(() => {
        navigation.navigate('Skins');
      });
      return;
    }
    navigation.navigate('Skins');
  }, [
    phase,
    navigation,
    removeAds,
    gameOversSinceLastInterstitial,
    resetGameOversSinceLastInterstitial,
  ]);

  const handlePress = useCallback(() => {
    if (phase === 'playing') {
      swapLane();
    } else if (phase === 'idle') {
      startGame();
    } else if (phase === 'game_over') {
      handlePlayAgain();
    }
  }, [phase, swapLane, startGame, handlePlayAgain]);

  const handleRevive = useCallback(async () => {
    if (!canRevive || !isRewardedLoaded() || reviveLoading) return;
    setReviveLoading(true);
    const earned = await showRewarded();
    setReviveLoading(false);
    if (earned) revive();
  }, [canRevive, reviveLoading, revive]);

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

          {/* Coins */}
          {coins.map((coin) => (
            <View
              key={coin.id}
              style={[
                styles.coin,
                {
                  left: coin.x,
                  top: coin.y,
                  width: COIN_WIDTH,
                  height: COIN_HEIGHT,
                  borderRadius: COIN_WIDTH / 2,
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

        <HUD
          score={score}
          best={highScore}
          coinsThisRun={coinsThisRun}
          shieldMeter={shieldMeter}
          nearMissFlash={nearMissFlash}
          coinMultiplierActive={coinMultiplierActive}
        />

        {/* Idle / Game Over overlay */}
        {(phase === 'idle' || phase === 'game_over') && (
          <View style={styles.overlay}>
            <Text style={styles.overlayTitle}>
              {phase === 'idle' ? 'One Tap Dodge' : 'Game Over'}
            </Text>
            {phase === 'game_over' && (
              <Text style={styles.overlayScore}>Score: {score}</Text>
            )}
            {phase === 'game_over' && canRevive && (
              <TouchableOpacity
                style={[
                  styles.overlayReviveBtn,
                  (!isRewardedLoaded() || reviveLoading) && styles.overlayReviveBtnDisabled,
                ]}
                onPress={handleRevive}
                disabled={!isRewardedLoaded() || reviveLoading}
              >
                {reviveLoading ? (
                  <ActivityIndicator color={colors.background} size="small" />
                ) : (
                  <Text style={styles.overlayReviveBtnText}>
                    {isRewardedLoaded()
                      ? 'Watch Ad to Continue'
                      : 'Loading ad…'}
                  </Text>
                )}
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.overlayMainBtn}
              onPress={phase === 'idle' ? startGame : handlePlayAgain}
            >
              <Text style={styles.overlayMainBtnText}>
                {phase === 'idle' ? 'Tap to start' : 'Play again'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.overlaySkinsBtn}
              onPress={handleSkins}
            >
              <Text style={styles.overlaySkinsBtnText}>Skins</Text>
            </TouchableOpacity>
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
  coin: {
    position: 'absolute',
    backgroundColor: '#ffd700',
    borderWidth: 2,
    borderColor: '#b8860b',
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
    marginBottom: spacing.md,
  },
  overlayReviveBtn: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
    minWidth: 200,
    alignItems: 'center',
  },
  overlayReviveBtnDisabled: {
    opacity: 0.7,
  },
  overlayReviveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.background,
  },
  overlayMainBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  overlayMainBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.background,
  },
  overlaySkinsBtn: {
    paddingVertical: spacing.sm,
  },
  overlaySkinsBtnText: {
    fontSize: 16,
    color: colors.textMuted,
  },
});
