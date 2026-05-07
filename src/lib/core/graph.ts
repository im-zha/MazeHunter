// ============================================================
// graph.ts — Grid graph utilities for Maze Hunter
// ============================================================

import { CellType, EnemyTrait, type Grid, type LadderObject, type Pos } from './types.js';

// --------------- Terrain Costs ---------------

/**
 * Trả về chi phí di chuyển cho một loại ô cụ thể (dùng cho pathfinding chung).
 * BĂNG (ICE) = 0.5, SÀN/BRIDGE/EXIT/CRYSTAL/WEAPON_DROP = 1,
 * MUD = 10, STICKY = 2, NOISE/CRACK = 1,
 * TƯỜNG (WALL) = Infinity.
 * Lưu ý: LADDER đã bị loại khỏi CellType — nay là LadderObject entity.
 */
export function getCost(cell: CellType): number {
  switch (cell) {
    case CellType.ICE:          return 0.5;
    case CellType.FLOOR:        return 1;
    case CellType.EXIT:         return 1;
    case CellType.CRYSTAL:      return 1;
    case CellType.FREEZE_CLOCK: return 1;
    case CellType.BOMB_PICKUP:  return 1;
    case CellType.BRIDGE:       return 1;
    case CellType.CRACK:        return 1;
    case CellType.MUD:          return 10;  // cao = AI tìm đường vòng tránh bùn
    default:                    return Infinity; // WALL
  }
}

/**
 * Terrain cost adjusted for a specific enemy trait.
 * - BURROWER loves mud (cost 1).
 * - CLIMBER uses LADDERs efficiently (cost = length * 0.5 via getLadderEdges), penalised on ICE.
 * - HEAVY/ELITE treat mud at cost 5 (half of base 10).
 * - BOSS: mud cost 1.
 */
export function getCostForTrait(cell: CellType, trait: EnemyTrait): number {
  switch (trait) {
    case EnemyTrait.BURROWER:
      if (cell === CellType.MUD) return 1;
      return getCost(cell);

    case EnemyTrait.CLIMBER:
      if (cell === CellType.ICE) return 1.5;
      return getCost(cell);

    case EnemyTrait.HEAVY:
    case EnemyTrait.ELITE:
      if (cell === CellType.MUD) return 5;  // half of base 10
      return getCost(cell);

    case EnemyTrait.BOSS:
      if (cell === CellType.MUD) return 1;
      return getCost(cell);

    default:
      return getCost(cell);
  }
}

/**
 * Kiểm tra xem loại ô này có thể đi qua được hay không.
 */
export function isPassable(cell: CellType): boolean {
  return cell !== CellType.WALL;
}

/**
 * Passability check that respects enemy trait.
 */
export function isPassableForTrait(cell: CellType, _trait: EnemyTrait): boolean {
  return cell !== CellType.WALL;
}

// --------------- Position Utilities ---------------

/** Chuyển đổi tọa độ 2D → 1D index. */
export function posToId(pos: Pos, cols: number): number {
  return pos.row * cols + pos.col;
}

/** Chuyển đổi 1D index → tọa độ 2D. */
export function idToPos(id: number, cols: number): Pos {
  return { row: Math.floor(id / cols), col: id % cols };
}

/** Kiểm tra hai vị trí có trùng nhau không. */
export function posEqual(a: Pos, b: Pos): boolean {
  return a.row === b.row && a.col === b.col;
}

/** Crack-tile key. */
export function crackKey(pos: Pos): string {
  return `${pos.row},${pos.col}`;
}

// --------------- Neighbor Enumeration ---------------

const DIRECTIONS: Pos[] = [
  { row: -1, col: 0 }, // UP
  { row:  1, col: 0 }, // DOWN
  { row:  0, col: -1 }, // LEFT
  { row:  0, col:  1 }, // RIGHT
];

/**
 * Cấu trúc dữ liệu đại diện cho một ô lân cận kèm chi phí di chuyển.
 */
export interface Neighbor {
  /** Tọa độ của ô lân cận */
  pos: Pos;
  /** Chi phí di chuyển đến ô này */
  cost: number;
  /** Nếu true: đây là cạnh thang (teleport), không phải bước lưới bình thường */
  viaLadder?: boolean;
}

