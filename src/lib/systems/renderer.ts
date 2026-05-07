// ============================================================
// renderer.ts — Canvas 2D draw pipeline (3-round expansion)
// ============================================================

import {
  CellType,
  EnemyTrait,
  GamePhase,
  type EnemyState,
  type GameState,
  type LadderObject,
  type Pos,
} from '../core/types.js';
import { ENEMY_COLORS, TRAIT_COLORS } from '../entities/enemy.js';
import { getRoundIntro } from './wave-manager.js';

// --------------- Cell Colors ---------------
const CELL_COLORS: Partial<Record<CellType, string>> = {
  [CellType.WALL]:         '#0e0e1a',
  [CellType.FLOOR]:        '#1e2d4a',
  [CellType.MUD]:          '#5c3d1e',
  [CellType.ICE]:          '#7ee8fa',
  [CellType.EXIT]:         '#00ff87',
  [CellType.CRYSTAL]:      '#f72585',
  [CellType.FREEZE_CLOCK]: '#1e2d4a',
  [CellType.BOMB_PICKUP]:  '#1e2d4a',
  // LADDER removed from grid — now rendered as LadderObject overlay
  [CellType.BRIDGE]:       '#8b6914',
  [CellType.CRACK]:        '#4a3a28',
};

const WALL_INSET     = '#090912';
const WALL_HIGHLIGHT = 'rgba(255,255,255,0.05)';
const PLAYER_COLOR   = '#39ff14';
const PLAYER_GLOW    = 'rgba(57,255,20,0.5)';
const DEBUG_PATH_ALPHA = 0.7;

