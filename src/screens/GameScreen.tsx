/**
 * Game screen — tap to swap lanes, player + obstacles, HUD. Phase 4: countdown, game over delay, explosion.
 */

import React, { useCallback, useState, useRef, useEffect, useLayoutEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableWithoutFeedback,
  useWindowDimensions,
  BackHandler,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useGameLoop, type GameLoopDimensions } from '../hooks/useGameLoop';
import { usePulseAnimation } from '../hooks/usePulseAnimation';
import { useGameStore, SKIN_VISUALS } from '../state/store';
import { HUD } from '../components/overlays/HUD';
import { PressableScale } from '../components/PressableScale';
import { useTheme } from '../hooks/useTheme';
import { spacing } from '../theme';
import { Text, Button, Card } from '../design-system';
import { borderRadius, shadows } from '../design-system/tokens';
import {
  PLAYER_RADIUS,
  OBSTACLE_WIDTH,
  OBSTACLE_HEIGHT,
  COIN_WIDTH,
  COIN_HEIGHT,
  COUNTDOWN_STEP_MS,
} from '../engine/constants';

type CountdownStep = 3 | 2 | 1 | 'go' | null;

export function GameScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
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
    laneSwapTick,
    runTimeMs,
    resetForCountdown,
    startGame,
    swapLane,
    pause,
    resume,
    quitFromPause,
    restartFromPause,
    revive,
  } = useGameLoop(dimensions);

  const playerScale = useSharedValue(1);
  useEffect(() => {
    if (laneSwapTick > 0) {
      playerScale.value = withSequence(
        withTiming(1.15, { duration: 60, easing: Easing.out(Easing.cubic) }),
        withTiming(1, { duration: 90 })
      );
    }
  }, [laneSwapTick, playerScale]);
  const playerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: playerScale.value }],
  }));

  const [countdownStep, setCountdownStep] = useState<CountdownStep>(null);
  const countdownCallbackRef = useRef<() => void>(() => { });

  const coinsThisRun = useGameStore((s) => s.coinsThisRun);
  const nearMissesThisRun = useGameStore((s) => s.nearMissesThisRun);
  const shieldMeter = useGameStore((s) => s.shieldMeter);
  const setCoinsThisRun = useGameStore((s) => s.setCoinsThisRun);
  const setShieldMeter = useGameStore((s) => s.setShieldMeter);
  const scoreMultiplier = useGameStore((s) => s.scoreMultiplier);
  const canRevive = useGameStore((s) => s.canRevive);
  const reviveEarnedFromAd = useGameStore((s) => s.reviveEarnedFromAd);
  const setReviveEarnedFromAd = useGameStore((s) => s.setReviveEarnedFromAd);
  const equippedSkinId = useGameStore((s) => s.equippedSkinId);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Game'>>();
  const skinVisual = SKIN_VISUALS[equippedSkinId] ?? SKIN_VISUALS.classic;
  const pulseAnimatedStyle = usePulseAnimation(!!skinVisual.pulse);

  const startCountdown = useCallback(
    (callback: () => void) => {
      countdownCallbackRef.current = callback;
      setCountdownStep(3);
    },
    []
  );

  useEffect(() => {
    if (countdownStep === null) return;
    if (countdownStep === 'go') {
      const tId = setTimeout(() => {
        setCountdownStep(null);
        countdownCallbackRef.current();
      }, COUNTDOWN_STEP_MS);
      return () => clearTimeout(tId);
    }
    const next: CountdownStep = countdownStep === 3 ? 2 : countdownStep === 2 ? 1 : 'go';
    const tId = setTimeout(() => setCountdownStep(next), COUNTDOWN_STEP_MS);
    return () => clearTimeout(tId);
  }, [countdownStep]);

  // Android: prevent back button from leaving the game while playing or paused; allow back when idle/game_over.
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (phase === 'playing') {
        pause();
        return true;
      }
      if (phase === 'paused') {
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [phase, pause]);

  // When game over, after a short delay (explosion visible), navigate to GameOver screen.
  // Use push() to keep Game in stack, so revive can goBack() to Game
  useEffect(() => {
    if (phase !== 'game_over') return;
    const tId = setTimeout(() => {
      // Score already has multiplier applied in game loop
      const currentHighScore = useGameStore.getState().highScore;
      const isNewBest = score > 0 && score === currentHighScore;

      navigation.push('GameOver', {
        score,
        isNewBest,
        runTimeMs,
        nearMisses: nearMissesThisRun,
        coins: coinsThisRun,
        canRevive,
      });
    }, 1200);
    return () => clearTimeout(tId);
  }, [phase, score, highScore, runTimeMs, nearMissesThisRun, coinsThisRun, canRevive, navigation]);

  // Track if we navigated away to GameOver screen
  const hasNavigatedAwayRef = useRef(false);

  // Track when we navigate to GameOver
  useEffect(() => {
    if (phase === 'game_over') {
      // Set flag after navigation delay to indicate we navigated away
      const tId = setTimeout(() => {
        hasNavigatedAwayRef.current = true;
      }, 1500); // After navigation completes (1200ms delay + buffer)
      return () => clearTimeout(tId);
    } else {
      hasNavigatedAwayRef.current = false;
    }
  }, [phase]);

  // When returning from GameOver after earning revive from ad, trigger revive.
  // Also reset state when coming back from GameOver screen (e.g., "Play Again")
  useFocusEffect(
    useCallback(() => {
      // Handle revive from ad
      if (reviveEarnedFromAd) {
        hasNavigatedAwayRef.current = false;
        setReviveEarnedFromAd(false);
        revive();
        return;
      }

      // Only reset if we had navigated away (hasNavigatedAwayRef is true)
      // and phase is still 'game_over' when screen receives focus
      // This means we came back from GameOver screen
      if (hasNavigatedAwayRef.current && phase === 'game_over') {
        hasNavigatedAwayRef.current = false;
        resetForCountdown();
        // Reset coins and shield meter when coming back from GameOver
        setCoinsThisRun(0);
        setShieldMeter(0);
      }
    }, [phase, resetForCountdown, reviveEarnedFromAd, setReviveEarnedFromAd, revive, setCoinsThisRun, setShieldMeter])
  );

  // Reset coins and shield meter when screen receives focus and phase is 'idle' or 'paused'
  // This ensures they are zeroed when entering the screen for a new game
  useFocusEffect(
    useCallback(() => {
      if (phase === 'idle' || phase === 'paused') {
        setCoinsThisRun(0);
        setShieldMeter(0);
      }
    }, [phase, setCoinsThisRun, setShieldMeter])
  );

  const handleSkins = useCallback(() => {
    navigation.navigate('Skins');
  }, [navigation]);

  const handleSettings = useCallback(() => navigation.navigate('Settings'), [navigation]);
  const handleHome = useCallback(() => {
    navigation.pop(1);
  }, [navigation]);

  const handlePress = useCallback(() => {
    if (countdownStep !== null) return;
    if (phase === 'playing') swapLane();
  }, [countdownStep, phase, swapLane]);

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background, paddingTop: insets.top },
        gameArea: { position: 'absolute', left: 0, top: 0, overflow: 'hidden' },
        lanes: { flexDirection: 'row', flex: 1 },
        lane: { flex: 1, backgroundColor: colors.backgroundLight, borderRightWidth: 1, borderRightColor: colors.primaryDim },
        obstacle: { position: 'absolute', backgroundColor: colors.obstacle, opacity: 0.95, borderRadius: borderRadius.sm },
        coin: { position: 'absolute', backgroundColor: '#ffd700', borderWidth: 2, borderColor: '#b8860b' },
        playerWrap: {
          position: 'absolute',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'visible',
        },
        playerBody: {
          position: 'absolute',
          borderWidth: 2,
          overflow: 'hidden',
        },
        playerPulse: {
          position: 'absolute',
          opacity: 0,
        },
        playerHighlight: {
          position: 'absolute',
          top: -6,
          left: -6,
          width: '70%',
          height: '70%',
          borderRadius: 999,
          opacity: 0.7,
        },
        playerShadow: {
          position: 'absolute',
          bottom: -6,
          right: -6,
          width: '80%',
          height: '80%',
          borderRadius: 999,
          opacity: 0.5,
        },
        playerRing: {
          position: 'absolute',
          top: 2,
          left: 2,
          right: 2,
          bottom: 2,
          borderRadius: 999,
          borderWidth: 1,
          opacity: 0.9,
        },
        topBarRow: {
          position: 'absolute',
          top: insets.top + spacing.sm,
          left: 0,
          right: 0,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          minHeight: 44,
          paddingHorizontal: spacing.lg,
          zIndex: 15,
        },
        topBarLeft: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center' },
        topBarCenter: { flex: 1 },
        pauseBtn: { padding: spacing.sm },
        multiplierWrap: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center' },
        multiplierBadge: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.sm },
        overlay: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: 'rgba(0,0,0,0.7)',
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: spacing.md,
        },
        overlayCard: {
          flexDirection: 'row',
          alignItems: 'center',
          alignSelf: 'stretch',
          paddingVertical: spacing.xl * 1.5,
          paddingHorizontal: spacing.md,
          minWidth: 280,
          maxWidth: 360,
        },
        overlayContent: { flex: 1, alignItems: 'center', },
        btnRow: { alignItems: 'stretch', alignSelf: 'stretch' },
        overlayTitleUnderline: {
          width: 56,
          height: 3,
          borderRadius: 2,
          backgroundColor: colors.primary,
          marginBottom: spacing.xl,
        },
        overlayDivider: {
          width: '100%',
          height: 1,
          backgroundColor: colors.primaryDim,
          marginTop: spacing.xl,
          marginBottom: spacing.lg,
        },
        overlayNavRow: {
          alignSelf: 'stretch',
          flexDirection: 'row',
          justifyContent: 'space-between',
          gap: spacing.sm,
          paddingHorizontal: spacing.md,
        },
        overlayNavBtn: {
          borderRadius: borderRadius.lg,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.sm,
          alignItems: 'center',
          justifyContent: 'center',
        },
        overlayNavIcon: { fontSize: 28, marginBottom: spacing.xs },
        countdownOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 20 },
        explosionWrap: { position: 'absolute', zIndex: 10, pointerEvents: 'none' },
        explosionCircle: { backgroundColor: colors.danger, borderRadius: 999, opacity: 0.8 },
      }),
    [colors, insets.top]
  );

  if (!dimensions) {
    return <View style={[styles.container, { width: screenWidth, height: screenHeight }]} />;
  }

  const { width, height, laneCenterX: laneCenters } = dimensions;

  return (
    <TouchableWithoutFeedback onPress={handlePress}>
      <View style={[styles.container, { width: screenWidth, height: screenHeight }]}>
        {/* Game area */}
        <View style={[styles.gameArea, { width, height }]}>
          <View style={styles.lanes}>
            <View style={[styles.lane, { width: width / 2 }]} />
            <View style={[styles.lane, { width: width / 2 }]} />
          </View>

          {obstacles.map((obs) => (
            <View
              key={obs.id}
              style={[
                styles.obstacle,
                { left: obs.x, top: obs.y, width: OBSTACLE_WIDTH, height: OBSTACLE_HEIGHT },
              ]}
            />
          ))}

          {coins.map((coin) => (
            <View
              key={coin.id}
              style={[
                styles.coin,
                { left: coin.x, top: coin.y, width: COIN_WIDTH, height: COIN_HEIGHT, borderRadius: COIN_WIDTH / 2 },
              ]}
            />
          ))}

          {player && (
            <View
              style={[
                styles.playerWrap,
                {
                  left: laneCenters[player.lane] - PLAYER_RADIUS,
                  top: player.centerY - PLAYER_RADIUS,
                  width: PLAYER_RADIUS * 2,
                  height: PLAYER_RADIUS * 2,
                },
              ]}
            >
              {skinVisual.pulse && (
                <Animated.View
                  style={[
                    styles.playerPulse,
                    {
                      width: PLAYER_RADIUS * 2,
                      height: PLAYER_RADIUS * 2,
                      borderRadius: PLAYER_RADIUS,
                      backgroundColor: isDark
                        ? (skinVisual.edge ?? skinVisual.base)
                        : colors.primary,
                    },
                    pulseAnimatedStyle,
                  ]}
                />
              )}
              <Animated.View
                style={[
                  styles.playerBody,
                  {
                    width: PLAYER_RADIUS * 2,
                    height: PLAYER_RADIUS * 2,
                    borderRadius: PLAYER_RADIUS,
                    backgroundColor: skinVisual.base,
                    borderColor: skinVisual.edge ?? colors.text,
                  },
                  playerAnimatedStyle,
                ]}
              >
                {skinVisual.shadow && (
                  <View style={[styles.playerShadow, { backgroundColor: skinVisual.shadow }]} />
                )}
                {skinVisual.highlight && (
                  <View
                    style={[styles.playerHighlight, { backgroundColor: skinVisual.highlight }]}
                  />
                )}
                {skinVisual.edge && (
                  <View style={[styles.playerRing, { borderColor: skinVisual.edge }]} />
                )}
              </Animated.View>
            </View>
          )}
        </View>

        <HUD
          score={score}
          best={highScore}
          coinsThisRun={coinsThisRun}
          shieldMeter={shieldMeter}
          nearMissFlash={nearMissFlash}
        />

        {(phase === 'playing' || (scoreMultiplier > 1 || coinMultiplierActive)) && (
          <View style={styles.topBarRow} pointerEvents="box-none">
            <View style={styles.topBarLeft} pointerEvents="none">
              {(scoreMultiplier > 1 || coinMultiplierActive) && (
                <View style={styles.multiplierWrap}>
                  {scoreMultiplier > 1 && (
                    <View style={[styles.multiplierBadge, { backgroundColor: colors.primary }]}>
                      <Text variant="bodySmall" style={{ color: colors.onPrimary, fontWeight: '700' }}>{scoreMultiplier}x</Text>
                    </View>
                  )}
                  {coinMultiplierActive && (
                    <View style={[styles.multiplierBadge, { backgroundColor: colors.success }]}>
                      <Text variant="bodySmall" style={{ color: colors.onPrimary, fontWeight: '700' }}>2x coins!</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
            <View style={styles.topBarCenter} pointerEvents="none" />
            {phase === 'playing' && (
              <PressableScale style={styles.pauseBtn} onPress={pause}>
                <Text variant="h4" color="muted">II</Text>
              </PressableScale>
            )}
          </View>
        )}

        {/* Collision explosion (game over) */}
        {phase === 'game_over' && player && (
          <CollisionExplosion
            x={laneCenters[player.lane]}
            y={player.centerY}
            color={colors.danger}
          />
        )}

        {/* Countdown overlay (3, 2, 1, Go!) */}
        {countdownStep !== null && (
          <View style={styles.countdownOverlay} pointerEvents="box-only">
            <Text variant="h1" color="primary" style={{ fontSize: 72 }}>
              {countdownStep === 'go' ? t('game.countdownGo') : String(countdownStep)}
            </Text>
          </View>
        )}

        {/* Pause overlay — hidden during countdown so countdown is shown on game view */}
        {phase === 'paused' && countdownStep === null && (
          <Animated.View
            style={styles.overlay}
            entering={FadeIn.duration(180)}
            exiting={FadeOut.duration(150)}
          >
            <Card variant="elevated" style={styles.overlayCard}>
              <View style={styles.overlayContent}>
                <Text variant="h2" style={{ textTransform: 'uppercase', marginBottom: spacing.xs, textAlign: 'center' }}>
                  {t('game.paused')}
                </Text>
                <View style={styles.overlayTitleUnderline} />
                <View style={styles.btnRow}>
                  <Button
                    title={t('common.resume')}
                    onPress={() => startCountdown(resume)}
                    variant="primary"
                    size="medium"
                    icon="▶"
                    fullWidth
                    style={{ marginBottom: spacing.md }}
                  />
                  <Button
                    title={t('common.restart')}
                    onPress={() => {
                      restartFromPause();
                      startCountdown(startGame);
                    }}
                    variant="secondary"
                    size="medium"
                    icon="↻"
                    fullWidth
                    style={{ marginBottom: spacing.md }}
                  />
                  <Button
                    title={t('common.quit')}
                    onPress={quitFromPause}
                    variant="danger"
                    size="medium"
                    icon="→"
                    fullWidth
                  />
                </View>
              </View>
            </Card>
          </Animated.View>
        )}

        {/* Idle overlay — tap to start, Home / Skins / Settings */}
        {phase === 'idle' && countdownStep === null && (
          <Animated.View
            style={styles.overlay}
            entering={FadeIn.duration(220)}
            exiting={FadeOut.duration(180)}
          >
            <Card variant="elevated" style={styles.overlayCard}>
              <View style={styles.overlayContent}>
                <Text variant="h2" style={{ textTransform: 'uppercase', marginBottom: spacing.xs, textAlign: 'center' }}>
                  {t('home.title')}
                </Text>
                <View style={styles.overlayTitleUnderline} />
                <View style={styles.btnRow}>
                  <Button
                    title={t('game.tapToStart')}
                    onPress={() => startCountdown(startGame)}
                    variant="primary"
                    size="medium"
                    icon="▶"
                    fullWidth
                    style={{ marginBottom: spacing.md }}
                  />
                  <View style={styles.overlayDivider} />
                  <View style={styles.overlayNavRow}>
                    <PressableScale style={styles.overlayNavBtn} onPress={handleHome}>
                      <Text variant="h3" style={styles.overlayNavIcon}>🏠</Text>
                    </PressableScale>
                    <PressableScale style={styles.overlayNavBtn} onPress={handleSkins}>
                      <Text variant="h3" style={styles.overlayNavIcon}>👤</Text>
                    </PressableScale>
                    <PressableScale style={styles.overlayNavBtn} onPress={handleSettings}>
                      <Text variant="h3" style={styles.overlayNavIcon}>⚙</Text>
                    </PressableScale>
                  </View>
                </View>
              </View>
            </Card>
          </Animated.View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}

function CollisionExplosion({ x, y, color }: { x: number; y: number; color: string }) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0.9);

  useEffect(() => {
    scale.value = withSequence(
      withTiming(2.5, { duration: 350, easing: Easing.out(Easing.cubic) }),
      withTiming(3, { duration: 150 })
    );
    opacity.value = withDelay(200, withTiming(0, { duration: 300 }));
  }, [scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x - 50 }, { translateY: y - 50 }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: 0,
          top: 0,
          width: 100,
          height: 100,
          borderRadius: 50,
          backgroundColor: color,
          pointerEvents: 'none',
          zIndex: 10,
        },
        animatedStyle,
      ]}
    />
  );
}
