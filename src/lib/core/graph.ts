// ============================================================
// graph.ts — Grid graph utilities for Maze Hunter
// ============================================================

import { CellType, type Grid, type Pos } from './types.js';

// --------------- Terrain Costs ---------------

/** Returns the traversal cost for a given cell type. */
export function getCost(cell: CellType): number {
  switch (cell) {
    case CellType.ICE:     return 0.5;
    case CellType.FLOOR:   return 1;
    case CellType.EXIT:    return 1;
    case CellType.CRYSTAL: return 1;
    case CellType.MUD:     return 3;
    default:               return Infinity; // WALL
  }
}

/** Returns true if this cell type is passable (not a wall). */
export function isPassable(cell: CellType): boolean {
  return cell !== CellType.WALL;
}

// --------------- Position Utilities ---------------

/** Convert (row, col) to a flat array index. */
export function posToId(pos: Pos, cols: number): number {
  return pos.row * cols + pos.col;
}

/** Convert a flat array index back to (row, col). */
export function idToPos(id: number, cols: number): Pos {
  return { row: Math.floor(id / cols), col: id % cols };
}

/** Check if two positions are equal. */
export function posEqual(a: Pos, b: Pos): boolean {
  return a.row === b.row && a.col === b.col;
}

// --------------- Neighbor Enumeration ---------------

const DIRECTIONS: Pos[] = [
  { row: -1, col: 0 }, // UP
  { row:  1, col: 0 }, // DOWN
  { row:  0, col: -1 }, // LEFT
  { row:  0, col:  1 }, // RIGHT
];

export interface Neighbor {
  pos: Pos;
  cost: number;
}

/**
 * Returns all passable 4-directional neighbors of a given position.
 * Computes neighbors on-the-fly (implicit adjacency list).
 */
export function getNeighbors(grid: Grid, pos: Pos): Neighbor[] {
  const rows = grid.length;
  const cols = grid[0].length;
  const neighbors: Neighbor[] = [];

  for (const dir of DIRECTIONS) {
    const nr = pos.row + dir.row;
    const nc = pos.col + dir.col;

    if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;

    const cell = grid[nr][nc];
    if (!isPassable(cell)) continue;

    neighbors.push({ pos: { row: nr, col: nc }, cost: getCost(cell) });
  }

  return neighbors;
}

/**
 * Returns passable neighbors without terrain cost (for unweighted BFS/DFS).
 */
export function getUnweightedNeighbors(grid: Grid, pos: Pos): Pos[] {
  return getNeighbors(grid, pos).map(n => n.pos);
}

// --------------- Manhattan Heuristic ---------------

/** Manhattan distance — admissible heuristic for A* on a uniform grid. */
export function manhattan(a: Pos, b: Pos): number {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}

// --------------- Grid Helpers ---------------

/** Find all positions with a given CellType. */
export function findCells(grid: Grid, type: CellType): Pos[] {
  const result: Pos[] = [];
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      if (grid[r][c] === type) result.push({ row: r, col: c });
    }
  }
  return result;
}
