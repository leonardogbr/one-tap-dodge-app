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
  withRepeat,
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
import { Text, Button, Card, Icon } from '../design-system';
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
    reviveCountdownPending,
    setReviveCountdownPending,
    resetForCountdown,
    startGame,
    swapLane,
    pause,
    resume,
    resumeFromRevive,
    quitFromPause,
    restartFromPause,
    revive,
  } = useGameLoop(dimensions);

  const playerScale = useSharedValue(1);
  /** Animated left position for smooth lane transition (px). Synced on phase change; animated on swap. */
  const playerLeft = useSharedValue(0);
  /** Coin pulse animation (design: breathing — scale 1→1.1→1, lung-like inhale/exhale) */
  const coinPulse = useSharedValue(1);
  const prevPhaseRef = useRef<string | null>(null);

  // Sync player position when game phase shows the player (idle, countdown, or playing), without animation.
  useEffect(() => {
    if (!dimensions || !player) return;
    const laneCenters = dimensions.laneCenterX;
    const targetLeft = laneCenters[player.lane] - PLAYER_RADIUS;
    const justEnteredPlayingOrPaused =
      (phase === 'playing' || phase === 'paused') &&
      prevPhaseRef.current !== phase;
    prevPhaseRef.current = phase;
    if (phase === 'idle' || justEnteredPlayingOrPaused) {
      playerLeft.value = targetLeft;
    }
  }, [dimensions, player, phase, playerLeft]);

  // On lane swap: only animate position (smooth transition). Scale pulse is countdown-only.
  useEffect(() => {
    if (!dimensions || !player || laneSwapTick <= 0) return;
    const laneCenters = dimensions.laneCenterX;
    const targetLeft = laneCenters[player.lane] - PLAYER_RADIUS;
    playerLeft.value = withTiming(targetLeft, {
      duration: 180,
      easing: Easing.out(Easing.cubic),
    });
  }, [laneSwapTick, dimensions, player, playerLeft]);

  useEffect(() => {
    if (phase === 'playing') {
      if (coins.length > 0) {
        coinPulse.value = withRepeat(
          withSequence(
            withTiming(1.1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
            withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          false
        );
      } else {
        coinPulse.value = withTiming(1, { duration: 200 });
      }
    }
  }, [phase, coins.length, coinPulse]);

  const coinPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: coinPulse.value }],
  }));

  const playerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: playerScale.value }],
  }));
  const playerPositionStyle = useAnimatedStyle(() => ({
    left: playerLeft.value,
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
  const totalCoins = useGameStore((s) => s.totalCoins);
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

  // Countdown drives the player scale pulse (in sync from when countdown appears).
  const runCountdownPulse = useCallback(() => {
    playerScale.value = withSequence(
      withTiming(1.15, { duration: 60, easing: Easing.out(Easing.cubic) }),
      withTiming(1, { duration: 90 })
    );
  }, [playerScale]);

  useEffect(() => {
    if (countdownStep === null) return;
    runCountdownPulse();
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
  }, [countdownStep, runCountdownPulse]);

  // When returning from ad (revive): show countdown like after pause, then resume with revive grace.
  // useLayoutEffect so countdown starts synchronously after revive() sets paused + reviveCountdownPending.
  useLayoutEffect(() => {
    if (phase === 'paused' && reviveCountdownPending) {
      setReviveCountdownPending(false);
      startCountdown(resumeFromRevive);
    }
  }, [phase, reviveCountdownPending, setReviveCountdownPending, resumeFromRevive]);

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
  // Revive when we have the flag and phase is game_over (avoids relying on hasNavigatedAwayRef if screen remounted).
  // If phase is idle (e.g. screen remounted), clear the flag so we don't get stuck.
  useFocusEffect(
    useCallback(() => {
      if (!reviveEarnedFromAd) {
        if (hasNavigatedAwayRef.current && phase === 'game_over') {
          hasNavigatedAwayRef.current = false;
          resetForCountdown();
          setCoinsThisRun(0);
          setShieldMeter(0);
        }
        return;
      }
      if (phase === 'idle') {
        setReviveEarnedFromAd(false);
        return;
      }
      if (phase === 'game_over') {
        hasNavigatedAwayRef.current = false;
        revive();
      }
    }, [phase, resetForCountdown, reviveEarnedFromAd, revive, setCoinsThisRun, setShieldMeter, setReviveEarnedFromAd])
  );

  // Reset coins and shield only when entering the screen with no run in progress (idle).
  // Do NOT zero when phase is 'paused': that would wipe run stats before quit and make
  // the Game Over cards show 0 for coins (and would break consistency with near misses / time).
  useFocusEffect(
    useCallback(() => {
      if (phase === 'idle') {
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
    () => {
      const isSmallScreen = screenWidth < 375;
      const isLargeScreen = screenWidth > 768;
      const previewSize = isSmallScreen ? 48 : isLargeScreen ? 64 : 56;
      
      return StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background, paddingTop: insets.top },
        gameArea: { position: 'absolute', left: 0, top: 0, overflow: 'hidden' },
        lanes: { flexDirection: 'row', flex: 1 },
        lane: { flex: 1, backgroundColor: colors.backgroundLight, borderRightWidth: 1, borderRightColor: colors.primaryDim },
        obstacle: { position: 'absolute', backgroundColor: colors.obstacle, opacity: 0.95, borderRadius: borderRadius.sm },
        coin: {
          position: 'absolute',
          backgroundColor: colors.coin,
          borderRadius: 999,
          borderWidth: 2,
          borderColor: 'rgba(255,255,255,0.35)',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'visible',
          shadowColor: colors.coin,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.7,
          shadowRadius: 8,
          elevation: 12,
        },
        coinSymbol: {
          color: colors.onCoin,
          fontWeight: '600',
          fontSize: COIN_WIDTH * 0.55,
        },
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
        multiplierWrap: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
        multiplierBadge: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.sm },
        shieldIconActive: {
          backgroundColor: colors.success + '1A',
          borderWidth: 1,
          borderColor: colors.success + '4D',
          borderRadius: borderRadius.sm,
          padding: spacing.xs,
        },
        overlay: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: 'rgba(0,0,0,0.7)',
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: spacing.md,
          zIndex: 25,
        },
        overlayCard: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: isSmallScreen ? spacing.lg : spacing.xl * 1.5,
          paddingHorizontal: isSmallScreen ? spacing.md : spacing.lg,
          maxWidth: isLargeScreen ? 400 : Math.min(360, screenWidth * 0.9),
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
        idleModalContent: { gap: isSmallScreen ? spacing.sm : spacing.md },
        idlePreviewAndStatsRow: {
          flexDirection: isSmallScreen ? 'column' : 'row',
          alignItems: isSmallScreen ? 'center' : 'center',
          gap: isSmallScreen ? spacing.sm : spacing.md,
          marginBottom: spacing.sm,
          width: '100%',
        },
        idlePlayerPreviewWrap: {
          width: previewSize,
          height: previewSize,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'visible',
        },
        idlePlayerPreviewPulse: {
          position: 'absolute',
          width: previewSize,
          height: previewSize,
          borderRadius: previewSize / 2,
        },
        idlePlayerPreviewBody: {
          position: 'absolute',
          width: previewSize,
          height: previewSize,
          borderRadius: previewSize / 2,
          borderWidth: 2,
          overflow: 'hidden',
        },
        idlePlayerPreviewHighlight: {
          position: 'absolute',
          top: -4,
          left: -4,
          width: '70%',
          height: '70%',
          borderRadius: 999,
          opacity: 0.7,
        },
        idlePlayerPreviewShadow: {
          position: 'absolute',
          bottom: -4,
          right: -4,
          width: '80%',
          height: '80%',
          borderRadius: 999,
          opacity: 0.5,
        },
        idlePlayerPreviewRing: {
          position: 'absolute',
          top: 1,
          left: 1,
          right: 1,
          bottom: 1,
          borderRadius: 999,
          borderWidth: 1,
          opacity: 0.9,
        },
        idleQuickStats: {
          flex: isSmallScreen ? 0 : 1,
          gap: spacing.xs,
          width: isSmallScreen ? '100%' : undefined,
          alignItems: isSmallScreen ? 'stretch' : undefined,
        },
        idleQuickStatRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: spacing.xs,
          minWidth: 0,
        },
        idleQuickStatLabel: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
        },
        countdownOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 20 },
        explosionWrap: { position: 'absolute', zIndex: 10, pointerEvents: 'none' },
        explosionCircle: { backgroundColor: colors.danger, borderRadius: 999, opacity: 0.8 },
      });
    },
    [colors, insets.top, screenWidth]
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
            <Animated.View
              key={coin.id}
              style={[
                styles.coin,
                coinPulseStyle,
                {
                  left: coin.x,
                  top: coin.y,
                  width: COIN_WIDTH,
                  height: COIN_HEIGHT,
                },
              ]}
            >
              <Text style={styles.coinSymbol}>$</Text>
            </Animated.View>
          ))}

          {player && (
            <Animated.View
              style={[
                styles.playerWrap,
                {
                  top: player.centerY - PLAYER_RADIUS,
                  width: PLAYER_RADIUS * 2,
                  height: PLAYER_RADIUS * 2,
                },
                playerPositionStyle,
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
            </Animated.View>
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

        {(phase === 'playing' || (phase === 'paused' && shieldMeter >= 1) || scoreMultiplier > 1) && (
          <View style={styles.topBarRow} pointerEvents="box-none">
            <View style={styles.topBarLeft} pointerEvents="none">
              {(scoreMultiplier > 1 || shieldMeter >= 1) && (
                <View style={styles.multiplierWrap}>
                  {scoreMultiplier > 1 && (
                    <View style={[styles.multiplierBadge, { backgroundColor: colors.primary }]}>
                      <Text variant="bodySmall" style={{ color: colors.onPrimary, fontWeight: '700' }}>{scoreMultiplier}x</Text>
                    </View>
                  )}
                  {shieldMeter >= 1 && (
                    <View style={styles.shieldIconActive}>
                      <Icon name="shield" size={18} color={colors.success} />
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

        {/* Pause overlay — hidden during countdown or when revive countdown is about to start */}
        {phase === 'paused' && countdownStep === null && !reviveCountdownPending && (
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
                    icon="play_arrow"
                    fullWidth
                    style={{ marginBottom: spacing.md }}
                  />
                  <Button
                    title={t('common.restart')}
                    onPress={() => {
                      restartFromPause();
                      startCountdown(startGame);
                    }}
                    variant="ghost"
                    size="medium"
                    icon="replay"
                    fullWidth
                    style={{ marginBottom: spacing.md }}
                  />
                  <Button
                    title={t('common.quit')}
                    onPress={quitFromPause}
                    variant="danger"
                    size="medium"
                    icon="exit_to_app"
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
                <Text variant="bodySmall" color="muted" style={{ textAlign: 'center', marginTop: spacing.xs, marginBottom: spacing.md }}>
                  {t('home.subtitle')}
                </Text>

                <View style={styles.idleModalContent}>
                  <View style={styles.idlePreviewAndStatsRow}>
                    <View style={styles.idlePlayerPreviewWrap}>
                      {skinVisual.pulse && (
                        <Animated.View
                          style={[
                            styles.idlePlayerPreviewPulse,
                            {
                              backgroundColor: isDark
                                ? (skinVisual.edge ?? skinVisual.base)
                                : colors.primary,
                            },
                            pulseAnimatedStyle,
                          ]}
                        />
                      )}
                      <View
                        style={[
                          styles.idlePlayerPreviewBody,
                          {
                            backgroundColor: skinVisual.base,
                            borderColor: skinVisual.edge ?? colors.text,
                          }]}
                      >
                        {skinVisual.shadow && (
                          <View style={[styles.idlePlayerPreviewShadow, { backgroundColor: skinVisual.shadow }]} />
                        )}
                        {skinVisual.highlight && (
                          <View
                            style={[styles.idlePlayerPreviewHighlight, { backgroundColor: skinVisual.highlight }]}
                          />
                        )}
                        {skinVisual.edge && (
                          <View style={[styles.idlePlayerPreviewRing, { borderColor: skinVisual.edge }]} />
                        )}
                      </View>
                    </View>

                    <View style={styles.idleQuickStats}>
                      <View style={styles.idleQuickStatRow}>
                        <View style={styles.idleQuickStatLabel}>
                          <Icon name="emoji_events" size={14} color={colors.textMuted} />
                          <Text variant="caption" color="muted">{t('home.bestScore')}</Text>
                        </View>
                        <Text variant="body" style={{ fontWeight: '700' }}>{highScore.toLocaleString()}</Text>
                      </View>
                      <View style={styles.idleQuickStatRow}>
                        <View style={styles.idleQuickStatLabel}>
                          <Icon name="monetization_on" size={14} color={colors.coin} />
                          <Text variant="caption" color="muted">{t('game.coins')}</Text>
                        </View>
                        <Text variant="body" style={{ fontWeight: '700' }}>{totalCoins.toLocaleString()}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.btnRow}>
                    <Button
                      title={t('game.tapToStart')}
                      onPress={() => startCountdown(startGame)}
                      variant="primary"
                      size="medium"
                      icon="play_arrow"
                      fullWidth
                      style={{ marginBottom: spacing.md }}
                    />
                    <View style={styles.overlayDivider} />
                    <View style={styles.overlayNavRow}>
                      <PressableScale style={styles.overlayNavBtn} onPress={handleHome}>
                        <Icon name="home" size={28} color={colors.text} style={styles.overlayNavIcon} />
                      </PressableScale>
                      <PressableScale style={styles.overlayNavBtn} onPress={handleSkins}>
                        <Icon name="checkroom" size={28} color={colors.text} style={styles.overlayNavIcon} />
                      </PressableScale>
                      <PressableScale style={styles.overlayNavBtn} onPress={handleSettings}>
                        <Icon name="settings" size={28} color={colors.text} style={styles.overlayNavIcon} />
                      </PressableScale>
                    </View>
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
    // Reset values before starting animation
    scale.value = 0;
    opacity.value = 0.9;
    
    // Start animation
    scale.value = withSequence(
      withTiming(2.5, { duration: 350, easing: Easing.out(Easing.cubic) }),
      withTiming(3, { duration: 150 })
    );
    opacity.value = withDelay(200, withTiming(0, { duration: 300 }));
    
    return () => {
      // Cleanup animations on unmount
      scale.value = 0;
      opacity.value = 0;
    };
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