/** Lớp đại diện cho Renderer. */
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
    const { ctx } = this;
    const { grid, player, enemies, debugMode } = state;
    if (!grid.length) return;

    const rows = grid.length;
    const cols = grid[0].length;
    
    // Dynamic Cell Size Calculation
    const canvas = ctx.canvas;
    if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    
    // Padding for UI elements (HUD top and bottom)
    const HUD_PADDING_Y = 80;  // 40px top, 40px bottom
    const HUD_PADDING_X = 16;  // 8px left/right
    
    const usableWidth = Math.max(1, canvas.width - HUD_PADDING_X);
    const usableHeight = Math.max(1, canvas.height - HUD_PADDING_Y);
    
    this.tileSize = Math.min(usableWidth / cols, usableHeight / rows);
    const tileSize = this.tileSize;

    const mazeWidth = cols * tileSize;
    const mazeHeight = rows * tileSize;
    const offsetX = (canvas.width - mazeWidth) / 2;
    const offsetY = (canvas.height - mazeHeight) / 2;

    this._pulse += 0.06;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Round intro overlay
    if (state.phase === GamePhase.ROUND_INTRO) {
      this._drawRoundIntro(canvas.width, canvas.height, state.round);
      return;
    }

    // 1. Terrain
    this._drawGrid(grid, offsetX, offsetY);

    // 2. Ladder overlay (above terrain, below weapon drops)
    this._drawLadders(state.ladders ?? [], offsetX, offsetY);

    // 4. Debug visited
    if (debugMode) this._drawDebugVisited(enemies, offsetX, offsetY);

    // 5. Fog
    if (state.fogEnabled) {
      this._buildFogCanvas(canvas.width, canvas.height, player.pos, player.fogRadius, offsetX, offsetY);
      ctx.drawImage(this.fogCanvas as HTMLCanvasElement, 0, 0);
    }

    // 6. Entities
    this._drawEnemies(enemies, offsetX, offsetY);
    this._drawPlayer(player, state, offsetX, offsetY);

    // 7. Debug paths
    if (debugMode) this._drawDebugPaths(enemies, offsetX, offsetY);

    // 8. Exit beacon
    this._drawExitBeacon(grid, offsetX, offsetY);

    // 9. HUD overlays on canvas
    this._drawEventLabel(canvas.width, canvas.height, state);
  }

  // --------------- Round Intro ---------------

  private _drawRoundIntro(W: number, H: number, round: number) {
    const { ctx } = this;
    const intro = getRoundIntro(round);

    // Dark background
    ctx.fillStyle = '#070714';
    ctx.fillRect(0, 0, W, H);

    // Glowing title
    const titleSize = Math.max(18, Math.min(32, W / 18));
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `900 ${titleSize}px 'Outfit', sans-serif`;
    ctx.shadowColor  = round === 3 ? '#ff4757' : round === 2 ? '#f97316' : '#39ff14';
    ctx.shadowBlur   = 30;
    ctx.fillStyle    = round === 3 ? '#ff4757' : round === 2 ? '#f97316' : '#39ff14';
    ctx.fillText(intro.title, W / 2, H / 2 - titleSize * intro.lines.length * 0.65);
    ctx.restore();

    // Lines
    const lineSize = Math.max(10, Math.min(15, W / 30));
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${lineSize}px 'Outfit', sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.shadowBlur = 0;
    intro.lines.forEach((line, i) => {
      ctx.fillText(line, W / 2, H / 2 + i * (lineSize + 6));
    });
    ctx.restore();

    // "Get ready!" pulsing text
    const pulse = Math.sin(this._pulse * 2) * 0.5 + 0.5;
    ctx.save();
    ctx.globalAlpha = 0.5 + pulse * 0.5;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${lineSize + 2}px 'Outfit', sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Get ready!', W / 2, H / 2 + intro.lines.length * (lineSize + 6) + 20);
    ctx.restore();
  }

  // --------------- Terrain ---------------

  private _drawGrid(grid: CellType[][], offsetX: number, offsetY: number) {
    const { ctx, tileSize } = this;
    const rows = grid.length;
    const cols = grid[0].length;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = grid[r][c];
        const x = offsetX + c * tileSize;
        const y = offsetY + r * tileSize;

        ctx.fillStyle = CELL_COLORS[cell] ?? '#1e2d4a';
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


        if (cell === CellType.BRIDGE) {
          // Planks
          ctx.fillStyle = '#6b4a10';
          ctx.fillRect(x + 1, y + tileSize * 0.3, tileSize - 2, tileSize * 0.4);
          ctx.fillStyle = 'rgba(255,200,100,0.18)';
          for (let i = 0; i < tileSize; i += 5) {
            ctx.fillRect(x + i, y + tileSize * 0.3, 2, tileSize * 0.4);
          }
        }


        if (cell === CellType.CRACK) {
          ctx.save();
          ctx.strokeStyle = 'rgba(200,160,80,0.6)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x + tileSize * 0.2, y + tileSize * 0.2);
          ctx.lineTo(x + tileSize * 0.8, y + tileSize * 0.8);
          ctx.moveTo(x + tileSize * 0.5, y + tileSize * 0.1);
          ctx.lineTo(x + tileSize * 0.3, y + tileSize * 0.9);
          ctx.stroke();
          ctx.restore();
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
          ctx.moveTo(cx2, cy2 - s);
          ctx.lineTo(cx2 + s * 0.6, cy2);
          ctx.lineTo(cx2, cy2 + s);
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

  // --------------- Ladder Overlay ---------------

  /**
   * Vẽ tất cả LadderObject như các overlay nổi trên bản đồ.
   * Mỗi thang được vẽ từ pixel của start_node đến pixel của end_node,
   * với thanh ray + bậy ngang lặp lại theo chiều dài, tạo cảm giác cây thang liền mạch.
   */
  private _drawLadders(ladders: LadderObject[], offsetX: number, offsetY: number) {
    if (!ladders.length) return;
    const { ctx, tileSize } = this;
    const half = tileSize / 2;

    for (const ladder of ladders) {
      if (!ladder.path_nodes || ladder.path_nodes.length < 2) continue;

      ctx.save();
      // --- Shadow under the ladder ---
      ctx.shadowColor = 'rgba(0,0,0,0.55)';
      ctx.shadowBlur  = 6;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      const RAIL_OFFSET = tileSize * 0.22;
      
      for (let i = 0; i < ladder.path_nodes.length - 1; i++) {
        const sx = offsetX + ladder.path_nodes[i].col * tileSize + half;
        const sy = offsetY + ladder.path_nodes[i].row * tileSize + half;
        const ex = offsetX + ladder.path_nodes[i+1].col * tileSize + half;
        const ey = offsetY + ladder.path_nodes[i+1].row * tileSize + half;

        const isHoriz = Math.abs(ex - sx) > Math.abs(ey - sy);

        // --- Rails ---
        ctx.strokeStyle = '#7a4a18';
        ctx.lineWidth   = Math.max(2, tileSize * 0.1);
        ctx.lineCap     = 'round';

        for (const sign of [-1, 1]) {
          const ox = isHoriz ?  0           : sign * RAIL_OFFSET;
          const oy = isHoriz ?  sign * RAIL_OFFSET : 0;
          
          let sxOffset = sx + ox;
          let syOffset = sy + oy;
          let exOffset = ex + ox;
          let eyOffset = ey + oy;
          
          if (i > 0) {
            const prev = ladder.path_nodes[i-1];
            if ((Math.abs(prev.col - ladder.path_nodes[i].col) > 0) !== isHoriz) {
              sxOffset -= isHoriz ? Math.sign(ex - sx) * RAIL_OFFSET : 0;
              syOffset -= !isHoriz ? Math.sign(ey - sy) * RAIL_OFFSET : 0;
            }
          }
          if (i < ladder.path_nodes.length - 2) {
            const next = ladder.path_nodes[i+2];
            if ((Math.abs(next.col - ladder.path_nodes[i+1].col) > 0) !== isHoriz) {
              exOffset += isHoriz ? Math.sign(ex - sx) * RAIL_OFFSET : 0;
              eyOffset += !isHoriz ? Math.sign(ey - sy) * RAIL_OFFSET : 0;
            }
          }

          ctx.beginPath();
          ctx.moveTo(sxOffset, syOffset);
          ctx.lineTo(exOffset, eyOffset);
          ctx.stroke();
        }

        // --- Rungs ---
        ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
        ctx.strokeStyle = '#c8a96e';
        ctx.lineWidth   = Math.max(1.5, tileSize * 0.07);

        const totalPx = isHoriz ? Math.abs(ex - sx) : Math.abs(ey - sy);
        const dirX = Math.sign(ex - sx);
        const dirY = Math.sign(ey - sy);

        const RUNG_SPACING = tileSize * 0.9;
        const rungCount = Math.max(1, Math.floor(totalPx / RUNG_SPACING));
        for (let j = 0; j <= rungCount; j++) {
          const t  = j / rungCount;
          const rx = sx + dirX * totalPx * t;
          const ry = sy + dirY * totalPx * t;

          const px1 = rx + (isHoriz ?  0 : -RAIL_OFFSET);
          const py1 = ry + (isHoriz ? -RAIL_OFFSET : 0);
          const px2 = rx + (isHoriz ?  0 :  RAIL_OFFSET);
          const py2 = ry + (isHoriz ?  RAIL_OFFSET : 0);

          ctx.beginPath();
          ctx.moveTo(px1, py1);
          ctx.lineTo(px2, py2);
          ctx.stroke();
        }
      }

      ctx.restore();

      // --- Glowing endpoint nodes ---
      const pulse = Math.sin(this._pulse * 2.5) * 0.4 + 0.6;
      const startNode = ladder.path_nodes[0];
      const endNode = ladder.path_nodes[ladder.path_nodes.length - 1];
      const endpoints = [
        [offsetX + startNode.col * tileSize + half, offsetY + startNode.row * tileSize + half],
        [offsetX + endNode.col * tileSize + half, offsetY + endNode.row * tileSize + half]
      ];
      
      for (const [nx, ny] of endpoints) {
        ctx.save();
        ctx.globalAlpha = 0.8 + pulse * 0.2;
        ctx.shadowColor = '#f5c842';
        ctx.shadowBlur  = 10 + pulse * 6;
        ctx.fillStyle   = '#f5c842';
        ctx.beginPath();
        ctx.arc(nx, ny, tileSize * 0.18, 0, Math.PI * 2);
        ctx.fill();
        // Inner bright dot
        ctx.fillStyle = '#fff8dc';
        ctx.beginPath();
        ctx.arc(nx, ny, tileSize * 0.07, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  // --------------- Exit Beacon ---------------

  private _drawExitBeacon(grid: CellType[][], offsetX: number, offsetY: number) {
    const { ctx, tileSize } = this;
    const rows = grid.length;
    const cols = grid[0].length;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c] !== CellType.EXIT) continue;
        const x  = offsetX + c * tileSize;
        const y  = offsetY + r * tileSize;
        const cx = x + tileSize / 2;
        const cy = y + tileSize / 2;
        const pulse = Math.sin(this._pulse) * 0.5 + 0.5;

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

  // --------------- Fog of War ---------------

  private _buildFogCanvas(W: number, H: number, playerPos: Pos, radius: number, offsetX: number, offsetY: number) {
    const { tileSize } = this;
    const fc   = this.fogCanvas;
    const fctx = this.fogCtx;

    fc.width  = W;
    fc.height = H;

    const px = offsetX + playerPos.col * tileSize + tileSize / 2;
    const py = offsetY + playerPos.row * tileSize + tileSize / 2;
    const gradRadius = (radius + 1.5) * tileSize;

    fctx.fillStyle = 'rgba(0,0,0,0.90)';
    fctx.fillRect(0, 0, W, H);

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

  private _drawPlayer(player: import('../core/types.js').PlayerState, state: import('../core/types.js').GameState, offsetX: number, offsetY: number) {
    const { ctx, tileSize } = this;
    
    let cx = 0;
    let cy = 0;

    if (player.isClimbing && player.climbStart && player.climbEnd && player.climbDuration > 0) {
      const t = Math.min(1, player.climbTimer / player.climbDuration);
      const scx = offsetX + player.climbStart.col * tileSize + tileSize / 2;
      const scy = offsetY + player.climbStart.row * tileSize + tileSize / 2;
      const ecx = offsetX + player.climbEnd.col * tileSize + tileSize / 2;
      const ecy = offsetY + player.climbEnd.row * tileSize + tileSize / 2;
      cx = scx + (ecx - scx) * t;
      cy = scy + (ecy - scy) * t;
    } else {
      cx = offsetX + player.pos.col * tileSize + tileSize / 2;
      cy = offsetY + player.pos.row * tileSize + tileSize / 2;
    }

    const r  = tileSize * 0.36;

    ctx.save();
    ctx.shadowColor = PLAYER_GLOW;
    ctx.shadowBlur  = 22;
    ctx.fillStyle   = PLAYER_COLOR;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Mud-slow indicator: vòng nâu nhấp nháy khi mudBlocked = true
    // (bước tiếp theo sẽ bị chặn — cảnh báo người chơi)
    if (player.mudBlocked) {
      const pulse = Math.sin(this._pulse * 4) * 0.4 + 0.6;
      ctx.save();
      ctx.globalAlpha  = pulse * 0.85;
      ctx.strokeStyle  = '#8b4513'; // saddle brown
      ctx.shadowColor  = '#8b4513';
      ctx.shadowBlur   = 8;
      ctx.lineWidth    = 2.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(cx, cy, r + 5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }


  }

  private _drawEnemies(enemies: EnemyState[], offsetX: number, offsetY: number) {
    const { ctx, tileSize } = this;

    for (const enemy of enemies) {
      const baseColor  = ENEMY_COLORS[enemy.algoType];
      const traitColor = TRAIT_COLORS[enemy.trait];
      const color      = traitColor ?? baseColor;

      const cx = offsetX + enemy.pos.col * tileSize + tileSize / 2;
      const cy = offsetY + enemy.pos.row * tileSize + tileSize / 2;

      // Boss/Elite bigger radius
      const isBoss  = enemy.trait === EnemyTrait.BOSS;
      const isElite = enemy.trait === EnemyTrait.ELITE;
      const r = tileSize * (isBoss ? 0.44 : isElite ? 0.38 : 0.33);

      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur  = isBoss ? 28 : isElite ? 22 : 16;

      if (enemy.mode === 'FLEE') {
        ctx.fillStyle   = 'rgba(255,255,255,0.9)';
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth   = 2;
        ctx.stroke();
      } else if (enemy.mode === 'CONFUSED') {
        // Spinning question mark effect
        ctx.fillStyle = 'rgba(255,220,0,0.85)';
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.font = `bold ${Math.round(r * 1.2)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', cx, cy);
      } else {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();

        // Boss crown
        if (isBoss) {
          ctx.fillStyle = '#ffd700';
          ctx.font = `bold ${Math.round(r * 0.9)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('♛', cx, cy);
        } else {
          ctx.fillStyle = 'rgba(255,255,255,0.8)';
          ctx.beginPath();
          ctx.arc(cx + r * 0.3, cy - r * 0.2, r * 0.25, 0, Math.PI * 2);
          ctx.fill();
        }

        // Elite ring
        if (isElite) {
          ctx.strokeStyle = '#ffd700';
          ctx.lineWidth   = 1.5;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.arc(cx, cy, r + 3, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
      ctx.restore();

      // Slow indicator
      if (enemy.slowTimer > 0) {
        ctx.save();
        ctx.globalAlpha = 0.6;
        ctx.fillStyle   = '#00e5ff';
        ctx.font        = `${Math.round(r * 0.8)}px sans-serif`;
        ctx.textAlign   = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('❄', cx, cy - r - 2);
        ctx.restore();
      }
    }
  }

  // --------------- Canvas HUD Overlays ---------------

  private _drawEventLabel(W: number, H: number, state: GameState) {
    if (!state.eventLabelTimer || state.eventLabelTimer <= 0) return;
    const { ctx } = this;
    const alpha = Math.min(1, state.eventLabelTimer / 500);
    const fontSize = Math.max(12, Math.min(18, W / 24));

    ctx.save();
    ctx.globalAlpha   = alpha;
    ctx.font          = `bold ${fontSize}px 'Outfit', sans-serif`;
    ctx.textAlign     = 'center';
    ctx.textBaseline  = 'top';
    ctx.shadowColor   = '#ffd700';
    ctx.shadowBlur    = 12;
    ctx.fillStyle     = '#ffd700';
    ctx.fillText(state.lastEventLabel, W / 2, 60);
    ctx.restore();
  }

  // --------------- Debug Overlay ---------------

  private _drawDebugVisited(enemies: EnemyState[], offsetX: number, offsetY: number) {
    const { ctx, tileSize } = this;
    for (const enemy of enemies) {
      ctx.globalAlpha = 0.13;
      ctx.fillStyle   = ENEMY_COLORS[enemy.algoType];
      for (const pos of enemy.visitedCache) {
        ctx.fillRect(offsetX + pos.col * tileSize, offsetY + pos.row * tileSize, tileSize, tileSize);
      }
    }
    ctx.globalAlpha = 1;
  }

  private _drawDebugPaths(enemies: EnemyState[], offsetX: number, offsetY: number) {
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
        offsetX + enemy.pos.col * tileSize + tileSize / 2,
        offsetY + enemy.pos.row * tileSize + tileSize / 2
      );
      for (const pos of path) {
        ctx.lineTo(offsetX + pos.col * tileSize + tileSize / 2, offsetY + pos.row * tileSize + tileSize / 2);
      }
      ctx.stroke();
      ctx.restore();
    }
  }

  resize(canvas: HTMLCanvasElement, rows: number, cols: number) {
    // Dynamic resize handled in render
  }
}
