// ============================================================
// dsu.ts — Disjoint Set Union (Union-Find)
// ============================================================

/**
 * Cấu trúc dữ liệu Disjoint Set Union (DSU / Union-Find) với tối ưu hóa 
 * nén đường đi (path compression) và gộp theo hạng (union by rank).
 * * Được sử dụng đồng bộ để kiểm tra tính liên thông của mê cung trước khi 
 * chấp nhận việc đặt một quả Bom Tường (Wall Bomb). Nếu việc đặt một bức tường 
 * làm ngắt kết nối đường đi của bất kỳ kẻ địch nào đến lối ra, hành động đó sẽ bị từ chối.
 */
export class DSU {
  /** Thuộc tính parent. */
    private parent: Int32Array;
  /** Thuộc tính rank. */
    private rank: Uint8Array;

  /**
   * Khởi tạo cấu trúc DSU.
   * @param size Tổng số phần tử trong DSU.
   */
  constructor(size: number) {
    this.parent = new Int32Array(size).map((_, i) => i);
    this.rank = new Uint8Array(size);
  }

  /** * Tìm phần tử gốc (root) của tập hợp chứa `x` kết hợp kỹ thuật 
   * nén đường đi (chia đôi - halving) để tối ưu hóa tốc độ cho các lần tìm sau. 
   */
  find(x: number): number {
    while (this.parent[x] !== x) {
      // Nén đường đi: trỏ trực tiếp đến phần tử "ông" (grandparent)
      this.parent[x] = this.parent[this.parent[x]];
      x = this.parent[x];
    }
    return x;
  }

  /** * Gộp (Union) hai tập hợp chứa `x` và `y` dựa trên hạng (rank). 
   * @returns `true` nếu hai tập hợp này ban đầu rời rạc (và bây giờ đã được gộp thành công), 
   * `false` nếu chúng đã nằm trong cùng một tập hợp. 
   */
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

  /** * Kiểm tra xem phần tử `x` và `y` có nằm trong cùng một tập hợp (có liên thông) hay không. 
   */
  connected(x: number, y: number): boolean {
    return this.find(x) === this.find(y);
  }
}

// --------------- Grid Connectivity Check ---------------

import { CellType, type Grid, type Pos } from '../core/types.js';
import { isPassable, posToId } from '../core/graph.js';

/**
 * Xây dựng cấu trúc DSU cho tất cả các ô có thể đi qua (passable) trên lưới.
 * Hàm này kết nối mỗi ô có thể đi qua với các ô lân cận của nó (theo 4 hướng) 
 * cũng có thể đi qua.
 * @param grid Bảng đồ thị 2D hiện tại.
 */
export function buildGridDSU(grid: Grid): DSU {
  const rows = grid.length;
  const cols = grid[0].length;
  const dsu = new DSU(rows * cols);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!isPassable(grid[r][c])) continue;

      const id = posToId({ row: r, col: c }, cols);

      // Kết nối với ô bên phải
      if (c + 1 < cols && isPassable(grid[r][c + 1])) {
        dsu.union(id, posToId({ row: r, col: c + 1 }, cols));
      }
      // Kết nối với ô phía dưới
      if (r + 1 < rows && isPassable(grid[r + 1][c])) {
        dsu.union(id, posToId({ row: r + 1, col: c }, cols));
      }
    }
  }

  return dsu;
}

/**
 * Kiểm tra xem việc đặt một bức TƯỜNG (WALL) tại vị trí `wallPos` 
 * có làm ngắt kết nối từ bất kỳ vị trí nào trong danh sách `sources` 
 * đến vị trí đích `target` hay không.
 *
 * @returns `true` nếu việc đặt tường là AN TOÀN (tính liên thông vẫn được giữ nguyên).
 * Trả về `false` nếu việc đặt tường sẽ phá vỡ tính liên thông (chặn đường đi).
 */
export function isWallSafe(
  grid: Grid,
  wallPos: Pos,
  sources: Pos[],
  target: Pos
): boolean {
  const cols = grid[0].length;

  // Tạm thời mô phỏng việc bức tường đã được đặt
  // Xây dựng DSU nhưng bỏ qua ô tại vị trí wallPos
  const rows = grid.length;
  const dsu = new DSU(rows * cols);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Bỏ qua ô đang bị đặt tường
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
    // Chính vị trí bắt đầu lại bị đặt tường? (Điều này không nên xảy ra nhưng cần chặn lỗi)
    if (source.row === wallPos.row && source.col === wallPos.col) return false;

    const sourceId = posToId(source, cols);
    if (!dsu.connected(sourceId, targetId)) {
      return false; // Bị ngắt kết nối
    }
  }

  return true; // An toàn
}