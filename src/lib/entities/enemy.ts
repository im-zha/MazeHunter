// ============================================================
// enemy.ts — Enemy state, AI pathfinding dispatch, trait logic
// ============================================================

import {
  AlgoType,
  EnemyMode,
  EnemyTrait,
  type AlgoResult,
  type EnemyState,
  type Grid,
  type LadderObject,
  type Pos,
} from '../core/types.js';
import { CellType } from '../core/types.js';
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

/** Elite/Boss override colors. */
export const TRAIT_COLORS: Partial<Record<EnemyTrait, string>> = {
  [EnemyTrait.ELITE]: '#ff4757',
  [EnemyTrait.BOSS]:  '#ffd700',
};

// --------------- Factory ---------------

let _enemyCounter = 0;

/**
 * Tạo một kẻ địch.
 * @param algoType Loại thuật toán tìm đường
 * @param pos Vị trí khởi tạo
 * @param stepInterval Tốc độ di chuyển ban đầu
 * @param trait Đặc tính hành vi (mặc định NONE)
 */
export function createEnemy(
  algoType: AlgoType,
  pos: Pos,
  stepInterval: number = 400,
  trait: EnemyTrait = EnemyTrait.NONE
): EnemyState {
  return {
    id: `enemy_${algoType}_${trait}_${++_enemyCounter}`,
    pos: { ...pos },
    algoType,
    trait,
    mode: EnemyMode.PURSUE,
    confusedTimer: 0,
    pathCache: [],
    visitedCache: [],
    stepTimer: 0,
    stepInterval,
    slowTimer: 0,
    lastAlgoResult: null,
    onBridge: false,
  };
}

/**
 * Đặt lại bộ đếm cho id kẻ địch.
 */
export function resetEnemyCounter() {
  _enemyCounter = 0;
}

// --------------- Effective step interval ---------------

/**
 * Compute the effective step interval for a trait.
 * FAST: 70% of base, HEAVY: 140%, BOSS: 80%, ELITE: 65%, CLIMBER on ladder: 60%.
 */
export function baseIntervalForTrait(base: number, trait: EnemyTrait): number {
  switch (trait) {
    case EnemyTrait.FAST:     return base * 0.70;
    case EnemyTrait.HEAVY:    return base * 1.40;
    case EnemyTrait.SCOUT:    return base * 0.85;
    case EnemyTrait.BURROWER: return base * 0.95;
    case EnemyTrait.CLIMBER:  return base * 0.90;
    case EnemyTrait.ELITE:    return base * 0.65;
    case EnemyTrait.BOSS:     return base * 0.80;
    default:                  return base;
  }
}

// --------------- Pathfinding Dispatch ---------------

/**
 * Xử lý tìm đường cho kẻ địch tùy theo thuật toán và trait.
 */
function runPathfind(
  grid: Grid,
  algoType: AlgoType,
  from: Pos,
  to: Pos,
  trait: EnemyTrait,
  ladders: LadderObject[]
): AlgoResult {
  switch (algoType) {
    case AlgoType.BFS:      return bfs(grid, from, to, trait, ladders);
    case AlgoType.DIJKSTRA: return dijkstra(grid, from, to, trait, ladders);
    case AlgoType.ASTAR:    return astar(grid, from, to, trait, ladders);
    case AlgoType.DFS:      return dfs(grid, from, to, trait, ladders);
  }
}

// --------------- Mud / terrain slow penalty ---------------

/**
 * Return additional ms of slow added when stepping onto a cell, based on trait.
 * HEAVY/BURROWER/BOSS are less affected by mud.
 * CLIMBER is slowed extra on ICE.
 */
export function terrainSlowForTrait(cell: CellType, trait: EnemyTrait, baseInterval: number): number {
  if (cell === CellType.MUD) {
    switch (trait) {
      case EnemyTrait.BURROWER:
      case EnemyTrait.BOSS:    return 0;
      case EnemyTrait.HEAVY:
      case EnemyTrait.ELITE:   return baseInterval * 0.5;
      default:                 return baseInterval * 2;
    }
  }

  if (cell === CellType.ICE && trait === EnemyTrait.CLIMBER) {
    return baseInterval * 0.5; // penalty on ice
  }
  return 0;
}

// --------------- Update ---------------

/**
 * Cập nhật một kẻ địch cho một chu kỳ trò chơi.
 * @param enemy - trạng thái hiện tại
 * @param deltaMs - delta time (ms)
 * @param grid - lưới bản đồ hiện tại
 * @param playerPos - vị trí người chơi
 * @param exitPos - vị trí cửa thoát
 * @param pathInvalid - cờ ép tính toán lại đường
 * @param ladders - danh sách LadderObject trên bản đồ
 * @param confusedTarget - mục tiêu giả dùng khi CONFUSED
 */
