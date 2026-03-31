// ============================================================
// renderer.ts — Canvas 2D draw pipeline
// ============================================================

import { CellType, type EnemyState, type GameState, type Pos } from '../core/types.js';
import { ENEMY_COLORS } from '../entities/enemy.js';

// --------------- Cell Colors — high contrast ---------------
// Walls: very dark charcoal. Floors: clear blue-navy. Easy to distinguish.
const CELL_COLORS: Record<CellType, string> = {
  [CellType.WALL]:    '#0e0e1a',
  [CellType.FLOOR]:   '#1e2d4a',
  [CellType.MUD]:     '#5c3d1e',
  [CellType.ICE]:     '#7ee8fa',
  [CellType.EXIT]:    '#00ff87',
  [CellType.CRYSTAL]: '#f72585',
  [CellType.FREEZE_CLOCK]: '#1e2d4a',
  [CellType.BOMB_PICKUP]: '#1e2d4a',
};

const WALL_INSET     = '#090912';
const WALL_HIGHLIGHT = 'rgba(255,255,255,0.05)';
const PLAYER_COLOR   = '#39ff14';
const PLAYER_GLOW    = 'rgba(57,255,20,0.5)';
const DEBUG_PATH_ALPHA = 0.7;

// --------------- Renderer ---------------

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private fogCanvas: OffscreenCanvas | HTMLCanvasElement;
  private fogCtx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;
  private tileSize: number;
  private _pulse = 0;

  constructor(canvas: HTMLCanvasElement, tileSize = 32) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');
    this.ctx = ctx;
    this.tileSize = tileSize;

    // Offscreen canvas for fog — keeps destination-out from wiping entities
    if (typeof OffscreenCanvas !== 'undefined') {
      this.fogCanvas = new OffscreenCanvas(1, 1);
    } else {
      this.fogCanvas = document.createElement('canvas');
    }
    const fogCtx = this.fogCanvas.getContext('2d') as
      OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;
    if (!fogCtx) throw new Error('Could not get fog 2D context');
    this.fogCtx = fogCtx;
  }

  setTileSize(ts: number) { this.tileSize = ts; }

  // --------------- Main Render ---------------

  render(state: GameState) {
    const { ctx, tileSize } = this;
    const { grid, player, enemies, debugMode } = state;
    if (!grid.length) return;

    const rows = grid.length;
    const cols = grid[0].length;
    const W = cols * tileSize;
    const H = rows * tileSize;

    this._pulse += 0.06;
    ctx.clearRect(0, 0, W, H);

    // 1. Terrain
    this._drawGrid(grid);

    // 2. Debug visited (under fog)
    if (debugMode) this._drawDebugVisited(enemies);

    // 3. Fog (offscreen → composite onto main canvas)
    if (state.fogEnabled) {
      this._buildFogCanvas(W, H, player.pos, player.fogRadius);
      ctx.drawImage(this.fogCanvas as HTMLCanvasElement, 0, 0);
    }

    // 4. Entities above fog
    this._drawEnemies(enemies);
    this._drawPlayer(player.pos);

    // 5. Debug paths above fog
    if (debugMode) this._drawDebugPaths(enemies);

    // 6. Exit beacon — always visible, drawn last so it shows through fog
    this._drawExitBeacon(grid);
  }

  // --------------- Terrain ---------------

  private _drawGrid(grid: CellType[][]) {
    const { ctx, tileSize } = this;
    const rows = grid.length;
    const cols = grid[0].length;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = grid[r][c];
        const x = c * tileSize;
        const y = r * tileSize;

        ctx.fillStyle = CELL_COLORS[cell];
        ctx.fillRect(x, y, tileSize, tileSize);

        if (cell === CellType.WALL) {
          ctx.fillStyle = WALL_INSET;
          ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);
          ctx.fillStyle = WALL_HIGHLIGHT;
          ctx.fillRect(x, y, tileSize, 2);
          ctx.fillRect(x, y, 2, tileSize);
        }

        if (cell === CellType.FLOOR) {
          ctx.strokeStyle = 'rgba(255,255,255,0.04)';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(x + 0.5, y + 0.5, tileSize - 1, tileSize - 1);
        }

        if (cell === CellType.MUD) {
          ctx.fillStyle = 'rgba(0,0,0,0.25)';
          for (let i = 0; i < tileSize; i += 6) ctx.fillRect(x + i, y, 1, tileSize);
        }

        if (cell === CellType.ICE) {
          ctx.fillStyle = 'rgba(255,255,255,0.35)';
          ctx.fillRect(x + 3, y + 3, tileSize * 0.35, 3);
          ctx.fillStyle = 'rgba(255,255,255,0.15)';
          ctx.fillRect(x + 3, y + 8, tileSize * 0.2, 2);
        }

        if (cell === CellType.CRYSTAL) {
          ctx.save();
          ctx.shadowColor = '#f72585';
          ctx.shadowBlur = 16;
          ctx.fillStyle = '#f72585';
          const s = tileSize * 0.38;
          const cx2 = x + tileSize / 2;
          const cy2 = y + tileSize / 2;
          ctx.beginPath();
          ctx.moveTo(cx2,       cy2 - s);
          ctx.lineTo(cx2 + s * 0.6, cy2);
          ctx.lineTo(cx2,       cy2 + s);
          ctx.lineTo(cx2 - s * 0.6, cy2);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }

        if (cell === CellType.FREEZE_CLOCK) {
          ctx.save();
          const cx2 = x + tileSize / 2;
          const cy2 = y + tileSize / 2;
          ctx.shadowColor = '#00e5ff';
          ctx.shadowBlur = 12;
          ctx.fillStyle = '#00e5ff';
          ctx.font = `bold ${Math.round(tileSize * 0.6)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🕒', cx2, cy2);
          ctx.restore();
        }

        if (cell === CellType.BOMB_PICKUP) {
          ctx.save();
          const cx2 = x + tileSize / 2;
          const cy2 = y + tileSize / 2;
          ctx.shadowColor = '#b82ff7';
          ctx.shadowBlur = 12;
          ctx.fillStyle = '#b82ff7';
          ctx.font = `bold ${Math.round(tileSize * 0.6)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('💣', cx2, cy2);
          ctx.restore();
        }

        if (cell === CellType.EXIT) {
          ctx.fillStyle = 'rgba(0,255,135,0.2)';
          ctx.fillRect(x, y, tileSize, tileSize);
        }
      }
    }
  }

  // --------------- Exit Beacon — Always Visible ---------------

  private _drawExitBeacon(grid: CellType[][]) {
    const { ctx, tileSize } = this;
    const rows = grid.length;
    const cols = grid[0].length;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c] !== CellType.EXIT) continue;

        const x = c * tileSize;
        const y = r * tileSize;
        const cx = x + tileSize / 2;
        const cy = y + tileSize / 2;
        const pulse = Math.sin(this._pulse) * 0.5 + 0.5; // 0→1

        // Pulsing outer ring
        ctx.save();
        ctx.globalAlpha = 0.4 + pulse * 0.5;
        ctx.shadowColor  = '#00ff87';
        ctx.shadowBlur   = 20 + pulse * 18;
        ctx.strokeStyle  = '#00ff87';
        ctx.lineWidth    = 2.5;
        ctx.beginPath();
        ctx.arc(cx, cy, tileSize * 0.47, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Star icon
        ctx.save();
        ctx.shadowColor = '#00ff87';
        ctx.shadowBlur  = 18;
        ctx.fillStyle   = '#00ff87';
        ctx.globalAlpha = 0.9;
        ctx.font = `bold ${Math.round(tileSize * 0.6)}px sans-serif`;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('★', cx, cy);
        ctx.restore();

        // "EXIT" label above
        ctx.save();
        ctx.font         = `bold ${Math.max(9, Math.round(tileSize * 0.28))}px sans-serif`;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillStyle    = '#00ff87';
        ctx.shadowColor  = '#00ff87';
        ctx.shadowBlur   = 10;
        ctx.globalAlpha  = 0.95;
        ctx.fillText('EXIT', cx, y - 2);
        ctx.restore();
      }
    }
  }

  // --------------- Fog of War (Offscreen Canvas) ---------------

  private _buildFogCanvas(W: number, H: number, playerPos: Pos, radius: number) {
    const { tileSize } = this;
    const fc   = this.fogCanvas;
    const fctx = this.fogCtx;

    fc.width  = W;
    fc.height = H;

    const px = playerPos.col * tileSize + tileSize / 2;
    const py = playerPos.row * tileSize + tileSize / 2;
    const gradRadius = (radius + 1.5) * tileSize;

    // Dark base
    fctx.fillStyle = 'rgba(0,0,0,0.90)';
    fctx.fillRect(0, 0, W, H);

    // Punch transparent hole around player
    fctx.save();
    fctx.globalCompositeOperation = 'destination-out';
    const grad = fctx.createRadialGradient(px, py, tileSize * 0.3, px, py, gradRadius);
    grad.addColorStop(0,    'rgba(0,0,0,1)');
    grad.addColorStop(0.5,  'rgba(0,0,0,0.97)');
    grad.addColorStop(0.78, 'rgba(0,0,0,0.55)');
    grad.addColorStop(1,    'rgba(0,0,0,0)');
    fctx.fillStyle = grad;
    fctx.beginPath();
    fctx.arc(px, py, gradRadius, 0, Math.PI * 2);
    fctx.fill();
    fctx.restore();
  }

  // --------------- Entities ---------------

  private _drawPlayer(pos: Pos) {
    const { ctx, tileSize } = this;
    const cx = pos.col * tileSize + tileSize / 2;
    const cy = pos.row * tileSize + tileSize / 2;
    const r  = tileSize * 0.36;

    ctx.save();
    ctx.shadowColor = PLAYER_GLOW;
    ctx.shadowBlur  = 22;
    ctx.fillStyle   = PLAYER_COLOR;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    // White center dot
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private _drawEnemies(enemies: EnemyState[]) {
    const { ctx, tileSize } = this;

    for (const enemy of enemies) {
      const color = ENEMY_COLORS[enemy.algoType];
      const cx = enemy.pos.col * tileSize + tileSize / 2;
      const cy = enemy.pos.row * tileSize + tileSize / 2;
      const r  = tileSize * 0.33;

      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur  = 16;

      if (enemy.mode === 'FLEE') {
        ctx.fillStyle   = 'rgba(255,255,255,0.9)';
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth   = 2;
        ctx.stroke();
      } else {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.beginPath();
        ctx.arc(cx + r * 0.3, cy - r * 0.2, r * 0.25, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // --------------- Debug Overlay ---------------

  private _drawDebugVisited(enemies: EnemyState[]) {
    const { ctx, tileSize } = this;
    for (const enemy of enemies) {
      ctx.globalAlpha = 0.13;
      ctx.fillStyle   = ENEMY_COLORS[enemy.algoType];
      for (const pos of enemy.visitedCache) {
        ctx.fillRect(pos.col * tileSize, pos.row * tileSize, tileSize, tileSize);
      }
    }
    ctx.globalAlpha = 1;
  }

  private _drawDebugPaths(enemies: EnemyState[]) {
    const { ctx, tileSize } = this;
    for (const enemy of enemies) {
      const path = enemy.pathCache;
      if (path.length < 1) continue;

      ctx.save();
      ctx.globalAlpha = DEBUG_PATH_ALPHA;
      ctx.strokeStyle = ENEMY_COLORS[enemy.algoType];
      ctx.lineWidth   = 3;
      ctx.lineCap     = 'round';
      ctx.lineJoin    = 'round';
      ctx.beginPath();
      ctx.moveTo(
        enemy.pos.col * tileSize + tileSize / 2,
        enemy.pos.row * tileSize + tileSize / 2
      );
      for (const pos of path) {
        ctx.lineTo(pos.col * tileSize + tileSize / 2, pos.row * tileSize + tileSize / 2);
      }
      ctx.stroke();
      ctx.restore();
    }
  }

  resize(canvas: HTMLCanvasElement, rows: number, cols: number) {
    canvas.width  = cols * this.tileSize;
    canvas.height = rows * this.tileSize;
  }
}
