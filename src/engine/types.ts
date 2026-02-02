/**
 * Engine types — pure data, no React.
 */

export type Lane = 0 | 1; // 0 = left, 1 = right

export interface Vec2 {
  x: number;
  y: number;
}

export interface Player {
  lane: Lane;
  centerY: number;
  radius: number;
}

export interface Obstacle {
  id: string;
  lane: Lane;
  x: number;
  /** Top edge Y (screen coords, Y increases downward). Bottom = y + height */
  y: number;
  width: number;
  height: number;
  /** Minimum distance to player while obstacle was above player (for near-miss) */
  minDistanceWhileAbove: number | undefined;
  nearMissAwarded: boolean;
}

export interface Coin {
  id: string;
  lane: Lane;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GameConfig {
  screenWidth: number;
  screenHeight: number;
  playerRadius: number;
  playerCenterY: number;
  laneWidth: number;
  baseObstacleSpeed: number;
  nearMissThreshold: number;
  spawnIntervalMs: number;
}

export type GamePhase = 'idle' | 'playing' | 'paused' | 'game_over';

export interface GameState {
  phase: GamePhase;
  score: number;
  obstacles: Obstacle[];
  player: Player;
  obstacleSpeed: number;
  lastSpawnTime: number;
  /** For difficulty: time or score-based scaling */
  gameTimeMs: number;
}
