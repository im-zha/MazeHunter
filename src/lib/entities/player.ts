// ============================================================
// player.ts — Player state factory and update logic
// ============================================================

import {
  CellType,
  Direction,
  type Grid,
  type PlayerState,
  type Pos,
  type LadderObject,
} from '../core/types.js';

// --------------- Constants ---------------
const DEFAULT_FOG_RADIUS = 4;
const POWER_UP_DURATION  = 12_000; // ms
const FREEZE_DURATION    = 8_000;  // ms
const STICKY_SLOW_MS     = 600;    // ms slowed when stepping on sticky

// --------------- Factory ---------------

/**
 * Tạo trạng thái ban đầu cho người chơi tại vị trí bắt đầu.
 * @param startPos - Vị trí bắt đầu.
 * @param initialBombs - Số bom ban đầu (theo round).
 */
export function createPlayer(startPos: Pos, initialBombs = 3): PlayerState {
  return {
    pos: { ...startPos },
    fogRadius: DEFAULT_FOG_RADIUS,
    powerUpTimer: 0,
    wallBombs: initialBombs,
    isSliding: false,
    slideDir: null,
    freezeTimer: 0,
    mudBlocked: false,  // MUD slow toggle — alternates each move attempt on mud
    isOnLadder: false,
  };
}

// --------------- Power-up activation ---------------

/** Activate Power Crystal: boost fog + enemy flee mode. */
export function activatePowerUp(player: PlayerState): PlayerState {
  return {
    ...player,
    powerUpTimer: POWER_UP_DURATION,
    fogRadius: 6,
  };
}

/** Activate Freeze Clock: freeze all enemies. */
export function activateFreeze(player: PlayerState): PlayerState {
  return {
    ...player,
    freezeTimer: FREEZE_DURATION,
  };
}

// --------------- Pickups ---------------

// --------------- Tick update ---------------

/**
 * Cập nhật trạng thái người chơi mỗi tick (bộ đếm power-up, freeze, sticky).
 */
export function updatePlayer(player: PlayerState, deltaMs: number): PlayerState {
  let updated = { ...player };

  if (updated.powerUpTimer > 0) {
    updated.powerUpTimer = Math.max(0, updated.powerUpTimer - deltaMs);
    if (updated.powerUpTimer === 0) {
      updated.fogRadius = DEFAULT_FOG_RADIUS;
    }
  }

  if (updated.freezeTimer > 0) {
    updated.freezeTimer = Math.max(0, updated.freezeTimer - deltaMs);
  }

  return updated;
}

// --------------- Movement ---------------

/** Tile types the player can walk on (passable). */
function isPlayerPassable(cell: CellType): boolean {
  return cell !== CellType.WALL;
}

/**
 * Thử di chuyển người chơi theo hướng cho trước.
 * Xử lý: băng trượt, bùn (không sliding), cầu, thang,
 * dính (sticky timer). Trả về null nếu không thể di chuyển.
 */
export function movePlayer(
  player: PlayerState,
  dir: Direction,
  grid: Grid,
  ladders: LadderObject[] = []
): PlayerState | null {
  const delta = dirToDelta(dir);
  const newRow = player.pos.row + delta.row;
  const newCol = player.pos.col + delta.col;

  if (newRow < 0 || newRow >= grid.length) return null;
  if (newCol < 0 || newCol >= grid[0].length) return null;

  const targetCell = grid[newRow][newCol];
  const newPos: Pos = { row: newRow, col: newCol };

  let isOnLadderNode = false;
  if (player.isOnLadder) {
    for (const ladder of ladders) {
      for (const node of ladder.path_nodes) {
        if (node.row === newRow && node.col === newCol) {
          isOnLadderNode = true;
          break;
        }
      }
      if (isOnLadderNode) break;
    }
  }

  // If the target is not a floor and we are not traversing it via a ladder, block movement.
  if (!isPlayerPassable(targetCell) && !isOnLadderNode) return null;

  let updated: PlayerState = {
    ...player,
    pos: newPos,
    // Step off the ladder automatically if the new position isn't a ladder node
    isOnLadder: player.isOnLadder && isOnLadderNode,
  };

  // ---- Mud: 50% speed via alternating block ----
  // Khi người chơi bước vào ô MUD (hoặc đang ở trên ô MUD và muốn tiếp tục),
  // cờ mudBlocked lật mỗi lần — cứ cách một lần thì bị chặn → tốc độ = 50%.
  const currentCell = grid[player.pos.row]?.[player.pos.col];
  const onMudNow    = currentCell === CellType.MUD;
  const enteringMud = targetCell === CellType.MUD;

  if (onMudNow || enteringMud) {
    // Nếu đang bị chặn lần này → trả về null (bỏ bước), đồng thời xoá cờ để
    // lần tiếp theo được đi.
    if (player.mudBlocked) {
      // Bước bị chặn — trả về null (không di chuyển). Game-loop tự reset cờ.
      return null;
    }
    // Lần này được đi — đặt cờ để lần sau bị chặn
    updated = {
      ...updated,
      isSliding: false,
      slideDir: null,
      mudBlocked: true,
    };
    return updated;
  }

  // Ice slide: continue in same direction
  if (targetCell === CellType.ICE) {
    updated = { ...updated, isSliding: true, slideDir: dir, mudBlocked: false };
  } else {
    updated = { ...updated, isSliding: false, slideDir: null, mudBlocked: false };
  }

  return updated;
}

/** Convert Direction enum to row/col delta. */
export function dirToDelta(dir: Direction): Pos {
  switch (dir) {
    case Direction.UP:    return { row: -1, col: 0 };
    case Direction.DOWN:  return { row:  1, col: 0 };
    case Direction.LEFT:  return { row:  0, col: -1 };
    case Direction.RIGHT: return { row:  0, col:  1 };
  }
}
