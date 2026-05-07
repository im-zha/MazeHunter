// ============================================================
// maze-generator.ts — DFS Recursive Backtracker + layered terrain
// ============================================================

import { CellType, type Grid, type LadderObject, type Pos } from './types.js';

let _ladderCounter = 0;

/**
 * Round-specific generation options.
 */
export interface MazeOptions {
  rows: number;
  cols: number;
  round?: number;        // 1, 2, or 3 — controls density of features
  mudChance?: number;
  iceChance?: number;
  crystalCount?: number;
  freezeCount?: number;
  bombCount?: number;
  // Round 2+ features
  ladderCount?: number;
  bridgeCount?: number;
  crackCount?: number;
}

const DIRS = [
  { dr: -2, dc: 0 },
  { dr:  2, dc: 0 },
  { dr:  0, dc: -2 },
  { dr:  0, dc:  2 },
];

function shuffle<T>(arr: T[], rng: () => number): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Derive round-based defaults so callers only need to pass `round`.
 */
function resolveOptions(options: MazeOptions): Required<MazeOptions> {
  const round = options.round ?? 1;

  // Round-scaled defaults
  const base: Required<MazeOptions> = {
    rows:         options.rows,
    cols:         options.cols,
    round,
    mudChance:    options.mudChance    ?? (round === 1 ? 0.06 : round === 2 ? 0.10 : 0.14),
    iceChance:    options.iceChance    ?? (round === 1 ? 0.05 : round === 2 ? 0.07 : 0.09),
    crystalCount: options.crystalCount ?? (round === 1 ? 2    : round === 2 ? 2    : 1),
    freezeCount:  options.freezeCount  ?? (round === 1 ? 1    : round === 2 ? 1    : 1),
    bombCount:    options.bombCount    ?? (round === 1 ? 2    : round === 2 ? 2    : 1),
    // traversal layer
    ladderCount:  options.ladderCount  ?? (round === 1 ? 0    : round === 2 ? 3    : 5),
    bridgeCount:  options.bridgeCount  ?? (round === 1 ? 0    : round === 2 ? 2    : 4),
    // hazard layer
    crackCount:   options.crackCount   ?? (round === 1 ? 0    : round === 2 ? 2    : 4),
  };

  return base;
}

// --------------- Ladder Object Generation ---------------

/**
 * Sinh danh sách LadderObject cho một grid đã tạo.
 *
 * Thuật toán:
 * 1. Thu thập tất cả ô sàn (Floor/passable) làm ứng viên endpoint.
 * 2. Xáo trộn danh sách.
 * 3. Với mỗi ô bắt đầu (start), thử kéo thang theo hướng ngang hoặc dọc
 *    với độ dài ngẫu nhiên 3–6 ô qua các ô tường/vật cản.
 * 4. Điểm kết thúc (end) phải là ô sàn đi lại được.
 * 5. Nếu hợp lệ và không trùng quá gần thang khác (≥ 5 ô), chấp nhận.
 *
 * Mỗi LadderObject chỉ chiếm hai node (start, end) trong đồ thị —
 * không ảnh hưởng đến CellType của bất kỳ ô nào.
 */