// --------------- Ladder Edge Injection ---------------

/**
 * Trả về các cạnh thang (ladder edges) xuất phát từ `pos`.
 * Nếu `pos` trùng với start hoặc end của một LadderObject,
 * thêm cạnh nối đến đầu kia với cost = ladder.length.
 *
 * CLIMBER trait: cost giảm 50% (thang là sở trường).
 * BURROWER trait: không thể dùng thang (trả về rỗng).
 */
export function getLadderEdges(
  pos: Pos,
  ladders: LadderObject[],
  trait: EnemyTrait = EnemyTrait.NONE
): Neighbor[] {
  // BURROWER trait: không thể leo thang
  if (trait === EnemyTrait.BURROWER) return [];

  const edges: Neighbor[] = [];
  for (const ladder of ladders) {
    const curIdx = ladder.path_nodes.findIndex(p => posEqual(p, pos));
    if (curIdx !== -1) {
      if (curIdx > 0) {
        edges.push({ pos: ladder.path_nodes[curIdx - 1], cost: 1, viaLadder: true });
      }
      if (curIdx < ladder.path_nodes.length - 1) {
        edges.push({ pos: ladder.path_nodes[curIdx + 1], cost: 1, viaLadder: true });
      }
    }
  }
  return edges;
}

/**
 * Trả về tất cả các ô lân cận (4 hướng) có thể đi qua,
 * cộng thêm các cạnh thang nếu `ladders` được cung cấp.
 */
export function getNeighbors(
  grid: Grid,
  pos: Pos,
  ladders: LadderObject[] = []
): Neighbor[] {
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

  // Inject ladder edges
  for (const edge of getLadderEdges(pos, ladders)) {
    neighbors.push(edge);
  }

  return neighbors;
}

/**
 * Neighbors with trait-aware cost/passability (used by enemy pathfinding).
 */
export function getNeighborsForTrait(
  grid: Grid,
  pos: Pos,
  trait: EnemyTrait,
  ladders: LadderObject[] = []
): Neighbor[] {
  const rows = grid.length;
  const cols = grid[0].length;
  const neighbors: Neighbor[] = [];

  for (const dir of DIRECTIONS) {
    const nr = pos.row + dir.row;
    const nc = pos.col + dir.col;

    if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;

    const cell = grid[nr][nc];
    if (!isPassableForTrait(cell, trait)) continue;

    const cost = getCostForTrait(cell, trait);
    if (cost === Infinity) continue;

    neighbors.push({ pos: { row: nr, col: nc }, cost });
  }

  // Inject ladder edges (trait-aware)
  for (const edge of getLadderEdges(pos, ladders, trait)) {
    neighbors.push(edge);
  }

  return neighbors;
}

/**
 * Unweighted neighbors (BFS/DFS).
 * Ladders are treated as distance-1 edges (teleport) for unweighted algorithms.
 */
export function getUnweightedNeighbors(
  grid: Grid,
  pos: Pos,
  ladders: LadderObject[] = []
): Pos[] {
  return getNeighbors(grid, pos, ladders).map(n => n.pos);
}

/**
 * Unweighted neighbors respecting trait (e.g. BURROWER can't use ladders).
 */
export function getUnweightedNeighborsForTrait(
  grid: Grid,
  pos: Pos,
  trait: EnemyTrait,
  ladders: LadderObject[] = []
): Pos[] {
  return getNeighborsForTrait(grid, pos, trait, ladders).map(n => n.pos);
}

// --------------- Manhattan Heuristic ---------------

/** Khoảng cách Manhattan — heuristic cho A*. */
export function manhattan(a: Pos, b: Pos): number {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}

// --------------- Grid Helpers ---------------

/** Tìm tất cả các tọa độ có chứa CellType cụ thể. */
export function findCells(grid: Grid, type: CellType): Pos[] {
  const result: Pos[] = [];
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      if (grid[r][c] === type) result.push({ row: r, col: c });
    }
  }
  return result;
}

/** Find all walkable cells (non-wall). */
export function findWalkable(grid: Grid): Pos[] {
  const result: Pos[] = [];
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      if (isPassable(grid[r][c])) result.push({ row: r, col: c });
    }
  }
  return result;
}