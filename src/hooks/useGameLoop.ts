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
import {
  getChallengesForGroup,
  getInitialProgressForGroup,
  getLifetimeValue,
  CHALLENGE_SCOPE,
} from '../engine/challenges';
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
  const [runTimeMs, setRunTimeMs] = useState(0);

  const stateRef = useRef<GameLoopState | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const lastCollidedObstacleIdRef = useRef<string | null>(null);
  /** Lane chosen in resetForCountdown; startGame reuses it so the player does not jump after countdown. */
  const pendingInitialLaneRef = useRef<0 | 1 | null>(null);
  /** Protection against double-click: track if critical actions are in progress */
  const isStartingGameRef = useRef(false);
  const isResettingRef = useRef(false);
  const isResumingRef = useRef(false);
  const isQuittingRef = useRef(false);
  const isRevivingRef = useRef(false);

  const {
    setScore: setStoreScore,
    addCoinsThisRun,
    addNearMissesThisRun,
    setShieldMeter,
    setCoinsThisRun,
    consumeShield,
    endRun,
    startRun: storeStartRun,
    setCanRevive,
    incrementRevivesUsedThisRun,
    highScore,
    addRunToLifetimeStats,
    updateChallengeProgress,
    setRewardAvailable,
  } = useGameStore();

  /**
   * Reset visuals for countdown (empty board, initial player). Loop does not run (phase 'paused').
   * Call when starting countdown for a new game so the old game is not visible underneath.
   */
  const resetForCountdown = useCallback(() => {
    if (!dimensions || isResettingRef.current) return;
    isResettingRef.current = true;
    try {
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
      // Reset coins and shield meter in store when resetting for countdown
      // This ensures they are zeroed when coming back from GameOver screen
      setCoinsThisRun(0);
      setShieldMeter(0);
    } finally {
      setTimeout(() => {
        isResettingRef.current = false;
      }, 500);
    }
  }, [dimensions, setCoinsThisRun, setShieldMeter]);

  const startGame = useCallback(() => {
    if (!dimensions || isStartingGameRef.current) return;
    isStartingGameRef.current = true;
    try {
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
    } finally {
      setTimeout(() => {
        isStartingGameRef.current = false;
      }, 500);
    }
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
    if (isResumingRef.current) return;
    const state = stateRef.current;
    if (!state || state.phase !== 'paused') return;
    isResumingRef.current = true;
    try {
      const now = Date.now();
      state.phase = 'playing';
      state.lastSpawnTime = now;
      state.lastCoinSpawnTime = now;
      setPhase('playing');
      lastTimeRef.current = now;
    } finally {
      setTimeout(() => {
        isResumingRef.current = false;
      }, 300);
    }
  }, []);

  const quitFromPause = useCallback(() => {
    if (isQuittingRef.current) return;
    const state = stateRef.current;
    if (!state || state.phase !== 'paused') return;
    isQuittingRef.current = true;
    try {
      endRun();
      state.phase = 'game_over';
      setPhase('game_over');
    } finally {
      setTimeout(() => {
        isQuittingRef.current = false;
      }, 500);
    }
  }, [endRun]);

  /** End current run and reset board so a new countdown can start (e.g. Restart from pause). */
  const restartFromPause = useCallback(() => {
    const state = stateRef.current;
    if (!state || state.phase !== 'paused') return;
    endRun();
    resetForCountdown();
  }, [endRun, resetForCountdown]);

  const revive = useCallback(() => {
    if (isRevivingRef.current) return;
    const state = stateRef.current;
    const id = lastCollidedObstacleIdRef.current;
    if (!state || state.phase !== 'game_over' || !id) return;
    isRevivingRef.current = true;
    try {
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
    } finally {
      setTimeout(() => {
        isRevivingRef.current = false;
      }, 500);
    }
  }, [incrementRevivesUsedThisRun]);

  useEffect(() => {
    if (!dimensions || phase !== 'playing' || !stateRef.current) return;

    const finishRunAndCheckChallenges = () => {
      const store = useGameStore.getState();
      const { coinsThisRun, score: runScore, nearMissesThisRun, challengeGroupIndex: groupIdx, challengeGroupBaseline } = store;
      addRunToLifetimeStats({ coins: coinsThisRun, score: runScore, nearMisses: nearMissesThisRun });
      let stateAfter = useGameStore.getState();
      const challenges = getChallengesForGroup(groupIdx);
      
      // Update cumulative challenges progress (calculate as difference from baseline)
      for (const ch of challenges) {
        if (CHALLENGE_SCOPE[ch.type] === 'cumulative') {
          const currentValue = getLifetimeValue(ch.type, stateAfter.lifetimeStats);
          const baselineValue = getLifetimeValue(ch.type, challengeGroupBaseline);
          const progress = Math.max(0, currentValue - baselineValue);
          updateChallengeProgress(ch.id, progress);
        }
      }
      
      stateAfter = useGameStore.getState();
      const progress = stateAfter.currentGroupProgress;
      
      // Helper to get current progress (for run challenges, use run values; for cumulative, use persisted progress)
      const getProgress = (ch: (typeof challenges)[0]): number => {
        if (CHALLENGE_SCOPE[ch.type] === 'run') {
          if (ch.type === 'coins_run') return stateAfter.coinsThisRun;
          if (ch.type === 'score_run') return stateAfter.score;
          if (ch.type === 'near_miss_run') return stateAfter.nearMissesThisRun;
          return 0;
        }
        // For cumulative, use persisted progress (already calculated as difference from baseline)
        return progress[ch.id] ?? 0;
      };
      
      // Persist run challenge progress when completed (so it doesn't reset on app restart)
      for (const ch of challenges) {
        if (CHALLENGE_SCOPE[ch.type] === 'run') {
          const currentProgress = getProgress(ch);
          if (currentProgress >= ch.target) {
            // Mark as completed by persisting the target value
            updateChallengeProgress(ch.id, ch.target);
          }
        }
      }
      
      stateAfter = useGameStore.getState();
      const finalProgress = stateAfter.currentGroupProgress;
      const getFinalProgress = (ch: (typeof challenges)[0]): number => {
        if (CHALLENGE_SCOPE[ch.type] === 'run') {
          // After persisting, use persisted value if available, otherwise use run value
          const persisted = finalProgress[ch.id];
          if (persisted !== undefined && persisted >= ch.target) {
            return persisted;
          }
          return getProgress(ch);
        }
        return finalProgress[ch.id] ?? 0;
      };
      
      const bothComplete = challenges.every((ch) => getFinalProgress(ch) >= ch.target);
      
      // Instead of automatically completing, mark reward as available
      if (bothComplete) {
        setRewardAvailable(true);
      }
      
      endRun();
    };

    const loop = () => {
      const state = stateRef.current;
      if (!state || state.phase !== 'playing') return; // also stops when paused

      const nowMs = Date.now();
      const deltaMs = nowMs - lastTimeRef.current;
      lastTimeRef.current = nowMs;

      const result = tick(state, deltaMs, nowMs);

      // Apply multiplier to score before storing (multiplier is part of the game logic)
      const currentMultiplier = useGameStore.getState().scoreMultiplier;
      const scoreWithMultiplier = Math.floor(result.score * currentMultiplier);
      setStoreScore(scoreWithMultiplier);
      setScore(scoreWithMultiplier);
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
        addNearMissesThisRun(result.nearMissIds.length);
        triggerHaptic('nearMiss');
        setNearMissFlash(true);
        setTimeout(() => setNearMissFlash(false), 900);
        if (nowMs >= state.coinMultiplierActiveUntil) {
          state.nearMissStreak += result.nearMissIds.length;
          if (state.nearMissStreak >= 5) {
            state.coinMultiplierActiveUntil = nowMs + 20000;
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
          finishRunAndCheckChallenges();
        setCanRevive(
          useGameStore.getState().revivesUsedThisRun < MAX_REVIVES_PER_RUN
        );
        triggerHaptic('gameOver');
        setRunTimeMs(stateRef.current?.gameTimeMs ?? 0);
        setPhase('game_over');
        return;
        }
      } else if (result.phase === 'game_over') {
        lastCollidedObstacleIdRef.current = result.collidedObstacleId;
        finishRunAndCheckChallenges();
        setCanRevive(
          useGameStore.getState().revivesUsedThisRun < MAX_REVIVES_PER_RUN
        );
        triggerHaptic('gameOver');
        setRunTimeMs(stateRef.current?.gameTimeMs ?? 0);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loop uses store.getState() and refs; deps intentionally minimal to avoid restarting loop
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
    runTimeMs,
    resetForCountdown,
    startGame,
    swapLane,
    pause,
    resume,
    quitFromPause,
    restartFromPause,
    revive,
  };
}
