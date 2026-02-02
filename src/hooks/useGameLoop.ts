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
  type GameLoopState,
} from '../engine/gameLoop';
import { COIN_TO_SHIELD } from '../engine/constants';
import { useGameStore } from '../state/store';

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

  const stateRef = useRef<GameLoopState | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const {
    setScore: setStoreScore,
    addCoinsThisRun,
    setShieldMeter,
    consumeShield,
    endRun,
    startRun: storeStartRun,
    highScore,
  } = useGameStore();

  const startGame = useCallback(() => {
    if (!dimensions) return;
    storeStartRun();
    const state: GameLoopState = {
      phase: 'playing',
      player: createInitialPlayer(dimensions.height),
      obstacles: [],
      coins: [],
      score: 0,
      accumulatedScoreMs: 0,
      lastSpawnTime: 0,
      lastCoinSpawnTime: 0,
      obstacleSpeed: 280,
      gameTimeMs: 0,
      laneCenterX: dimensions.laneCenterX,
      screenHeight: dimensions.height,
    };
    stateRef.current = state;
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
    }
  }, []);

  useEffect(() => {
    if (!dimensions || phase !== 'playing' || !stateRef.current) return;

    const loop = () => {
      const state = stateRef.current;
      if (!state || state.phase !== 'playing') return;

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
      }

      if (result.nearMissIds.length > 0) {
        setNearMissFlash(true);
        setTimeout(() => setNearMissFlash(false), 150);
      }

      if (result.collided) {
        const consumed = consumeShield();
        if (consumed && result.collidedObstacleId) {
          removeObstacleById(state, result.collidedObstacleId);
          setObstacles([...state.obstacles]);
          // keep playing
        } else {
          endRun();
          setPhase('game_over');
          return;
        }
      } else if (result.phase === 'game_over') {
        endRun();
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
    highScore,
    startGame,
    swapLane,
  };
}
