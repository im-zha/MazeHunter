// ============================================================
// dfs.ts — Iterative Depth-First Search
// ============================================================

import { type AlgoResult, type Grid, type Pos } from '../core/types.js';
import { getUnweightedNeighbors, posEqual, posToId } from '../core/graph.js';

/**
 * Iterative DFS from `start` to `goal`.
 * Does NOT guarantee shortest path — produces a winding, unpredictable path
 * which makes the Shadow enemy feel erratic and scary.
 *
 * Returns full visited list for debug overlay.
 */
export function dfs(grid: Grid, start: Pos, goal: Pos): AlgoResult {
  const t0 = performance.now();
  const cols = grid[0].length;

  const visited: Pos[] = [];
  const visitedSet = new Set<number>();
  const parent = new Map<number, number>();

  const startId = posToId(start, cols);
  parent.set(startId, -1);

  const stack: Pos[] = [start];
  let found = false;

  while (stack.length > 0) {
    const cur = stack.pop()!;
    const curId = posToId(cur, cols);

    if (visitedSet.has(curId)) continue;
    visitedSet.add(curId);
    visited.push(cur);

    if (posEqual(cur, goal)) {
      found = true;
      break;
    }

    // Push neighbors in reverse order so we process them in natural order
    const neighbors = getUnweightedNeighbors(grid, cur);
    for (let i = neighbors.length - 1; i >= 0; i--) {
      const neighbor = neighbors[i];
      const nId = posToId(neighbor, cols);
      if (!visitedSet.has(nId) && !parent.has(nId)) {
        parent.set(nId, curId);
        stack.push(neighbor);
      }
    }
  }

  const path: Pos[] = [];
  if (found) {
    let cur = posToId(goal, cols);
    while (cur !== -1) {
      path.unshift({ row: Math.floor(cur / cols), col: cur % cols });
      cur = parent.get(cur) ?? -1;
    }
  }

  return { path, visited, computeMs: performance.now() - t0 };
}
