// ============================================================
// player.ts — Player state and movement logic
// ============================================================

import { CellType, Direction, type Grid, type PlayerState, type Pos } from '../core/types.js';
import { isPassable } from '../core/graph.js';

export const POWER_UP_DURATION_MS = 12000;
export const FREEZE_DURATION_MS = 8000;
export const DEFAULT_FOG_RADIUS = 4;
export const POWER_UP_FOG_RADIUS = 6;
export const MAX_WALL_BOMBS = 3;

/** Create the initial player state. */
export function createPlayer(startPos: Pos): PlayerState {
  return {
    pos: { ...startPos },
    fogRadius: DEFAULT_FOG_RADIUS,
    powerUpTimer: 0,
    wallBombs: MAX_WALL_BOMBS,
    isSliding: false,
    slideDir: null,
    freezeTimer: 0,
  };
}

/** Convert a Direction to a delta {row, col}. */
export function dirToDelta(dir: Direction): Pos {
  switch (dir) {
    case Direction.UP:    return { row: -1, col: 0 };
    case Direction.DOWN:  return { row:  1, col: 0 };
    case Direction.LEFT:  return { row: 0, col: -1 };
    case Direction.RIGHT: return { row: 0, col:  1 };
  }
}

/**
 * Try to move the player one step in the given direction.
 * Returns the new player state (immutable pattern).
 * Returns null if the move is invalid (wall).
 */
export function movePlayer(
  player: PlayerState,
  dir: Direction,
  grid: Grid
): PlayerState | null {
  const delta = dirToDelta(dir);
  const newRow = player.pos.row + delta.row;
  const newCol = player.pos.col + delta.col;
  const rows = grid.length;
  const cols = grid[0].length;

  if (newRow < 0 || newRow >= rows || newCol < 0 || newCol >= cols) return null;
  const cell = grid[newRow][newCol];
  if (!isPassable(cell)) return null;

  const newPlayer: PlayerState = {
    ...player,
    pos: { row: newRow, col: newCol },
  };

  // ICE: set slide direction so game-loop continues sliding
  if (cell === CellType.ICE) {
    newPlayer.isSliding = true;
    newPlayer.slideDir = dir;
  } else {
    newPlayer.isSliding = false;
    newPlayer.slideDir = null;
  }

  return newPlayer;
}

/**
 * Update player state each game tick.
 * Handles power-up timer countdown and fog radius restoration.
 */
export function updatePlayer(player: PlayerState, deltaMs: number): PlayerState {
  let newPowerUp = Math.max(0, player.powerUpTimer - deltaMs);
  let newFreeze = Math.max(0, player.freezeTimer - deltaMs);

  return {
    ...player,
    powerUpTimer: newPowerUp,
    freezeTimer: newFreeze,
    fogRadius: newPowerUp > 0 ? POWER_UP_FOG_RADIUS : DEFAULT_FOG_RADIUS,
  };
}

/**
 * Activate the Power Crystal effect on the player.
 */
export function activatePowerUp(player: PlayerState): PlayerState {
  return {
    ...player,
    powerUpTimer: POWER_UP_DURATION_MS,
    fogRadius: POWER_UP_FOG_RADIUS,
  };
}

export function activateFreeze(player: PlayerState): PlayerState {
  return {
    ...player,
    freezeTimer: FREEZE_DURATION_MS,
  };
}
