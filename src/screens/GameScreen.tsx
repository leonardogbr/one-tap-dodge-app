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
  const countdownCallbackRef = useRef<() => void>(() => {});

  const coinsThisRun = useGameStore((s) => s.coinsThisRun);
  const nearMissesThisRun = useGameStore((s) => s.nearMissesThisRun);
  const shieldMeter = useGameStore((s) => s.shieldMeter);
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
  useEffect(() => {
    if (phase !== 'game_over') return;
    const tId = setTimeout(() => {
      navigation.push('GameOver', {
        score,
        isNewBest: score >= highScore,
        runTimeMs,
        nearMisses: nearMissesThisRun,
        coins: coinsThisRun,
        canRevive,
      });
    }, 1200);
    return () => clearTimeout(tId);
  }, [phase, score, highScore, runTimeMs, nearMissesThisRun, coinsThisRun, canRevive, navigation]);

  // When returning from GameOver after earning revive from ad, trigger revive.
  useFocusEffect(
    useCallback(() => {
      if (!reviveEarnedFromAd) return;
      setReviveEarnedFromAd(false);
      revive();
    }, [reviveEarnedFromAd, setReviveEarnedFromAd, revive])
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
        overlay: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: 'rgba(0,0,0,0.7)',
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: spacing.xl,
        },
        overlayCard: {
          backgroundColor: colors.backgroundLight,
          borderRadius: 24,
          paddingVertical: spacing.xl,
          paddingHorizontal: spacing.xl * 1.5,
          minWidth: 280,
          maxWidth: 340,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.4,
          shadowRadius: 24,
          elevation: 12,
        },
        overlayContent: { alignItems: 'center', width: '100%' },
        overlayTitle: {
          fontSize: 28,
          fontWeight: '700',
          color: colors.text,
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginBottom: spacing.xs,
          textAlign: 'center',
        },
        overlayTitleUnderline: {
          width: 56,
          height: 3,
          borderRadius: 2,
          backgroundColor: colors.primary,
          marginBottom: spacing.xl,
        },
        overlayScore: { fontSize: 20, color: colors.primary, marginBottom: spacing.md, textAlign: 'center' },
        overlayBtnPrimary: {
          alignSelf: 'stretch',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.sm,
          backgroundColor: colors.primary,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.xl * 1.5,
          borderRadius: 999,
          marginBottom: spacing.sm,
        },
        overlayBtnPrimaryDisabled: { opacity: 0.5 },
        overlayBtnSecondary: {
          alignSelf: 'stretch',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.sm,
          backgroundColor: colors.backgroundLight,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.xl * 1.5,
          borderRadius: 999,
          marginBottom: spacing.sm,
        },
        overlayBtnDanger: {
          alignSelf: 'stretch',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.sm,
          backgroundColor: colors.backgroundLight,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.xl * 1.5,
          borderRadius: 999,
          marginTop: spacing.xs,
        },
        overlayBtnIcon: { fontSize: 16 },
        overlayBtnText: { fontSize: 17, fontWeight: '700', color: '#fff', textAlign: 'center' },
        overlayBtnDangerIcon: { fontSize: 16, color: colors.danger },
        overlayBtnDangerText: { fontSize: 17, fontWeight: '700', color: colors.text, textAlign: 'center' },
        overlayReviveBtn: {
          alignSelf: 'stretch',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.sm,
          backgroundColor: colors.success,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.xl,
          borderRadius: 999,
          marginBottom: spacing.sm,
        },
        overlayReviveBtnDisabled: { opacity: 0.7 },
        overlayReviveBtnText: { fontSize: 16, fontWeight: '700', color: colors.background, textAlign: 'center' },
        overlayDivider: {
          width: '100%',
          height: 1,
          backgroundColor: colors.primaryDim,
          marginTop: spacing.xl,
          marginBottom: spacing.lg,
        },
        overlayBottomRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flexWrap: 'wrap', justifyContent: 'center' },
        overlaySecondaryLink: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, alignItems: 'center' },
        overlaySecondaryLinkText: { fontSize: 15, fontWeight: '600', color: colors.textMuted, textAlign: 'center' },
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
        {phase === 'paused' && countdownStep === null && (
          <Animated.View
            style={styles.overlay}
            entering={FadeIn.duration(180)}
            exiting={FadeOut.duration(150)}
          >
            <View style={styles.overlayCard}>
              <View style={styles.overlayContent}>
                <Text style={styles.overlayTitle}>{t('game.paused')}</Text>
                <View style={styles.overlayTitleUnderline} />
                <PressableScale style={styles.overlayBtnPrimary} onPress={() => startCountdown(resume)}>
                  <Text style={styles.overlayBtnIcon}>▶</Text>
                  <Text style={styles.overlayBtnText}>{t('common.resume')}</Text>
                </PressableScale>
                <PressableScale
                  style={styles.overlayBtnSecondary}
                  onPress={() => {
                    restartFromPause();
                    startCountdown(startGame);
                  }}
                >
                  <Text style={styles.overlayBtnIcon}>↻</Text>
                  <Text style={styles.overlayBtnText}>{t('common.restart')}</Text>
                </PressableScale>
                <PressableScale style={styles.overlayBtnDanger} onPress={quitFromPause}>
                  <Text style={styles.overlayBtnDangerIcon}>→</Text>
                  <Text style={styles.overlayBtnDangerText}>{t('common.quit')}</Text>
                </PressableScale>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Idle overlay — tap to start, Home / Skins / Settings */}
        {phase === 'idle' && countdownStep === null && (
          <Animated.View
            style={styles.overlay}
            entering={FadeIn.duration(220)}
            exiting={FadeOut.duration(180)}
          >
            <View style={styles.overlayCard}>
              <View style={styles.overlayContent}>
                <Text style={styles.overlayTitle}>{t('home.title')}</Text>
                <View style={styles.overlayTitleUnderline} />
                <PressableScale
                  style={styles.overlayBtnPrimary}
                  onPress={() => startCountdown(startGame)}
                >
                  <Text style={styles.overlayBtnIcon}>▶</Text>
                  <Text style={styles.overlayBtnText}>{t('game.tapToStart')}</Text>
                </PressableScale>
                <View style={styles.overlayDivider} />
                <View style={styles.overlayBottomRow}>
                  <PressableScale style={styles.overlaySecondaryLink} onPress={handleHome}>
                    <Text style={styles.overlaySecondaryLinkText}>{t('common.home')}</Text>
                  </PressableScale>
                  <PressableScale style={styles.overlaySecondaryLink} onPress={handleSkins}>
                    <Text style={styles.overlaySecondaryLinkText}>{t('home.skins')}</Text>
                  </PressableScale>
                  <PressableScale style={styles.overlaySecondaryLink} onPress={handleSettings}>
                    <Text style={styles.overlaySecondaryLinkText}>{t('common.settings')}</Text>
                  </PressableScale>
                </View>
              </View>
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
