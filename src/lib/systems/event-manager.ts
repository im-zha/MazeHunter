// ============================================================
// event-manager.ts — Tactical AoE Event system for Maze Hunter
// Each biome fires a 3×3 blast every ~10 s with a 3 s warning.
// Effects are biome-specific; pathfinding logic is untouched.
// ============================================================

import {
  CellType,
  Direction,
  type AoeEvent,
  type BiomeId,
  type EnemyState,
  type Grid,
  type PlayerState,
  type Pos,
} from '../core/types.js';
import { setConfusedMode, slowEnemy } from '../entities/enemy.js';

// --------------- Constants ---------------

export const AOE_SPAWN_INTERVAL_MS = 10_000; // ms between spawns
export const AOE_WARNING_MS        =  3_000; // ms of warning before detonation
export const AOE_FLASH_MS          =    600; // ms detonation flash lingers

// --------------- Helpers ---------------

let _aoeCounter = 0;

/** Returns all Pos within the 3×3 blast zone centred on `center`. */
export function getBlastCells(center: Pos, rows: number, cols: number): Pos[] {
  const cells: Pos[] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const r = center.row + dr;
      const c = center.col + dc;
      if (r >= 0 && r < rows && c >= 0 && c < cols) {
        cells.push({ row: r, col: c });
      }
    }
  }
  return cells;
}

/** True if `pos` is inside the 3×3 blast zone of `center`. */
export function isInBlast(pos: Pos, center: Pos): boolean {
  return Math.abs(pos.row - center.row) <= 1 && Math.abs(pos.col - center.col) <= 1;
}

// --------------- Spawn ---------------

/**
 * Pick a random eligible floor cell at least 3 Manhattan tiles from the player.
 * Returns null if no eligible cell found.
 */
