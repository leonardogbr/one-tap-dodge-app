/**
 * Game loop hook — runs tick in requestAnimationFrame, exposes state and actions.
 * Phase 2: syncs with store (high score, coins, shield).
 */

import { useCallback, useRef, useState, useEffect } from 'react';
import type { Player, Obstacle, Coin } from '../engine/types';
import {
  tick,
  createInitialPlayer,
  swapPlayerLane,
  removeObstacleById,
  setReviveGrace,
  type GameLoopState,
} from '../engine/gameLoop';
import { COIN_TO_SHIELD, MAX_REVIVES_PER_RUN } from '../engine/constants';
import { useGameStore } from '../state/store';
import { triggerHaptic } from '../services/haptics';

export interface GameLoopDimensions {
  width: number;
  height: number;
  laneCenterX: [number, number];
}

export function useGameLoop(dimensions: GameLoopDimensions | null) {
  const [phase, setPhase] = useState<'idle' | 'playing' | 'paused' | 'game_over'>('idle');
  const [score, setScore] = useState(0);
  const [player, setPlayer] = useState<Player | null>(null);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [coins, setCoins] = useState<Coin[]>([]);
  const [nearMissFlash, setNearMissFlash] = useState(false);
  const [coinMultiplierActive, setCoinMultiplierActive] = useState(false);
  const [laneSwapTick, setLaneSwapTick] = useState(0);

  const stateRef = useRef<GameLoopState | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const lastCollidedObstacleIdRef = useRef<string | null>(null);
  /** Lane chosen in resetForCountdown; startGame reuses it so the player does not jump after countdown. */
  const pendingInitialLaneRef = useRef<0 | 1 | null>(null);

  const {
    setScore: setStoreScore,
    addCoinsThisRun,
    setShieldMeter,
    consumeShield,
    endRun,
    startRun: storeStartRun,
    setCanRevive,
    incrementRevivesUsedThisRun,
    highScore,
  } = useGameStore();

  /**
   * Reset visuals for countdown (empty board, initial player). Loop does not run (phase 'paused').
   * Call when starting countdown for a new game so the old game is not visible underneath.
   */
  const resetForCountdown = useCallback(() => {
    if (!dimensions) return;
    const initialPlayer = createInitialPlayer(dimensions.height);
    pendingInitialLaneRef.current = initialPlayer.lane;
    const state: GameLoopState = {
      phase: 'paused',
      player: initialPlayer,
      obstacles: [],
      coins: [],
      score: 0,
      accumulatedScoreMs: 0,
      lastSpawnTime: 0,
      lastSpawnLane: null,
      consecutiveSpawnsInSameLane: 0,
      lastCoinSpawnTime: 0,
      obstacleSpeed: 280,
      gameTimeMs: 0,
      laneCenterX: dimensions.laneCenterX,
      screenHeight: dimensions.height,
      nearMissStreak: 0,
      coinMultiplierActiveUntil: 0,
      reviveGraceUntil: 0,
    };
    stateRef.current = state;
    setPhase('paused');
    setScore(0);
    setObstacles([]);
    setCoins([]);
    setPlayer({ ...initialPlayer });
  }, [dimensions]);

  const startGame = useCallback(() => {
    if (!dimensions) return;
    storeStartRun();
    const lane = pendingInitialLaneRef.current;
    if (lane !== null) pendingInitialLaneRef.current = null;
    const state: GameLoopState = {
      phase: 'playing',
      player: createInitialPlayer(dimensions.height, lane ?? undefined),
      obstacles: [],
      coins: [],
      score: 0,
      accumulatedScoreMs: 0,
      lastSpawnTime: 0,
      lastSpawnLane: null,
      consecutiveSpawnsInSameLane: 0,
      lastCoinSpawnTime: 0,
      obstacleSpeed: 280,
      gameTimeMs: 0,
      laneCenterX: dimensions.laneCenterX,
      screenHeight: dimensions.height,
      nearMissStreak: 0,
      coinMultiplierActiveUntil: 0,
      reviveGraceUntil: 0,
    };
    stateRef.current = state;
    state.lastCoinSpawnTime = Date.now();
    setPhase('playing');
    setScore(0);
    setPlayer({ ...state.player });
    setObstacles([]);
    setCoins([]);
    lastTimeRef.current = Date.now();
  }, [dimensions, storeStartRun]);

  const swapLane = useCallback(() => {
    if (stateRef.current?.phase === 'playing') {
      swapPlayerLane(stateRef.current);
      setPlayer((p) => (p ? { ...stateRef.current!.player } : null));
      setLaneSwapTick((t) => t + 1);
      triggerHaptic('swap');
    }
  }, []);

  const pause = useCallback(() => {
    const state = stateRef.current;
    if (!state || state.phase !== 'playing') return;
    state.phase = 'paused';
    setPhase('paused');
  }, []);

  const resume = useCallback(() => {
    const state = stateRef.current;
    if (!state || state.phase !== 'paused') return;
    state.phase = 'playing';
    setPhase('playing');
    lastTimeRef.current = Date.now();
  }, []);

  const quitFromPause = useCallback(() => {
    const state = stateRef.current;
    if (!state || state.phase !== 'paused') return;
    endRun();
    state.phase = 'game_over';
    setPhase('game_over');
  }, [endRun]);

  const revive = useCallback(() => {
    const state = stateRef.current;
    const id = lastCollidedObstacleIdRef.current;
    if (!state || state.phase !== 'game_over' || !id) return;
    lastCollidedObstacleIdRef.current = null;
    removeObstacleById(state, id);
    // Clear all obstacles and pause spawn for 2s so the user can reorient after the ad
    setReviveGrace(state, Date.now() + 2000);
    state.phase = 'playing';
    incrementRevivesUsedThisRun();
    setPhase('playing');
    setObstacles([...state.obstacles]);
    setCoins([...state.coins]);
    setPlayer({ ...state.player });
    lastTimeRef.current = Date.now();
  }, [incrementRevivesUsedThisRun]);

  useEffect(() => {
    if (!dimensions || phase !== 'playing' || !stateRef.current) return;

    const loop = () => {
      const state = stateRef.current;
      if (!state || state.phase !== 'playing') return; // also stops when paused

      const nowMs = Date.now();
      const deltaMs = nowMs - lastTimeRef.current;
      lastTimeRef.current = nowMs;

      const result = tick(state, deltaMs, nowMs);

      setStoreScore(state.score);
      setScore(state.score);
      setPlayer({ ...state.player });
      setObstacles([...state.obstacles]);
      setCoins([...state.coins]);

      if (result.coinsCollected > 0) {
        addCoinsThisRun(result.coinsCollected);
        const currentShield = useGameStore.getState().shieldMeter;
        setShieldMeter(currentShield + result.coinsCollected * COIN_TO_SHIELD);
        triggerHaptic('coin');
      }

      if (result.obstaclePassedWithoutNearMiss) {
        state.nearMissStreak = 0;
      }
      if (result.nearMissIds.length > 0) {
        triggerHaptic('nearMiss');
        setNearMissFlash(true);
        setTimeout(() => setNearMissFlash(false), 900);
        if (nowMs >= state.coinMultiplierActiveUntil) {
          state.nearMissStreak += result.nearMissIds.length;
          if (state.nearMissStreak >= 5) {
            state.coinMultiplierActiveUntil = nowMs + 10000;
            state.nearMissStreak = 0;
          }
        }
      }
      setCoinMultiplierActive(
        state.coinMultiplierActiveUntil > 0 && nowMs < state.coinMultiplierActiveUntil
      );

      if (result.collided) {
        state.nearMissStreak = 0;
        const consumed = consumeShield();
        if (consumed && result.collidedObstacleId) {
          removeObstacleById(state, result.collidedObstacleId);
          setObstacles([...state.obstacles]);
        } else {
          lastCollidedObstacleIdRef.current = result.collidedObstacleId;
          endRun();
          setCanRevive(
            useGameStore.getState().revivesUsedThisRun < MAX_REVIVES_PER_RUN
          );
          triggerHaptic('gameOver');
          setPhase('game_over');
          return;
        }
      } else if (result.phase === 'game_over') {
        lastCollidedObstacleIdRef.current = result.collidedObstacleId;
        endRun();
        setCanRevive(
          useGameStore.getState().revivesUsedThisRun < MAX_REVIVES_PER_RUN
        );
        triggerHaptic('gameOver');
        setPhase('game_over');
        return;
      }

      rafIdRef.current = requestAnimationFrame(loop);
    };

    rafIdRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafIdRef.current != null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [dimensions, phase]);

  return {
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
  };
}
