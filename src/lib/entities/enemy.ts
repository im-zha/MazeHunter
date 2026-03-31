// ============================================================
// enemy.ts — Enemy state and AI pathfinding dispatch
// ============================================================

import {
  AlgoType,
  EnemyMode,
  type AlgoResult,
  type EnemyState,
  type Grid,
  type Pos,
} from '../core/types.js';
import { posEqual, posToId } from '../core/graph.js';
import { bfs, maxDistanceBfs } from '../algorithms/bfs.js';
import { dijkstra } from '../algorithms/dijkstra.js';
import { astar } from '../algorithms/astar.js';
import { dfs } from '../algorithms/dfs.js';

// --------------- Enemy Colors (for renderer) ---------------

export const ENEMY_COLORS: Record<AlgoType, string> = {
  [AlgoType.BFS]:      '#60a5fa', // blue   — Ghost
  [AlgoType.DIJKSTRA]: '#f97316', // orange — Heavy
  [AlgoType.ASTAR]:    '#a855f7', // purple — Hunter
  [AlgoType.DFS]:      '#6b7280', // gray   — Shadow
};

export const ENEMY_NAMES: Record<AlgoType, string> = {
  [AlgoType.BFS]:      'Ghost',
  [AlgoType.DIJKSTRA]: 'Heavy',
  [AlgoType.ASTAR]:    'Hunter',
  [AlgoType.DFS]:      'Shadow',
};

// --------------- Factory ---------------

let _enemyCounter = 0;

export function createEnemy(
  algoType: AlgoType,
  pos: Pos,
  stepInterval: number = 400
): EnemyState {
  return {
    id: `enemy_${algoType}_${++_enemyCounter}`,
    pos: { ...pos },
    algoType,
    mode: EnemyMode.PURSUE,
    pathCache: [],
    visitedCache: [],
    stepTimer: 0,
    stepInterval,
    lastAlgoResult: null,
  };
}

export function resetEnemyCounter() {
  _enemyCounter = 0;
}

// --------------- Pathfinding Dispatch ---------------

function runPathfind(
  grid: Grid,
  algoType: AlgoType,
  from: Pos,
  to: Pos
): AlgoResult {
  switch (algoType) {
    case AlgoType.BFS:      return bfs(grid, from, to);
    case AlgoType.DIJKSTRA: return dijkstra(grid, from, to);
    case AlgoType.ASTAR:    return astar(grid, from, to);
    case AlgoType.DFS:      return dfs(grid, from, to);
  }
}

// --------------- Update ---------------

/**
 * Update a single enemy for one game tick.
 * @param enemy - current enemy state
 * @param deltaMs - ms since last frame
 * @param grid - current maze grid
 * @param playerPos - current player position
 * @param exitPos - exit position (for connectivity checks)
 * @param pathInvalid - set to true when city/grid has changed (forces recalc)
 */
export function updateEnemy(
  enemy: EnemyState,
  deltaMs: number,
  grid: Grid,
  playerPos: Pos,
  exitPos: Pos,
  pathInvalid: boolean
): EnemyState {
  let updated = { ...enemy };

  // Determine target
  const target = updated.mode === EnemyMode.PURSUE
    ? playerPos
    : maxDistanceBfs(grid, playerPos, updated.pos);

  // Recalculate path if:
  // - cache is empty
  // - grid changed (wall placed)
  // - path invalidated externally
  const needsRecalc =
    pathInvalid ||
    updated.pathCache.length === 0 ||
    (updated.pathCache.length > 0 &&
      !posEqual(updated.pathCache[updated.pathCache.length - 1], target));

  if (needsRecalc) {
    const result = runPathfind(grid, updated.algoType, updated.pos, target);
    updated = {
      ...updated,
      pathCache: result.path.slice(1), // exclude current position
      visitedCache: result.visited,
      lastAlgoResult: result,
    };
  }

  // Advance step timer
  updated = { ...updated, stepTimer: updated.stepTimer + deltaMs };

  // Move along path if timer reached
  if (updated.stepTimer >= updated.stepInterval && updated.pathCache.length > 0) {
    const nextPos = updated.pathCache[0];
    updated = {
      ...updated,
      pos: nextPos,
      pathCache: updated.pathCache.slice(1),
      stepTimer: 0,
    };
  }

  return updated;
}

/**
 * Set flee mode on an enemy (triggered by Power Crystal pickup).
 */
export function setFleeMode(enemy: EnemyState): EnemyState {
  return {
    ...enemy,
    mode: EnemyMode.FLEE,
    pathCache: [],  // force recalculation
  };
}

/**
 * Restore pursue mode on an enemy (power-up expired).
 */
export function setPursueMode(enemy: EnemyState): EnemyState {
  return {
    ...enemy,
    mode: EnemyMode.PURSUE,
    pathCache: [],  // force recalculation
  };
}

/**
 * Increase enemy speed for difficulty scaling.
 * @param factor - multiply existing stepInterval by this (e.g. 0.85 = 15% faster)
 */
export function scaleEnemySpeed(enemy: EnemyState, factor: number): EnemyState {
  return {
    ...enemy,
    stepInterval: Math.max(80, enemy.stepInterval * factor),
  };
}
