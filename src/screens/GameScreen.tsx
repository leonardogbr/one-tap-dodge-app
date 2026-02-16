/**
 * Game screen — tap to swap lanes, player + obstacles, HUD. Phase 4: countdown, game over delay, explosion.
 */

import React, { useCallback, useState, useRef, useEffect, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  useWindowDimensions,
  ActivityIndicator,
  BackHandler,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useGameLoop, type GameLoopDimensions } from '../hooks/useGameLoop';
import { useGameStore, SKIN_VISUALS } from '../state/store';
import { HUD } from '../components/overlays/HUD';
import { PressableScale } from '../components/PressableScale';
import { isRewardedLoaded, showRewarded, showInterstitial } from '../services/ads';
import { useTheme } from '../hooks/useTheme';
import { spacing } from '../theme';
import {
  PLAYER_RADIUS,
  OBSTACLE_WIDTH,
  OBSTACLE_HEIGHT,
  COIN_WIDTH,
  COIN_HEIGHT,
  INTERSTITIAL_AFTER_GAME_OVERS,
  GAME_OVER_PLAY_AGAIN_DELAY_MS,
  COUNTDOWN_STEP_MS,
} from '../engine/constants';

type CountdownStep = 3 | 2 | 1 | 'go' | null;

export function GameScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
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
    resetForCountdown,
    startGame,
    swapLane,
    pause,
    resume,
    quitFromPause,
    revive,
  } = useGameLoop(dimensions);

  const playerScale = useSharedValue(1);
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0);
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
  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const [reviveLoading, setReviveLoading] = useState(false);
  const [countdownStep, setCountdownStep] = useState<CountdownStep>(null);
  const [waitingForAd, setWaitingForAd] = useState(false);
  const [playAgainEnabled, setPlayAgainEnabled] = useState(false);
  const [playAgainCountdown, setPlayAgainCountdown] = useState(0);
  const gameOverAtRef = useRef<number>(0);
  const countdownCallbackRef = useRef<() => void>(() => {});
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  /** Never show interstitial right after rewarded (avoid ad stacking). */
  const lastRewardedClosedAtRef = useRef<number>(0);
  const REWARDED_TO_INTERSTITIAL_COOLDOWN_MS = 3000;

  const coinsThisRun = useGameStore((s) => s.coinsThisRun);
  const shieldMeter = useGameStore((s) => s.shieldMeter);
  const scoreMultiplier = useGameStore((s) => s.scoreMultiplier);
  const canRevive = useGameStore((s) => s.canRevive);
  const gameOversSinceLastInterstitial = useGameStore(
    (s) => s.gameOversSinceLastInterstitial
  );
  const resetGameOversSinceLastInterstitial = useGameStore(
    (s) => s.resetGameOversSinceLastInterstitial
  );
  const equippedSkinId = useGameStore((s) => s.equippedSkinId);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Game'>>();
  const skinVisual = SKIN_VISUALS[equippedSkinId] ?? SKIN_VISUALS.classic;

  useEffect(() => {
    if (skinVisual.pulse) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.55, { duration: 900, easing: Easing.out(Easing.quad) }),
          withTiming(1, { duration: 900, easing: Easing.in(Easing.quad) })
        ),
        -1,
        false
      );
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 350, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 650, easing: Easing.in(Easing.quad) })
        ),
        -1,
        false
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 150 });
      pulseOpacity.value = withTiming(0, { duration: 150 });
    }
  }, [skinVisual.pulse, pulseScale, pulseOpacity]);

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

  // useLayoutEffect so playAgainEnabled is false before any tap in the same frame can be processed (avoids tap-at-collision restart).
  useLayoutEffect(() => {
    if (phase === 'game_over') {
      gameOverAtRef.current = Date.now();
      setPlayAgainEnabled(false);
      setPlayAgainCountdown(Math.ceil(GAME_OVER_PLAY_AGAIN_DELAY_MS / 1000));
      const tId = setTimeout(
        () => setPlayAgainEnabled(true),
        GAME_OVER_PLAY_AGAIN_DELAY_MS
      );
      const interval = setInterval(() => {
        setPlayAgainCountdown((prev) => Math.max(0, prev - 1));
      }, 1000);
      return () => {
        clearTimeout(tId);
        clearInterval(interval);
      };
    }
  }, [phase]);

  /**
   * Start a new game. Shows interstitial first if counter >= X (no bypass via Home -> Play).
   * Never shows interstitial immediately after a rewarded ad (cooldown).
   */
  const handleStartNewGame = useCallback(async () => {
    const justClosedRewarded =
      Date.now() - lastRewardedClosedAtRef.current < REWARDED_TO_INTERSTITIAL_COOLDOWN_MS;
    if (
      !justClosedRewarded &&
      gameOversSinceLastInterstitial >= INTERSTITIAL_AFTER_GAME_OVERS
    ) {
      resetForCountdown();
      setWaitingForAd(true);
      await showInterstitial();
      setWaitingForAd(false);
      resetGameOversSinceLastInterstitial();
      startCountdown(startGame);
      return;
    }
    resetForCountdown();
    startCountdown(startGame);
  }, [
    startGame,
    startCountdown,
    resetForCountdown,
    gameOversSinceLastInterstitial,
    resetGameOversSinceLastInterstitial,
  ]);

  const handlePlayAgain = useCallback(async () => {
    if (phase !== 'game_over' || !playAgainEnabled) return;
    if (Date.now() - gameOverAtRef.current < GAME_OVER_PLAY_AGAIN_DELAY_MS) return;
    await handleStartNewGame();
  }, [phase, playAgainEnabled, handleStartNewGame]);

  const handleSkins = useCallback(() => {
    navigation.navigate('Skins');
  }, [navigation]);

  const handleSettings = useCallback(() => navigation.navigate('Settings'), [navigation]);
  const handleHome = useCallback(() => navigation.navigate('Home'), [navigation]);

  const handlePress = useCallback(() => {
    if (countdownStep !== null) return;
    if (phase === 'playing') swapLane();
    else if (phase === 'idle') handleStartNewGame();
    else if (phase === 'game_over') handlePlayAgain();
    else if (phase === 'paused') startCountdown(resume);
  }, [countdownStep, phase, swapLane, startCountdown, resume, handlePlayAgain, handleStartNewGame]);

  const handleRevive = useCallback(async () => {
    if (!canRevive || !isRewardedLoaded() || reviveLoading) return;
    setWaitingForAd(true);
    setReviveLoading(true);
    const earned = await showRewarded();
    setReviveLoading(false);
    setWaitingForAd(false);
    if (earned) {
      lastRewardedClosedAtRef.current = Date.now();
      startCountdown(revive);
    }
  }, [canRevive, reviveLoading, revive, startCountdown]);

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background, paddingTop: insets.top },
        gameArea: { position: 'absolute', left: 0, top: 0, overflow: 'hidden' },
        lanes: { flexDirection: 'row', flex: 1 },
        lane: { flex: 1, backgroundColor: colors.backgroundLight, borderRightWidth: 1, borderRightColor: colors.primaryDim },
        obstacle: { position: 'absolute', backgroundColor: colors.obstacle, opacity: 0.95, borderRadius: 8 },
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
        pauseBtn: { position: 'absolute', top: spacing.sm, right: spacing.lg, padding: spacing.sm, zIndex: 15 },
        pauseBtnText: { fontSize: 18, fontWeight: '700', color: colors.textMuted },
        overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
        overlayTitle: { fontSize: 28, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
        overlayScore: { fontSize: 20, color: colors.primary, marginBottom: spacing.md },
        overlayReviveBtn: { backgroundColor: colors.success, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: 12, marginBottom: spacing.sm, minWidth: 200, alignItems: 'center' },
        overlayReviveBtnDisabled: { opacity: 0.7 },
        overlayReviveBtnText: { fontSize: 16, fontWeight: '700', color: colors.background },
        overlayMainBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: 12, marginBottom: spacing.sm },
        overlayMainBtnDisabled: { opacity: 0.5 },
        overlayMainBtnText: { fontSize: 18, fontWeight: '700', color: colors.background },
        overlayBottomRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginTop: spacing.xs },
        overlaySkinsBtn: { paddingVertical: spacing.sm },
        overlaySettingsBtn: { paddingVertical: spacing.sm },
        overlayQuitBtn: { paddingVertical: spacing.sm, marginTop: spacing.xs },
        overlaySkinsBtnText: { fontSize: 16, color: colors.textMuted },
        countdownOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 20 },
        countdownText: { fontSize: 72, fontWeight: '800', color: colors.primary },
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
                      backgroundColor: skinVisual.edge ?? skinVisual.base,
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
          coinMultiplierActive={coinMultiplierActive}
          scoreMultiplier={scoreMultiplier}
        />

        {phase === 'playing' && (
          <PressableScale style={styles.pauseBtn} onPress={pause}>
            <Text style={styles.pauseBtnText}>II</Text>
          </PressableScale>
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
            <Text style={styles.countdownText}>
              {countdownStep === 'go' ? t('game.countdownGo') : String(countdownStep)}
            </Text>
          </View>
        )}

        {/* Pause overlay — hidden during countdown so countdown is shown on game view */}
        {phase === 'paused' && countdownStep === null && !waitingForAd && (
          <Animated.View
            style={styles.overlay}
            entering={FadeIn.duration(180)}
            exiting={FadeOut.duration(150)}
          >
            <Text style={styles.overlayTitle}>{t('game.paused')}</Text>
            <PressableScale style={styles.overlayMainBtn} onPress={() => startCountdown(resume)}>
              <Text style={styles.overlayMainBtnText}>{t('common.resume')}</Text>
            </PressableScale>
            <PressableScale style={styles.overlayQuitBtn} onPress={quitFromPause}>
              <Text style={styles.overlaySkinsBtnText}>{t('common.quit')}</Text>
            </PressableScale>
          </Animated.View>
        )}

        {/* Idle / Game Over overlay — hidden during countdown so countdown is shown on game view */}
        {(phase === 'idle' || phase === 'game_over') && countdownStep === null && !waitingForAd && (
          <Animated.View
            style={styles.overlay}
            entering={phase === 'game_over' ? FadeIn.duration(400).delay(300) : FadeIn.duration(220)}
            exiting={FadeOut.duration(180)}
          >
            <Text style={styles.overlayTitle}>
              {phase === 'idle' ? t('home.title') : t('game.gameOver')}
            </Text>
            {phase === 'game_over' && (
              <Text style={styles.overlayScore}>{t('game.score')}: {score}</Text>
            )}
            {phase === 'game_over' && canRevive && (
              <PressableScale
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
                    {isRewardedLoaded() ? t('game.watchAdToContinue') : t('game.loadingAd')}
                  </Text>
                )}
              </PressableScale>
            )}
            <PressableScale
              style={[styles.overlayMainBtn, phase === 'game_over' && !playAgainEnabled && styles.overlayMainBtnDisabled]}
              onPress={phase === 'idle' ? () => startCountdown(startGame) : handlePlayAgain}
              disabled={phase === 'game_over' && !playAgainEnabled}
            >
              <Text style={styles.overlayMainBtnText}>
                {phase === 'idle'
                  ? t('game.tapToStart')
                  : playAgainEnabled
                    ? t('game.playAgain')
                    : `${playAgainCountdown}…`}
              </Text>
            </PressableScale>
            <View style={styles.overlayBottomRow}>
              <PressableScale style={styles.overlaySkinsBtn} onPress={handleHome}>
                <Text style={styles.overlaySkinsBtnText}>{t('common.home')}</Text>
              </PressableScale>
              <PressableScale style={styles.overlaySkinsBtn} onPress={handleSkins}>
                <Text style={styles.overlaySkinsBtnText}>{t('home.skins')}</Text>
              </PressableScale>
              <PressableScale style={styles.overlaySettingsBtn} onPress={handleSettings}>
                <Text style={styles.overlaySkinsBtnText}>{t('common.settings')}</Text>
              </PressableScale>
            </View>
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
