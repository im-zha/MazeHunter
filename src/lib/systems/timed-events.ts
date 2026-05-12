// ============================================================
// timed-events.ts — Round timed event definitions and processing
// ============================================================

import {
  CellType,
  EnemyTrait,
  TimedEventType,
  type GameState,
  type LadderObject,
  type TimedEvent,
  type EnemyState,
} from '../core/types.js';
import { findWalkable } from '../core/graph.js';
import { createEnemy, baseIntervalForTrait } from '../entities/enemy.js';
import { generateLadders } from '../core/maze-generator.js';
import { AlgoType } from '../core/types.js';

// --------------- Round event schedules ---------------

/**
 * Return the list of timed events for a given round.
 * All triggerMs values are relative to round start (0 = immediately).
 */
export function buildTimedEvents(round: number): TimedEvent[] {
  if (round === 1) {
    // Round 1: no timed events (keep it simple)
    return [];
  }

  if (round === 2) {
    return [
      {
        triggerMs: 20_000,
        fired: false,
        label: '🔓 New route opened!',
        type: TimedEventType.OPEN_ROUTE,
      },
      {
        triggerMs: 50_000,
        fired: false,
        label: '🪜 Ladder appeared!',
        type: TimedEventType.SPAWN_LADDER,
      },
    ];
  }

  // Round 3: intense escalation
  return [
    {
      triggerMs: 15_000,
      fired: false,
      label: '💀 Elite enemy spawned!',
      type: TimedEventType.SPAWN_ELITE,
    },
    {
      triggerMs: 35_000,
      fired: false,
      label: '🔓 New route opened!',
      type: TimedEventType.OPEN_ROUTE,
    },
    {
      triggerMs: 55_000,
      fired: false,
      label: '💀 Mini Boss appeared!',
      type: TimedEventType.SPAWN_ELITE,
      payload: { isBoss: true },
    },
  ];
}

// --------------- Event application ---------------

export interface EventResult {
  grid: GameState['grid'];
  enemies: EnemyState[];
  /** Một LadderObject mới được sinh ra từ sự kiện SPAWN_LADDER. */
  newLadder?: LadderObject;
}

/**
 * Apply a single timed event to the game world.
 * Returns partial updates to be merged into GameState by the game loop.
 */
export function applyTimedEvent(
  event: TimedEvent,
  state: GameState,
  baseInterval: number
): EventResult {
  const grid = state.grid.map(row => [...row]);
  let enemies = [...state.enemies];

  switch (event.type) {
    case TimedEventType.OPEN_ROUTE: {
      // Find a wall that is adjacent to 2 or more floor cells and open it
      const rows = grid.length;
      const cols = grid[0].length;
      const candidates: { row: number; col: number }[] = [];
      for (let r = 1; r < rows - 1; r++) {
        for (let c = 1; c < cols - 1; c++) {
          if (grid[r][c] !== CellType.WALL) continue;
          let floorNeighbors = 0;
          if (grid[r-1]?.[c] && grid[r-1][c] !== CellType.WALL) floorNeighbors++;
          if (grid[r+1]?.[c] && grid[r+1][c] !== CellType.WALL) floorNeighbors++;
          if (grid[r]?.[c-1] && grid[r][c-1] !== CellType.WALL) floorNeighbors++;
          if (grid[r]?.[c+1] && grid[r][c+1] !== CellType.WALL) floorNeighbors++;
          if (floorNeighbors >= 2) candidates.push({ row: r, col: c });
        }
      }
      if (candidates.length > 0) {
        // Pick a candidate near the middle of the map
        const mid = Math.floor(candidates.length / 2);
        const chosen = candidates[mid];
        grid[chosen.row][chosen.col] = CellType.FLOOR;
      }
      break;
    }

    case TimedEventType.COLLAPSE_BRIDGE: {
      // Bridge tiles are no longer generated; keep this as a no-op for old saves/events.
      break;
    }

    case TimedEventType.SPAWN_LADDER: {
      // Sinh ra một LadderObject mới nối hai vùng sàn cách nhau bằng tường.
      // generateLadders xử lý hoàn toàn logic — không ghi vào grid.
      const playerPos = state.player.pos;
      const exitPos   = state.enemies.length > 0
        ? { row: grid.length - 2, col: grid[0].length - 2 }
        : { row: grid.length - 2, col: grid[0].length - 2 };
      const rng = () => Math.random();
      const newLadders = generateLadders(grid as GameState['grid'], 1, rng, playerPos, exitPos);
      if (newLadders.length > 0) {
        return { grid, enemies, newLadder: newLadders[0] };
      }
      break;
    }

    case TimedEventType.SPAWN_ELITE: {
      const isBoss = event.payload?.isBoss === true;
      // Spawn far from player
      const playerPos = state.player.pos;
      const walkable = findWalkable(grid as GameState['grid']).filter(p => {
        const dist = Math.abs(p.row - playerPos.row) + Math.abs(p.col - playerPos.col);
        return dist > 8 && grid[p.row][p.col] === CellType.FLOOR;
      });
      if (walkable.length > 0) {
        const pos = walkable[Math.floor(Math.random() * walkable.length)];
        const trait = isBoss ? EnemyTrait.BOSS : EnemyTrait.ELITE;
        const algo  = isBoss ? AlgoType.ASTAR  : AlgoType.BFS;
        const iv    = baseIntervalForTrait(baseInterval, trait);
        const elite = createEnemy(algo, pos, iv, trait);
        enemies = [...enemies, elite];
      }
      break;
    }
  }

  return { grid, enemies };
}