export function updateEnemy(
  enemy: EnemyState,
  deltaMs: number,
  grid: Grid,
  playerPos: Pos,
  exitPos: Pos,
  pathInvalid: boolean,
  ladders: LadderObject[] = [],
  confusedTarget?: Pos,
  playerInStealth = false
): EnemyState {
  let updated = { ...enemy };

  // Countdown confused timer
  if (updated.confusedTimer > 0) {
    updated = { ...updated, confusedTimer: Math.max(0, updated.confusedTimer - deltaMs) };
    if (updated.confusedTimer === 0) {
      updated = { ...updated, mode: EnemyMode.PURSUE, pathCache: [] };
    }
  }

  // Count down slowTimer
  if (updated.slowTimer > 0) {
    updated = { ...updated, slowTimer: Math.max(0, updated.slowTimer - deltaMs) };
  }

  // Determine target
  let target: Pos;
  if (updated.mode === EnemyMode.CONFUSED && confusedTarget) {
    target = confusedTarget;
  } else if (updated.mode === EnemyMode.FLEE) {
    target = maxDistanceBfs(grid, playerPos, updated.pos, ladders);
  } else {
    // ── STEALTH NODE: reduce detection for precision-tracking enemies ──────
    // Hunter/Boss lose the player entirely; others just fail to recalc path.
    if (playerInStealth) {
      const isTrackingEnemy =
        updated.trait === EnemyTrait.HUNTER ||
        updated.trait === EnemyTrait.BOSS   ||
        updated.algoType === AlgoType.ASTAR;
      if (isTrackingEnemy) {
        // Redirect to exit (acts like player is invisible)
        target = exitPos;
      } else {
        // Non-precision enemies: walk toward last known direction (exit as proxy)
        target = confusedTarget ?? exitPos;
      }
    } else {
      target = playerPos;
    }
  }

  // Hunter trait: always force recalc (hyper-pursuit)
  const forceRecalc = updated.trait === EnemyTrait.HUNTER || updated.trait === EnemyTrait.BOSS;

  const needsRecalc =
    forceRecalc ||
    pathInvalid ||
    updated.pathCache.length === 0 ||
    (updated.pathCache.length > 0 &&
      !posEqual(updated.pathCache[updated.pathCache.length - 1], target));

  if (needsRecalc) {
    const result = runPathfind(grid, updated.algoType, updated.pos, target, updated.trait, ladders);
    updated = {
      ...updated,
      pathCache: result.path.slice(1),
      visitedCache: result.visited,
      lastAlgoResult: result,
    };
  }

  // Advance step timer (skip if slowed)
  if (updated.slowTimer <= 0) {
    updated = { ...updated, stepTimer: updated.stepTimer + deltaMs };
  }

  // Move along path
  if (updated.stepTimer >= updated.stepInterval) {
    if (updated.pathCache.length > 0) {
      const nextPos = updated.pathCache[0];
      const nextCell = grid[nextPos.row]?.[nextPos.col] ?? CellType.FLOOR;

      // Terrain-based slow added after stepping
      const slow = terrainSlowForTrait(nextCell, updated.trait, updated.stepInterval);

      // Bridge occupancy tracking (set by game-loop before calling this)
      const onBridge = nextCell === CellType.BRIDGE;

      updated = {
        ...updated,
        pos: nextPos,
        pathCache: updated.pathCache.slice(1),
        stepTimer: 0,
        slowTimer: slow,
        onBridge,
      };
    } else {
      updated = { ...updated, stepTimer: 0 };
    }
  }

  return updated;
}

// --------------- Mode helpers ---------------

/**
 * Chuyển kẻ địch sang chế độ bỏ chạy.
 */
export function setFleeMode(enemy: EnemyState): EnemyState {
  return {
    ...enemy,
    mode: EnemyMode.FLEE,
    pathCache: [],
  };
}

/**
 * Chuyển kẻ địch về chế độ truy đuổi.
 */
export function setPursueMode(enemy: EnemyState): EnemyState {
  return {
    ...enemy,
    mode: EnemyMode.PURSUE,
    pathCache: [],
  };
}

/**
 * Confuse an enemy for a given duration (Mirror Smoke / misdirection).
 */
export function setConfusedMode(enemy: EnemyState, durationMs: number): EnemyState {
  return {
    ...enemy,
    mode: EnemyMode.CONFUSED,
    confusedTimer: durationMs,
    pathCache: [],
  };
}

/**
 * Slow an enemy (EMP/net effect).
 */
export function slowEnemy(enemy: EnemyState, slowMs: number): EnemyState {
  return {
    ...enemy,
    slowTimer: Math.max(enemy.slowTimer, slowMs),
  };
}

/**
 * Tăng tốc độ kẻ địch theo hệ số.
 */
export function scaleEnemySpeed(enemy: EnemyState, factor: number): EnemyState {
  return {
    ...enemy,
    stepInterval: Math.max(80, enemy.stepInterval * factor),
  };
}
