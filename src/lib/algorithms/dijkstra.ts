// ============================================================
// dijkstra.ts — Dijkstra's Algorithm (weighted shortest path)
// ============================================================

import { type AlgoResult, type Grid, type Pos } from '../core/types.js';
import { getNeighbors, posEqual, posToId } from '../core/graph.js';

// --------------- Min-Heap (Binary Heap) ---------------

interface HeapNode {
  pos: Pos;
  dist: number;
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
      if (this.heap[parent].dist <= this.heap[i].dist) break;
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
      if (l < n && this.heap[l].dist < this.heap[smallest].dist) smallest = l;
      if (r < n && this.heap[r].dist < this.heap[smallest].dist) smallest = r;
      if (smallest === i) break;
      [this.heap[smallest], this.heap[i]] = [this.heap[i], this.heap[smallest]];
      i = smallest;
    }
  }
}

// --------------- Dijkstra ---------------

/**
 * Dijkstra's shortest path on a weighted grid.
 * Terrain costs: ICE=0.5, FLOOR=1, MUD=3, WALL=Inf.
 */
export function dijkstra(grid: Grid, start: Pos, goal: Pos): AlgoResult {
  const t0 = performance.now();
  const cols = grid[0].length;

  const dist = new Map<number, number>();
  const parent = new Map<number, number>();
  const visited: Pos[] = [];
  const visitedSet = new Set<number>();

  const startId = posToId(start, cols);
  dist.set(startId, 0);
  parent.set(startId, -1);

  const heap = new MinHeap();
  heap.push({ pos: start, dist: 0 });

  let found = false;

  while (heap.size > 0) {
    const { pos: cur, dist: curDist } = heap.pop()!;
    const curId = posToId(cur, cols);

    if (visitedSet.has(curId)) continue;
    visitedSet.add(curId);
    visited.push(cur);

    if (posEqual(cur, goal)) {
      found = true;
      break;
    }

    for (const { pos: neighbor, cost } of getNeighbors(grid, cur)) {
      const nId = posToId(neighbor, cols);
      if (visitedSet.has(nId)) continue;

      const newDist = curDist + cost;
      const existingDist = dist.get(nId) ?? Infinity;

      if (newDist < existingDist) {
        dist.set(nId, newDist);
        parent.set(nId, curId);
        heap.push({ pos: neighbor, dist: newDist });
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
