// ============================================================
// maze-generator.ts — DFS Recursive Backtracker
// ============================================================

import { CellType, type Grid } from './types.js';

interface MazeOptions {
  rows: number;
  cols: number;
  /** Fraction of floor cells to convert to MUD (0–1). Default 0.08 */
  mudChance?: number;
  /** Fraction of floor cells to convert to ICE (0–1). Default 0.06 */
  iceChance?: number;
  /** Number of Crystal power-ups to place. Default 2 */
  crystalCount?: number;
  /** Number of Freeze clocks to place. Default 1 */
  freezeCount?: number;
  /** Number of Bomb pickups to place. Default 2 */
  bombCount?: number;
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
 * Generates a perfect maze (no loops) using iterative DFS Recursive Backtracker.
 * Works on a grid where only odd-indexed cells are rooms; even-indexed cells start as walls.
 * Rows and cols must be odd numbers ≥ 5.
 */
export function generateMaze(options: MazeOptions): {
  grid: Grid;
  start: { row: number; col: number };
  exit: { row: number; col: number };
} {
  const {
    rows,
    cols,
    mudChance = 0.08,
    iceChance = 0.06,
    crystalCount = 2,
    freezeCount = 1,
    bombCount = 2,
  } = options;

  // Validate dimensions
  if (rows % 2 === 0 || cols % 2 === 0) {
    throw new Error('Maze dimensions must be odd numbers.');
  }

  // Seed-based LCG for reproducibility (timestamp-based seed for randomness)
  let seed = Date.now();
  const rng = () => {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    return (seed >>> 0) / 0x100000000;
  };

  // Initialize all cells as WALL
  const grid: Grid = Array.from({ length: rows }, () =>
    Array(cols).fill(CellType.WALL)
  );

  const visited = Array.from({ length: rows }, () => Array(cols).fill(false));

  // DFS from (1, 1) using iterative stack
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

      // Carve wall between current and neighbor
      grid[cur.r + dr / 2][cur.c + dc / 2] = CellType.FLOOR;
      grid[nr][nc] = CellType.FLOOR;
      visited[nr][nc] = true;

      stack.push({ r: nr, c: nc });
      moved = true;
      break;
    }

    if (!moved) stack.pop();
  }

  // Collect all floor cells
  const floorCells: { row: number; col: number }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === CellType.FLOOR) {
        floorCells.push({ row: r, col: c });
      }
    }
  }

  // Start is always top-left corner room
  const start = { row: 1, col: 1 };
  // Exit is always bottom-right corner room
  const exit = { row: rows - 2, col: cols - 2 };
  grid[exit.row][exit.col] = CellType.EXIT;

  // Shuffle floor cells (excluding start and exit) for terrain placement
  const placeable = floorCells.filter(
    p => !(p.row === start.row && p.col === start.col) &&
         !(p.row === exit.row && p.col === exit.col)
  );
  shuffle(placeable, rng);

  let idx = 0;

  // Place MUD
  const mudCount = Math.floor(placeable.length * mudChance);
  for (let i = 0; i < mudCount && idx < placeable.length; i++, idx++) {
    const { row, col } = placeable[idx];
    grid[row][col] = CellType.MUD;
  }

  // Place ICE
  const iceCount = Math.floor(placeable.length * iceChance);
  for (let i = 0; i < iceCount && idx < placeable.length; i++, idx++) {
    const { row, col } = placeable[idx];
    grid[row][col] = CellType.ICE;
  }

  // Place Crystals
  for (let i = 0; i < crystalCount && idx < placeable.length; i++, idx++) {
    const { row, col } = placeable[idx];
    grid[row][col] = CellType.CRYSTAL;
  }

  // Place Freeze Clocks
  for (let i = 0; i < freezeCount && idx < placeable.length; i++, idx++) {
    const { row, col } = placeable[idx];
    grid[row][col] = CellType.FREEZE_CLOCK;
  }

  // Place Bomb Pickups
  for (let i = 0; i < bombCount && idx < placeable.length; i++, idx++) {
    const { row, col } = placeable[idx];
    grid[row][col] = CellType.BOMB_PICKUP;
  }

  return { grid, start, exit };
}
