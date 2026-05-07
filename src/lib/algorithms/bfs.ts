// ============================================================
// bfs.ts — Breadth-First Search (unweighted shortest path)
// ============================================================

import { EnemyTrait, type AlgoResult, type Grid, type LadderObject, type Pos } from '../core/types.js';
import { getUnweightedNeighbors, getUnweightedNeighborsForTrait, posEqual, posToId } from '../core/graph.js';

/**
 * Thuật toán BFS tìm đường ngắn nhất không trọng số.
 * Hỗ trợ trait-aware passability và cạnh thang (LadderObject).
 */
export function bfs(
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

    const neighbors = trait === EnemyTrait.NONE
      ? getUnweightedNeighbors(grid, cur, ladders)
      : getUnweightedNeighborsForTrait(grid, cur, trait, ladders);

    for (const neighbor of neighbors) {
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
 * BFS tìm khoảng cách xa nhất — dùng khi kẻ địch ở trạng thái bỏ chạy.
 */
export function maxDistanceBfs(
  grid: Grid,
  from: Pos,
  start: Pos,
  ladders: LadderObject[] = []
): Pos {
  const cols = grid[0].length;
  const visitedSet = new Set<number>();
  const queue: Pos[] = [start];
  visitedSet.add(posToId(start, cols));
  let farthest = start;

  while (queue.length > 0) {
    const cur = queue.shift()!;
    farthest = cur;

    for (const neighbor of getUnweightedNeighbors(grid, cur, ladders)) {
      const nId = posToId(neighbor, cols);
      if (!visitedSet.has(nId)) {
        visitedSet.add(nId);
        queue.push(neighbor);
      }
    }
  }

  return farthest;
}