export function generateLadders(
  grid: Grid,
  count: number,
  rng: () => number,
  startPos: Pos,
  exitPos: Pos,
  round: number = 1
): LadderObject[] {
  if (count <= 0) return [];

  const rows = grid.length;
  const cols = grid[0].length;

  // Hàm kiểm tra ô sàn đi được (không phải tường)
  const isFloor = (r: number, c: number): boolean => {
    if (r < 0 || r >= rows || c < 0 || c >= cols) return false;
    return grid[r][c] !== CellType.WALL;
  };

  // Thu thập ô sàn làm ứng viên start
  const floorCells: Pos[] = [];
  for (let r = 1; r < rows - 1; r++) {
    for (let c = 1; c < cols - 1; c++) {
      if (!isFloor(r, c)) continue;
      // Loại bỏ ô quá gần start/exit
      const dStart = Math.abs(r - startPos.row) + Math.abs(c - startPos.col);
      const dExit  = Math.abs(r - exitPos.row)  + Math.abs(c - exitPos.col);
      if (dStart <= 2 || dExit <= 2) continue;
      floorCells.push({ row: r, col: c });
    }
  }
  shuffle(floorCells, rng);

  const ladders: LadderObject[] = [];
  const MIN_LENGTH = 3;
  const MAX_LENGTH = 6;
  const MIN_SEPARATION = 5;

  for (const startCell of floorCells) {
    if (ladders.length >= count) break;

    const length = MIN_LENGTH + Math.floor(rng() * (MAX_LENGTH - MIN_LENGTH + 1));
    const isCurved = round >= 4 && rng() < 0.5;

    let path_nodes: Pos[] | null = null;

    if (isCurved) {
      // Build a random walk path
      let cur = startCell;
      const walk = [cur];
      let hasWallInMiddle = false;
      let valid = false;

      for (let i = 0; i < length; i++) {
        const dirs = shuffle([{dr:-1,dc:0}, {dr:1,dc:0}, {dr:0,dc:-1}, {dr:0,dc:1}], rng);
        let moved = false;
        for (const { dr, dc } of dirs) {
          const nr = cur.row + dr;
          const nc = cur.col + dc;
          // Don't step out of bounds
          if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
          // Don't step back on itself
          if (walk.some(p => p.row === nr && p.col === nc)) continue;

          if (grid[nr][nc] === CellType.WALL) hasWallInMiddle = true;

          cur = { row: nr, col: nc };
          walk.push(cur);
          moved = true;
          break;
        }
        if (!moved) break;
      }

      if (walk.length === length + 1 && hasWallInMiddle && isFloor(cur.row, cur.col)) {
        const dStart = Math.abs(cur.row - startPos.row) + Math.abs(cur.col - startPos.col);
        const dExit  = Math.abs(cur.row - exitPos.row)  + Math.abs(cur.col - exitPos.col);
        if (dStart > 2 && dExit > 2) {
          path_nodes = walk;
        }
      }
    } else {
      // Straight ladder
      const directions = shuffle([
        { dr: 0,  dc: 1 },
        { dr: 0,  dc: -1 },
        { dr: 1,  dc: 0 },
        { dr: -1, dc: 0 },
      ], rng);

      for (const { dr, dc } of directions) {
        const endRow = startCell.row + dr * length;
        const endCol = startCell.col + dc * length;
        if (!isFloor(endRow, endCol)) continue;

        const dStart = Math.abs(endRow - startPos.row) + Math.abs(endCol - startPos.col);
        const dExit  = Math.abs(endRow - exitPos.row)  + Math.abs(endCol - exitPos.col);
        if (dStart <= 2 || dExit <= 2) continue;

        let hasObstacleInMiddle = false;
        let validStraight = true;
        const tempPath = [startCell];
        for (let step = 1; step <= length; step++) {
          const mr = startCell.row + dr * step;
          const mc = startCell.col + dc * step;
          if (mr < 0 || mr >= rows || mc < 0 || mc >= cols) { validStraight = false; break; }
          tempPath.push({ row: mr, col: mc });
          if (step < length && grid[mr][mc] === CellType.WALL) {
            hasObstacleInMiddle = true;
          }
        }
        if (validStraight && hasObstacleInMiddle) {
          path_nodes = tempPath;
          break;
        }
      }
    }

    if (path_nodes) {
      const endPos = path_nodes[path_nodes.length - 1];
      const tooClose = ladders.some(l => {
        const d1 = Math.abs(l.path_nodes[0].row - startCell.row) + Math.abs(l.path_nodes[0].col - startCell.col);
        const d2 = Math.abs(l.path_nodes[l.path_nodes.length-1].row - startCell.row) + Math.abs(l.path_nodes[l.path_nodes.length-1].col - startCell.col);
        const d3 = Math.abs(l.path_nodes[0].row - endPos.row) + Math.abs(l.path_nodes[0].col - endPos.col);
        const d4 = Math.abs(l.path_nodes[l.path_nodes.length-1].row - endPos.row) + Math.abs(l.path_nodes[l.path_nodes.length-1].col - endPos.col);
        return Math.min(d1, d2, d3, d4) < MIN_SEPARATION;
      });

      if (!tooClose) {
        ladders.push({
          id: `ladder_${++_ladderCounter}`,
          path_nodes,
          length: path_nodes.length - 1,
        });
      }
    }
  }

  return ladders;
}

/**
 * Tạo mê cung hoàn hảo sử dụng DFS Recursive Backtracker.
 * Hỗ trợ 3 lớp bản đồ: địa hình, đi lại, sự kiện.
 * Trả về cả grid lẫn danh sách LadderObject.
 */
