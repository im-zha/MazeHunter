// ============================================================
// types.ts — Shared interfaces and enums for Maze Hunter
// ============================================================

// --------------- Enums ---------------

export enum CellType {
  WALL = 0,
  FLOOR = 1,
  MUD = 2,
  ICE = 3,
  EXIT = 4,
  CRYSTAL = 5,
  FREEZE_CLOCK = 6,
  BOMB_PICKUP = 7,
}

export enum AlgoType {
  BFS = 'BFS',
  DIJKSTRA = 'DIJKSTRA',
  ASTAR = 'ASTAR',
  DFS = 'DFS',
}

export enum GamePhase {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER',
  WIN = 'WIN',
}

export enum Direction {
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

export enum EnemyMode {
  PURSUE = 'PURSUE',
  FLEE = 'FLEE',
}

// --------------- Primitives ---------------

export interface Pos {
  row: number;
  col: number;
}

// --------------- Grid ---------------

export type Grid = CellType[][];

// --------------- Algorithm Result ---------------

export interface AlgoResult {
  /** Ordered path from start to goal (inclusive). Empty if no path found. */
  path: Pos[];
  /** All positions visited/expanded during the search (for debug overlay). */
  visited: Pos[];
  /** Time taken to compute, in milliseconds. */
  computeMs: number;
}

// --------------- Entities ---------------

export interface PlayerState {
  pos: Pos;
  fogRadius: number;        // default 4, becomes 6 when crystal active
  powerUpTimer: number;     // ms remaining on current power-up (0 = none)
  wallBombs: number;        // max 3
  isSliding: boolean;       // true when sliding on ICE
  slideDir: Direction | null;
  freezeTimer: number;      // ms remaining on freeze clock (0 = none)
}

export interface EnemyState {
  id: string;
  pos: Pos;
  algoType: AlgoType;
  mode: EnemyMode;
  /** Cached path (next steps to take). Re-used until invalidated. */
  pathCache: Pos[];
  /** Cached visited list from last pathfind (for debug overlay). */
  visitedCache: Pos[];
  /** ms elapsed since this enemy last moved one step. */
  stepTimer: number;
  /** ms between steps (lower = faster). */
  stepInterval: number;
  /** Stats from last pathfinding call (for AlgorithmPanel). */
  lastAlgoResult: AlgoResult | null;
}

// --------------- Game State ---------------

export interface GameState {
  phase: GamePhase;
  score: number;
  wave: number;
  lives: number;
  timeElapsedMs: number;
  player: PlayerState;
  enemies: EnemyState[];
  grid: Grid;
  /** Whether fog of war is enabled */
  fogEnabled: boolean;
  /** Whether the debug overlay is currently active. */
  debugMode: boolean;
}

// --------------- Settings ---------------

export type Difficulty = 'easy' | 'normal' | 'hard';

export interface Settings {
  tileSize: number;
  fpsCap: number;
  difficulty: Difficulty;
  gridRows: number;
  gridCols: number;
  fogEnabled: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  tileSize: 32,
  fpsCap: 60,
  difficulty: 'normal',
  gridRows: 21,
  gridCols: 21,
  fogEnabled: true,
};
