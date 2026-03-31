// ============================================================
// dsu.ts — Disjoint Set Union (Union-Find)
// ============================================================

/**
 * DSU with path compression and union by rank.
 * 
 * Used synchronously to check maze connectivity before accepting
 * a Wall Bomb placement. If placing a wall would disconnect any
 * enemy from the exit, the placement is rejected.
 */
export class DSU {
  private parent: Int32Array;
  private rank: Uint8Array;

  constructor(size: number) {
    this.parent = new Int32Array(size).map((_, i) => i);
    this.rank = new Uint8Array(size);
  }

  /** Find root with path compression (halving). */
  find(x: number): number {
    while (this.parent[x] !== x) {
      // Path compression: point to grandparent
      this.parent[x] = this.parent[this.parent[x]];
      x = this.parent[x];
    }
    return x;
  }

  /** Union by rank. Returns true if the two sets were disjoint (now merged). */
  union(x: number, y: number): boolean {
    const rx = this.find(x);
    const ry = this.find(y);
    if (rx === ry) return false;

    if (this.rank[rx] < this.rank[ry]) {
      this.parent[rx] = ry;
    } else if (this.rank[rx] > this.rank[ry]) {
      this.parent[ry] = rx;
    } else {
      this.parent[ry] = rx;
      this.rank[rx]++;
    }
    return true;
  }

  /** Returns true if x and y are in the same set. */
  connected(x: number, y: number): boolean {
    return this.find(x) === this.find(y);
  }
}

// --------------- Grid Connectivity Check ---------------

import { CellType, type Grid, type Pos } from '../core/types.js';
import { isPassable, posToId } from '../core/graph.js';

/**
 * Builds a DSU for all passable cells in the grid.
 * Connects each passable cell to its passable 4-directional neighbors.
 */
export function buildGridDSU(grid: Grid): DSU {
  const rows = grid.length;
  const cols = grid[0].length;
  const dsu = new DSU(rows * cols);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!isPassable(grid[r][c])) continue;

      const id = posToId({ row: r, col: c }, cols);

      // Connect right
      if (c + 1 < cols && isPassable(grid[r][c + 1])) {
        dsu.union(id, posToId({ row: r, col: c + 1 }, cols));
      }
      // Connect down
      if (r + 1 < rows && isPassable(grid[r + 1][c])) {
        dsu.union(id, posToId({ row: r + 1, col: c }, cols));
      }
    }
  }

  return dsu;
}

/**
 * Checks whether placing a WALL at `wallPos` would disconnect
 * any of the given `sources` from `target`.
 *
 * Returns true if the wall placement is SAFE (connectivity preserved).
 * Returns false if connectivity would be broken.
 */
export function isWallSafe(
  grid: Grid,
  wallPos: Pos,
  sources: Pos[],
  target: Pos
): boolean {
  const cols = grid[0].length;

  // Temporarily simulate the wall being placed
  // Build DSU ignoring the wallPos cell
  const rows = grid.length;
  const dsu = new DSU(rows * cols);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Skip the cell being walled
      if (r === wallPos.row && c === wallPos.col) continue;
      if (!isPassable(grid[r][c])) continue;

      const id = posToId({ row: r, col: c }, cols);

      if (c + 1 < cols && isPassable(grid[r][c + 1]) &&
          !(r === wallPos.row && c + 1 === wallPos.col)) {
        dsu.union(id, posToId({ row: r, col: c + 1 }, cols));
      }
      if (r + 1 < rows && isPassable(grid[r + 1][c]) &&
          !(r + 1 === wallPos.row && c === wallPos.col)) {
        dsu.union(id, posToId({ row: r + 1, col: c }, cols));
      }
    }
  }

  const targetId = posToId(target, cols);

  for (const source of sources) {
    // Source itself might be walled? (shouldn't happen but guard it)
    if (source.row === wallPos.row && source.col === wallPos.col) return false;

    const sourceId = posToId(source, cols);
    if (!dsu.connected(sourceId, targetId)) {
      return false;
    }
  }

  return true;
}
