// ============================================================
// astar.ts — A* Search (weighted + heuristic)
// ============================================================

import { EnemyTrait, type AlgoResult, type Grid, type LadderObject, type Pos } from '../core/types.js';
import { getNeighbors, getNeighborsForTrait, manhattan, posEqual, posToId } from '../core/graph.js';

// --------------- Min-Heap ---------------

interface HeapNode {
  pos: Pos;
  f: number;
}

class MinHeap {
  private heap: HeapNode[] = [];
  get size() { return this.heap.length; }

  push(node: HeapNode) {
    this.heap.push(node);
    this._bubbleUp(this.heap.length - 1);
  }

  pop(): HeapNode | undefined {
    const top = this.heap[0];
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this._sinkDown(0);
    }
    return top;
  }

  private _bubbleUp(i: number) {
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (this.heap[parent].f <= this.heap[i].f) break;
      [this.heap[parent], this.heap[i]] = [this.heap[i], this.heap[parent]];
      i = parent;
    }
  }

  private _sinkDown(i: number) {
    const n = this.heap.length;
    while (true) {
      let smallest = i;
      const l = 2 * i + 1;
      const r = 2 * i + 2;
      if (l < n && this.heap[l].f < this.heap[smallest].f) smallest = l;
      if (r < n && this.heap[r].f < this.heap[smallest].f) smallest = r;
      if (smallest === i) break;
      [this.heap[smallest], this.heap[i]] = [this.heap[i], this.heap[smallest]];
      i = smallest;
    }
  }
}

// --------------- A* ---------------

/**
 * Thuật toán A* kết hợp heuristic Manhattan và trọng số địa hình.
 * Hỗ trợ trait-aware cost và cạnh thang (LadderObject) qua tham số tùy chọn.
 */
export function astar(
  grid: Grid,
  start: Pos,
  goal: Pos,
  trait: EnemyTrait = EnemyTrait.NONE,
  ladders: LadderObject[] = []
): AlgoResult {
  const t0 = performance.now();
  const cols = grid[0].length;

  const g = new Map<number, number>();
  const parent = new Map<number, number>();
  const visited: Pos[] = [];
  const closedSet = new Set<number>();

  const startId = posToId(start, cols);
  g.set(startId, 0);
  parent.set(startId, -1);

  const heap = new MinHeap();
  heap.push({ pos: start, f: manhattan(start, goal) });

  let found = false;

  while (heap.size > 0) {
    const { pos: cur } = heap.pop()!;
    const curId = posToId(cur, cols);

    if (closedSet.has(curId)) continue;
    closedSet.add(curId);
    visited.push(cur);

    if (posEqual(cur, goal)) {
      found = true;
      break;
    }

    const curG = g.get(curId) ?? Infinity;

    const neighbors = trait === EnemyTrait.NONE
      ? getNeighbors(grid, cur, ladders)
      : getNeighborsForTrait(grid, cur, trait, ladders);

    for (const { pos: neighbor, cost } of neighbors) {
      const nId = posToId(neighbor, cols);
      if (closedSet.has(nId)) continue;

      const tentativeG = curG + cost;
      const existingG = g.get(nId) ?? Infinity;

      if (tentativeG < existingG) {
        g.set(nId, tentativeG);
        parent.set(nId, curId);
        const f = tentativeG + manhattan(neighbor, goal);
        heap.push({ pos: neighbor, f });
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