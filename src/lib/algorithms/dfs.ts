// ============================================================
// dfs.ts — Iterative Depth-First Search
// ============================================================

import { EnemyTrait, type AlgoResult, type Grid, type LadderObject, type Pos } from '../core/types.js';
import { getUnweightedNeighbors, getUnweightedNeighborsForTrait, posEqual, posToId } from '../core/graph.js';

/**
 * Thuật toán DFS lặp (không đảm bảo tìm đường ngắn nhất).
 * Tạo ra đường đi ngoằn ngoèo cho kẻ địch Shadow.
 * Hỗ trợ trait-aware passability và cạnh thang (LadderObject).
 */
export function dfs(
  grid: Grid,
  start: Pos,
  goal: Pos,
  trait: EnemyTrait = EnemyTrait.NONE,
  ladders: LadderObject[] = []
): AlgoResult {
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

    const neighbors = trait === EnemyTrait.NONE
      ? getUnweightedNeighbors(grid, cur, ladders)
      : getUnweightedNeighborsForTrait(grid, cur, trait, ladders);

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