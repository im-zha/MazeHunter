// ============================================================
// wave-manager.ts — 3-Round demo enemy spawning
// ============================================================

import {
  AlgoType,
  EnemyTrait,
  type EnemyState,
  type Grid,
  type Pos,
} from '../core/types.js';
import { CellType } from '../core/types.js';
import {
  createEnemy,
  resetEnemyCounter,
  scaleEnemySpeed,
  baseIntervalForTrait,
} from '../entities/enemy.js';
import { findCells } from '../core/graph.js';

/** Interface đại diện cho WaveConfig. */
export interface WaveConfig {
  /** Thuộc tính wave. */
    wave: number;
  /** Thuộc tính enemies. */
    enemies: EnemyState[];
  /** Thuộc tính timeLimit. */
    timeLimit: number; // ms per wave (0 = no limit)
}

// --------------- Round configuration ---------------

/**
 * Enemy roster per round (wave maps directly to round 1-3).
 * Each entry is [AlgoType, EnemyTrait].
 */
const ROUND_ROSTERS: Array<Array<[AlgoType, EnemyTrait]>> = [
  // Round 1 — Introduction: Ghost (BFS) + Heavy (Dijkstra)
  [
    [AlgoType.BFS,      EnemyTrait.NONE],
    [AlgoType.DIJKSTRA, EnemyTrait.HEAVY],
  ],
  // Round 2 — Strategy: add Hunter + Shadow with traits
  [
    [AlgoType.BFS,      EnemyTrait.NONE],
    [AlgoType.DIJKSTRA, EnemyTrait.HEAVY],
    [AlgoType.ASTAR,    EnemyTrait.HUNTER],
    [AlgoType.DFS,      EnemyTrait.SCOUT],
  ],
  // Round 3 — Intense: all 4 + Climber + Burrower variants
  [
    [AlgoType.BFS,      EnemyTrait.FAST],
    [AlgoType.DIJKSTRA, EnemyTrait.HEAVY],
    [AlgoType.ASTAR,    EnemyTrait.HUNTER],
    [AlgoType.DFS,      EnemyTrait.SCOUT],
    [AlgoType.BFS,      EnemyTrait.CLIMBER],
    [AlgoType.DIJKSTRA, EnemyTrait.BURROWER],
  ],
];

// --------------- Spawn positions ---------------

/**
 * Picks enemy spawn positions far from the player (bottom-right quadrant first).
 */
function pickSpawnPositions(grid: Grid, count: number, playerPos: Pos): Pos[] {
  const rows = grid.length;
  const cols = grid[0].length;
  const floors: Pos[] = [];

  for (let r = Math.floor(rows / 2); r < rows; r++) {
    for (let c = Math.floor(cols / 2); c < cols; c++) {
      const cell = grid[r][c];
      if (
        cell === CellType.FLOOR ||
        cell === CellType.MUD   ||
        cell === CellType.ICE
      ) {
        const dist = Math.abs(r - playerPos.row) + Math.abs(c - playerPos.col);
        if (dist > 6) floors.push({ row: r, col: c });
      }
    }
  }

  // Shuffle
  for (let i = floors.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [floors[i], floors[j]] = [floors[j], floors[i]];
  }

  const result = floors.slice(0, count);

  // Fallback: any walkable floor
  if (result.length < count) {
    const allFloors = findCells(grid, CellType.FLOOR);
    for (let i = allFloors.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allFloors[i], allFloors[j]] = [allFloors[j], allFloors[i]];
    }

    let i = 0;
    while (result.length < count && i < allFloors.length) {
      const isDuplicate = result.some(
        p => p.row === allFloors[i].row && p.col === allFloors[i].col
      );
      if (!isDuplicate) result.push(allFloors[i]);
      i++;
    }
  }

  return result;
}

// --------------- Public API ---------------

/**
 * Build the enemy list for a given round (wave 1 = round 1 … wave 3 = round 3).
 * Round 3 enemies get a speed boost on top of trait-adjusted intervals.
 */