export function generateMaze(options: MazeOptions): {
  grid: Grid;
  start: { row: number; col: number };
  exit: { row: number; col: number };
  ladders: LadderObject[];
} {
  _ladderCounter = 0; // Reset counter mỗi lần tạo map mới

  const {
    rows,
    cols,
    mudChance,
    iceChance,
    crystalCount,
    freezeCount,
    bombCount,
    ladderCount,
    bridgeCount,
    crackCount,
    round = 1,
  } = resolveOptions(options);

  if (rows % 2 === 0 || cols % 2 === 0) {
    throw new Error('Maze dimensions must be odd numbers.');
  }

  // LCG RNG
  let seed = Date.now();
  const rng = () => {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    return (seed >>> 0) / 0x100000000;
  };

  // Initialize grid as walls
  const grid: Grid = Array.from({ length: rows }, () =>
    Array(cols).fill(CellType.WALL)
  );

  const visited = Array.from({ length: rows }, () => Array(cols).fill(false));

  // DFS maze carving
  const stack: { r: number; c: number }[] = [{ r: 1, c: 1 }];
  grid[1][1] = CellType.FLOOR;
  visited[1][1] = true;

  while (stack.length > 0) {
    const cur = stack[stack.length - 1];
    const dirs = shuffle([...DIRS], rng);

    let moved = false;
    for (const { dr, dc } of dirs) {
      const nr = cur.r + dr;
      const nc = cur.c + dc;

      if (nr <= 0 || nr >= rows - 1 || nc <= 0 || nc >= cols - 1) continue;
      if (visited[nr][nc]) continue;

      grid[cur.r + dr / 2][cur.c + dc / 2] = CellType.FLOOR;
      grid[nr][nc] = CellType.FLOOR;
      visited[nr][nc] = true;

      stack.push({ r: nr, c: nc });
      moved = true;
      break;
    }

    if (!moved) stack.pop();
  }

  // Collect floor cells
  const floorCells: { row: number; col: number }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === CellType.FLOOR) {
        floorCells.push({ row: r, col: c });
      }
    }
  }

  // Fixed positions
  const start = { row: 1, col: 1 };
  const exit  = { row: rows - 2, col: cols - 2 };
  grid[exit.row][exit.col] = CellType.EXIT;

  // Placeable cells (exclude start and exit, and keep buffer around them)
  const placeable = floorCells.filter(p => {
    if (p.row === start.row && p.col === start.col) return false;
    if (p.row === exit.row  && p.col === exit.col)  return false;
    // Keep a 1-tile buffer around start so Round 1 is clearly readable
    if (Math.abs(p.row - start.row) + Math.abs(p.col - start.col) <= 2) return false;
    return true;
  });
  shuffle(placeable, rng);

  let idx = 0;
  const place = (type: CellType, count: number) => {
    for (let i = 0; i < count && idx < placeable.length; i++, idx++) {
      const { row, col } = placeable[idx];
      grid[row][col] = type;
    }
  };

  // ---- TERRAIN LAYER — MUD as horizontal/vertical strips (3–5 cells) ----
  const totalMudCells = Math.floor(placeable.length * mudChance);
  let mudPlaced = 0;
  const mudCandidates = placeable.filter(p => grid[p.row][p.col] === CellType.FLOOR);
  shuffle(mudCandidates, rng);

  for (const startCell of mudCandidates) {
    if (mudPlaced >= totalMudCells) break;
    if (grid[startCell.row][startCell.col] !== CellType.FLOOR) continue;

    const stripLen = 3 + Math.floor(rng() * 3); // 3, 4, or 5
    const horizontal = rng() < 0.5;

    const strip: { row: number; col: number }[] = [];
    for (let i = 0; i < stripLen; i++) {
      const r = startCell.row + (horizontal ? 0 : i);
      const c = startCell.col + (horizontal ? i : 0);
      if (r < 1 || r >= rows - 1 || c < 1 || c >= cols - 1) break;
      if (grid[r][c] !== CellType.FLOOR) break;
      strip.push({ row: r, col: c });
    }

    if (strip.length >= 3) {
      for (const cell of strip) {
        grid[cell.row][cell.col] = CellType.MUD;
        mudPlaced++;
      }
    }
  }

  // ICE: placed as individual cells
  place(CellType.ICE, Math.floor(placeable.length * iceChance));

  // ---- TRAVERSAL LAYER — BRIDGE (chokepoints) ----
  if (bridgeCount > 0) {
    const bridgeCandidates = placeable.filter(p => {
      if (grid[p.row][p.col] !== CellType.FLOOR) return false;
      const neighbors = [
        { r: p.row - 1, c: p.col },
        { r: p.row + 1, c: p.col },
        { r: p.row, c: p.col - 1 },
        { r: p.row, c: p.col + 1 },
      ].filter(n => n.r >= 0 && n.r < rows && n.c >= 0 && n.c < cols && grid[n.r][n.c] !== CellType.WALL);
      return neighbors.length === 2;
    });
    shuffle(bridgeCandidates, rng);
    for (let i = 0; i < bridgeCount && i < bridgeCandidates.length; i++) {
      grid[bridgeCandidates[i].row][bridgeCandidates[i].col] = CellType.BRIDGE;
    }
    let placed = Math.min(bridgeCount, bridgeCandidates.length);
    if (placed < bridgeCount) {
      while (placed < bridgeCount && idx < placeable.length) {
        if (grid[placeable[idx].row][placeable[idx].col] === CellType.FLOOR) {
          grid[placeable[idx].row][placeable[idx].col] = CellType.BRIDGE;
          placed++;
        }
        idx++;
      }
    }
  }

  // ---- LADDER LAYER — floating LadderObject entities (not grid tiles) ----
  const ladders = generateLadders(grid, ladderCount, rng, start, exit, round);

  // ---- EVENT LAYER — power-up pickups ----
  place(CellType.CRYSTAL,      crystalCount);
  place(CellType.FREEZE_CLOCK, freezeCount);
  place(CellType.BOMB_PICKUP,  bombCount);

  // ---- HAZARD LAYER ----
  place(CellType.CRACK,  crackCount);

  return { grid, start, exit, ladders };
}