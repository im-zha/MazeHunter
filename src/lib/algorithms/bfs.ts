// ============================================================
// bfs.ts — Breadth-First Search (unweighted shortest path)
// ============================================================

import { type AlgoResult, type Grid, type Pos } from '../core/types.js';
import { getUnweightedNeighbors, posEqual, posToId } from '../core/graph.js';

/**
 * BFS from `start` to `goal` on the given grid.
 * Returns path (start→goal inclusive), all visited positions (for debug overlay),
 * and compute time in ms.
 *
 * If no path exists, returns an empty path array but still returns all visited cells.
 */
export function bfs(grid: Grid, start: Pos, goal: Pos): AlgoResult {
  const t0 = performance.now();
  const cols = grid[0].length;

  const visited: Pos[] = [];
  const visitedSet = new Set<number>();
  const parent = new Map<number, number>();

  const queue: Pos[] = [start];
  const startId = posToId(start, cols);
  visitedSet.add(startId);
  parent.set(startId, -1);

  let found = false;

  while (queue.length > 0) {
    const cur = queue.shift()!;
    const curId = posToId(cur, cols);
    visited.push(cur);

    if (posEqual(cur, goal)) {
      found = true;
      break;
    }

    for (const neighbor of getUnweightedNeighbors(grid, cur)) {
      const nId = posToId(neighbor, cols);
      if (!visitedSet.has(nId)) {
        visitedSet.add(nId);
        parent.set(nId, curId);
        queue.push(neighbor);
      }
    }
  }

  const path: Pos[] = [];
  if (found) {
    // Reconstruct path from goal → start, then reverse
    const rows = grid.length;
    let cur = posToId(goal, cols);
    while (cur !== -1) {
      const row = Math.floor(cur / cols);
      const col = cur % cols;
      path.unshift({ row, col });
      cur = parent.get(cur) ?? -1;
    }
  }

  return {
    path,
    visited,
    computeMs: performance.now() - t0,
  };
}

/**
 * Max-distance BFS — find the position reachable from `start` with
 * the greatest BFS distance from `from`. Used for enemy flee targeting.
 */
export function maxDistanceBfs(grid: Grid, from: Pos, start: Pos): Pos {
  const cols = grid[0].length;
  const visitedSet = new Set<number>();
  const queue: Pos[] = [start];
  visitedSet.add(posToId(start, cols));
  let farthest = start;

  while (queue.length > 0) {
    const cur = queue.shift()!;
    farthest = cur;

    for (const neighbor of getUnweightedNeighbors(grid, cur)) {
      const nId = posToId(neighbor, cols);
      if (!visitedSet.has(nId)) {
        visitedSet.add(nId);
        queue.push(neighbor);
      }
    }
  }

  return farthest;
}