export function buildWave(
  wave: number,
  grid: Grid,
  playerPos: Pos,
  difficulty: string = 'normal'
): EnemyState[] {
  resetEnemyCounter();

  let rosterIndex = 0;
  if (difficulty === 'easy') {
    rosterIndex = wave <= 2 ? 0 : wave <= 4 ? 1 : 2;
  } else if (difficulty === 'hard') {
    rosterIndex = wave === 1 ? 1 : 2;
  } else {
    rosterIndex = wave === 1 ? 0 : wave === 2 ? 1 : 2;
  }
  const roster = [...ROUND_ROSTERS[rosterIndex]];

  // --- ENDLESS SCALING ---
  const baseSize = 15;
  const MAX_GRID_SIZE = 35;

  let roundHitMax = 1;
  while (baseSize + Math.floor((roundHitMax - 1) / 3) * 4 < MAX_GRID_SIZE) {
    roundHitMax++;
  }

  if (wave >= roundHitMax) {
    const extra = Math.floor((wave - roundHitMax) / 2) + 1;
    for (let i = 0; i < extra; i++) {
      roster.push(
        Math.random() < 0.5 
          ? [AlgoType.ASTAR, EnemyTrait.HUNTER] 
          : [AlgoType.DIJKSTRA, EnemyTrait.HEAVY]
      );
    }
  }
  // ----------------------

  const spawnPositions = pickSpawnPositions(grid, roster.length, playerPos);

  let baseInterval = 380;
  let speedScale = 1.0;
  
  if (difficulty === 'easy') {
    baseInterval = 475; // Base 0.8x
    speedScale = 1 + 0.05 * (wave - 1);
  } else if (difficulty === 'hard') {
    baseInterval = 292; // Base 1.3x
    speedScale = 1 + 0.15 * (wave - 1);
  } else {
    baseInterval = 380; // Base 1.0x
    speedScale = 1 + 0.10 * (wave - 1);
  }
  
  const roundSpeedFactor = 1 / speedScale;

  return roster.map(([algoType, trait], i) => {
    const pos = spawnPositions[i] ?? { row: rows_fallback(grid), col: 1 };
    const iv  = baseIntervalForTrait(baseInterval, trait);
    const enemy = createEnemy(algoType, pos, iv, trait);
    return scaleEnemySpeed(enemy, roundSpeedFactor);
  });
}

function rows_fallback(grid: Grid): number {
  return grid.length - 2;
}

/**
 * Starting lives per round.
 */
export function getRoundLives(round: number): number {
  switch (round) {
    case 1: return 3;
    case 2: return 3;
    case 3: return 2; // stricter in Round 3
    default: return 3;
  }
}

/**
 * Starting wall bombs per round.
 */
export function getRoundBombs(round: number): number {
  switch (round) {
    case 1: return 3;
    case 2: return 2;
    case 3: return 1;
    default: return 3;
  }
}

/**
 * Time limit (ms) for a wave (used for countdown and wave scoring).
 * Round 1: generous; Round 3: tight.
 */
export function getWaveTimeLimit(wave: number): number {
  switch (wave) {
    case 1: return 90_000;
    case 2: return 75_000;
    case 3: return 60_000;
    default: return Math.max(30_000, 90_000 - (wave - 1) * 5_000);
  }
}

/**
 * Score bonus for completing a wave.
 */
export function calcWaveScore(wave: number, timeRemainingMs: number): number {
  return wave * 100 + Math.floor(timeRemainingMs / 1000) * 10;
}

/**
 * Round intro text shown before each round starts.
 */
export function getRoundIntro(round: number): { title: string; lines: string[] } {
  switch (round) {
    case 1:
      return {
        title: 'Round 1 — The Hunt Begins',
        lines: [
          '⬛ Normal floor · 🔵 ICE slides you forward · 🟤 MUD slows movement',
          '👁 Fog of War limits your vision — reach the ★ EXIT to advance',
          '💣 Use Wall Bombs (Space) to break walls · Collect power-ups!',
          'Enemies: Ghost (BFS) · Heavy (Dijkstra)',
        ],
      };
    case 2:
      return {
        title: 'Round 2 — Strategic Depth',
        lines: [
          '🪜 Ladders connect distant areas',
          '⚠ Hazards: Cracks collapse under your feet',
          'Use items and bombs wisely to survive.',
          'Enemies: + Hunter (A*) · Shadow (DFS)',
        ],
      };
    case 3:
      return {
        title: 'Round 3 — Chaos Mode',
        lines: [
          '⏱ Timed events: map changes and enemy ambushes!',
          '💀 Advanced Elite variants join the hunt',
          '⚠ Resources reduced: fewer bombs and lives',
          '🏃 Enemies are much FASTER and more relentless!',
        ],
      };
    default:
      return { title: `Round ${round}`, lines: [] };
  }
}

/** Duration (ms) the round intro is displayed. */
export const ROUND_INTRO_DURATION = 4_000;
