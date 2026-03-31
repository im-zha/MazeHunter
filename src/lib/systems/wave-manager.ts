// ============================================================
// wave-manager.ts — Wave spawn and difficulty scaling
// ============================================================

import { AlgoType, type EnemyState, type Grid, type Pos } from '../core/types.js';
import { createEnemy, resetEnemyCounter, scaleEnemySpeed } from '../entities/enemy.js';
import { findCells } from '../core/graph.js';
import { CellType } from '../core/types.js';

export interface WaveConfig {
  wave: number;
  enemies: EnemyState[];
  timeLimit: number; // ms per wave (0 = no limit)
}

// Base step interval (ms per step) for each difficulty
const BASE_INTERVAL: Record<string, number> = {
  easy:   550,
  normal: 380,
  hard:   240,
};

// Speed multiplier applied each wave beyond wave 4
const SPEED_FACTOR = 0.87; // ~15% faster each wave

/**
 * Spawn positions: pick floor cells far from start.
 * Enemies spawn at the opposite side of the map from player.
 */
function pickSpawnPositions(grid: Grid, count: number, playerPos: Pos): Pos[] {
  const rows = grid.length;
  const cols = grid[0].length;
  const floors = [];

  // Gather floor cells in the bottom-right quadrant
  for (let r = Math.floor(rows / 2); r < rows; r++) {
    for (let c = Math.floor(cols / 2); c < cols; c++) {
      const cell = grid[r][c];
      if (cell === CellType.FLOOR || cell === CellType.MUD || cell === CellType.ICE) {
        // Must not be too close to player
        const dist = Math.abs(r - playerPos.row) + Math.abs(c - playerPos.col);
        if (dist > 6) floors.push({ row: r, col: c });
      }
    }
  }

  // Shuffle and take first `count`
  for (let i = floors.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [floors[i], floors[j]] = [floors[j], floors[i]];
  }

  const result = floors.slice(0, count);
  
  // If we couldn't find enough valid floors in the quadrant, fallback to any floor globally
  if (result.length < count) {
    const allFloors = findCells(grid, CellType.FLOOR);
    // Shuffle all floors
    for (let i = allFloors.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allFloors[i], allFloors[j]] = [allFloors[j], allFloors[i]];
    }

    let i = 0;
    while (result.length < count && i < allFloors.length) {
      // Don't add duplicate positions
      const isDuplicate = result.some(p => p.row === allFloors[i].row && p.col === allFloors[i].col);
      if (!isDuplicate) {
        result.push(allFloors[i]);
      }
      i++;
    }
  }

  return result;
}

/**
 * Build the enemy list for a given wave number.
 * Wave 1: Ghost (BFS)
 * Wave 2: + Heavy (Dijkstra)
 * Wave 3: + Hunter (A*)
 * Wave 4+: + Shadow (DFS), speed increases
 */
export function buildWave(
  wave: number,
  grid: Grid,
  playerPos: Pos,
  difficulty: string = 'normal'
): EnemyState[] {
  resetEnemyCounter();

  const baseInterval = BASE_INTERVAL[difficulty] ?? BASE_INTERVAL.normal;
  const waveEnemyTypes: AlgoType[] = [AlgoType.BFS];
  if (wave >= 2) waveEnemyTypes.push(AlgoType.DIJKSTRA);
  if (wave >= 3) waveEnemyTypes.push(AlgoType.ASTAR);
  if (wave >= 4) waveEnemyTypes.push(AlgoType.DFS);

  // Extra instances for wave 5+
  if (wave >= 5) {
    waveEnemyTypes.push(AlgoType.BFS);
  }

  const spawnPositions = pickSpawnPositions(grid, waveEnemyTypes.length, playerPos);

  const speedMultiplier = wave > 4 ? Math.pow(SPEED_FACTOR, wave - 4) : 1;

  return waveEnemyTypes.map((algoType, i) => {
    const pos = spawnPositions[i] ?? { row: 1, col: 1 }; // 1,1 is always player start and guaranteed walkable, as a hyper-extreme fallback
    const enemy = createEnemy(algoType, pos, baseInterval);
    return scaleEnemySpeed(enemy, speedMultiplier);
  });
}

/**
 * Calculate the time limit (ms) for a given wave.
 * Starts at 90s, decreases by 5s per wave, minimum 30s.
 */
export function getWaveTimeLimit(wave: number): number {
  return Math.max(30_000, 90_000 - (wave - 1) * 5_000);
}

/**
 * Calculate score for completing a wave.
 */
export function calcWaveScore(wave: number, timeRemainingMs: number): number {
  return wave * 100 + Math.floor(timeRemainingMs / 1000) * 10;
}