function pickCenter(grid: Grid, playerPos: Pos): Pos | null {
  const rows = grid.length;
  const cols = grid[0].length;
  const candidates: Pos[] = [];
  for (let r = 1; r < rows - 1; r++) {
    for (let c = 1; c < cols - 1; c++) {
      const cell = grid[r][c];
      const walkable =
        cell === CellType.FLOOR ||
        cell === CellType.MUD   ||
        cell === CellType.ICE   ||
        cell === CellType.STEALTH_NODE;
      if (!walkable) continue;
      const dist = Math.abs(r - playerPos.row) + Math.abs(c - playerPos.col);
      if (dist >= 3) candidates.push({ row: r, col: c });
    }
  }
  if (!candidates.length) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

/** Create a new AoE event. Returns null if no valid spawn location exists. */
export function spawnAoeEvent(grid: Grid, playerPos: Pos): AoeEvent | null {
  const center = pickCenter(grid, playerPos);
  if (!center) return null;
  return {
    id:        `aoe_${++_aoeCounter}`,
    center,
    warningMs: AOE_WARNING_MS,
    detonated: false,
    flashMs:   0,
  };
}

// --------------- Detonation Result ---------------

export interface DetonationResult {
  enemies:             EnemyState[];
  playerDamaged:       boolean;
  /** ms of sensor jamming to apply to the player (Data Jungle). */
  playerSensorJamMs:   number;
  /** New player position after push (Cooling Sea). Null = no push. */
  playerPushedTo:      Pos | null;
  /** New sliding direction after push (Cooling Sea). */
  playerPushedSlide:   Direction | null;
}

// --------------- Apply Detonation ---------------

/**
 * Apply biome-specific detonation effects for a single AoE event.
 * Pathfinding weights (MUD, ICE, BRIDGE costs) are NOT touched.
 */
export function applyDetonation(
  center:  Pos,
  biome:   Exclude<BiomeId, 'shuffle'>,
  player:  PlayerState,
  enemies: EnemyState[],
  grid:    Grid,
): DetonationResult {
  const rows = grid.length;
  const cols = grid[0].length;

  let newEnemies:           EnemyState[] = [...enemies];
  let playerDamaged         = false;
  let playerSensorJamMs     = 0;
  let playerPushedTo:        Pos | null       = null;
  let playerPushedSlide:     Direction | null = null;

  const playerInBlast = isInBlast(player.pos, center);

  switch (biome) {
    // ── DATA JUNGLE — Cyber-Spore Bloom ──────────────────────────────────────
    case 'data_jungle': {
      // Enemies in blast: Stun (confused mode) for 4 s
      newEnemies = enemies.map(e =>
        isInBlast(e.pos, center) ? setConfusedMode(e, 4_000) : e
      );
      // Player: Sensor Jamming for 3 s (fog radius → 1)
      if (playerInBlast) {
        playerSensorJamMs = 3_000;
      }
      break;
    }

    // ── COOLING SEA — Cryo-Geyser ────────────────────────────────────────────
    case 'cooling_sea': {
      // Enemies in blast: Freeze (slow) for 5 s
      newEnemies = enemies.map(e =>
        isInBlast(e.pos, center) ? slowEnemy(e, 5_000) : e
      );
      // Player: Push 1–2 tiles in a random direction + enter sliding state
      if (playerInBlast) {
        const dirs: Direction[] = [Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT];
        const pushDir   = dirs[Math.floor(Math.random() * dirs.length)];
        const steps     = 1 + Math.floor(Math.random() * 2); // 1 or 2
        const dr        = pushDir === Direction.UP ? -steps : pushDir === Direction.DOWN ? steps : 0;
        const dc        = pushDir === Direction.LEFT ? -steps : pushDir === Direction.RIGHT ? steps : 0;
        const newRow    = Math.max(1, Math.min(rows - 2, player.pos.row + dr));
        const newCol    = Math.max(1, Math.min(cols - 2, player.pos.col + dc));
        const targetCell = grid[newRow]?.[newCol];
        // Only push onto walkable tiles
        if (targetCell !== undefined && targetCell !== CellType.WALL) {
          playerPushedTo    = { row: newRow, col: newCol };
          playerPushedSlide = pushDir;
        }
      }
      break;
    }

    // ── LAVA CORE — Volatile Eruption ────────────────────────────────────────
    case 'lava_core': {
      // Enemies in blast: Stun (confused) for 3 s
      newEnemies = enemies.map(e =>
        isInBlast(e.pos, center) ? setConfusedMode(e, 3_000) : e
      );
      // Player: Lose 1 life
      if (playerInBlast) {
        playerDamaged = true;
      }
      break;
    }
  }

  return { enemies: newEnemies, playerDamaged, playerSensorJamMs, playerPushedTo, playerPushedSlide };
}

// --------------- Tick ---------------

export interface AoeTickResult {
  events:            AoeEvent[];
  nextAoeMs:         number;
  detonations:       DetonationResult[];
  /** Combined event label for HUD (empty string if none). */
  eventLabel:        string;
}

/**
 * Advance all active AoE events by `dt` ms, spawn new ones when the timer fires,
 * and detonate events whose warning has elapsed.
 *
 * Returns updated event list, spawn timer, and a list of detonation results that
 * the game-loop must apply to player/enemy state.
 */
export function tickAoeEvents(
  events:    AoeEvent[],
  nextAoeMs: number,
  dt:        number,
  biome:     Exclude<BiomeId, 'shuffle'>,
  grid:      Grid,
  player:    PlayerState,
  enemies:   EnemyState[],
): AoeTickResult {
  const detonations: DetonationResult[] = [];
  let label = '';

  // ── Tick warning timers; collect detonations ──────────────────────────────
  let updatedEvents: AoeEvent[] = events.map(ev => {
    if (ev.detonated) {
      // Tick flash VFX duration; remove when expired
      const flashMs = Math.max(0, ev.flashMs - dt);
      return { ...ev, flashMs };
    }
    const warningMs = ev.warningMs - dt;
    if (warningMs <= 0) {
      // DETONATE
      const result = applyDetonation(ev.center, biome, player, enemies, grid);
      detonations.push(result);
      const biomeLabels: Record<Exclude<BiomeId, 'shuffle'>, string> = {
        data_jungle: '🌿 CYBER-SPORE BLOOM!',
        cooling_sea: '❄️  CRYO-GEYSER!',
        lava_core:   '🔥 VOLATILE ERUPTION!',
      };
      label = biomeLabels[biome];
      return { ...ev, warningMs: 0, detonated: true, flashMs: AOE_FLASH_MS };
    }
    return { ...ev, warningMs };
  });

  // Remove events whose flash has expired
  updatedEvents = updatedEvents.filter(ev => !ev.detonated || ev.flashMs > 0);

  // ── Spawn timer ───────────────────────────────────────────────────────────
  let newNextMs = nextAoeMs - dt;
  if (newNextMs <= 0) {
    newNextMs = AOE_SPAWN_INTERVAL_MS;
    const newEv = spawnAoeEvent(grid, player.pos);
    if (newEv) updatedEvents = [...updatedEvents, newEv];
  }

  return { events: updatedEvents, nextAoeMs: newNextMs, detonations, eventLabel: label };
}
