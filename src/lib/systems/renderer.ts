// ============================================================
// renderer.ts — Canvas 2D draw pipeline (3-round expansion)
// ============================================================

import {
  CellType,
  EnemyTrait,
  GamePhase,
  type AoeEvent,
  type EnemyState,
  type GameState,
  type LadderObject,
  type Pos,
} from '../core/types.js';
import { gsap } from 'gsap';
import { createNoise2D, createNoise3D, type NoiseFunction2D, type NoiseFunction3D } from 'simplex-noise';
import { ENEMY_COLORS, TRAIT_COLORS } from '../entities/enemy.js';
import { getRoundIntro } from './wave-manager.js';
import { MAP_THEMES } from '../core/map-themes.js';
import type { BiomeConfig } from '../core/map-themes.js';
import { AOE_FLASH_MS } from './event-manager.js';

// --------------- Cell Colors (fallback) ---------------
const CELL_COLORS_BASE: Partial<Record<CellType, string>> = {
  [CellType.WALL]:         '#0e0e1a',
  [CellType.FLOOR]:        '#1e2d4a',
  [CellType.MUD]:          '#5c3d1e',
  [CellType.ICE]:          '#7ee8fa',
  [CellType.EXIT]:         '#00ff87',
  [CellType.CRYSTAL]:      '#f72585',
  [CellType.FREEZE_CLOCK]: '#1e2d4a',
  [CellType.BOMB_PICKUP]:  '#1e2d4a',
  [CellType.BRIDGE]:       '#8b6914',
  [CellType.CRACK]:        '#4a3a28',
};

const DEBUG_PATH_ALPHA = 0.7;
const clamp01 = gsap.utils.clamp(0, 1);
const easeOut = gsap.parseEase('power3.out');
const easeInOut = gsap.parseEase('sine.inOut');
const easeExplode = gsap.parseEase('expo.out');

/** Lớp đại diện cho Renderer. */
export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private fogCanvas: OffscreenCanvas | HTMLCanvasElement;
  private fogCtx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;
  private tileSize: number;
  private _pulse = 0;
  private noise2D: NoiseFunction2D = createNoise2D();
  private noise3D: NoiseFunction3D = createNoise3D();

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

    // Resolve biome theme (fallback to data_jungle)
    const biome: BiomeConfig = (state.currentBiome && MAP_THEMES[state.currentBiome])
      ? MAP_THEMES[state.currentBiome]
      : MAP_THEMES.data_jungle;

    const rows = grid.length;
    const cols = grid[0].length;

    const canvas = ctx.canvas;
    if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    const HUD_PADDING_Y = 80;
    const HUD_PADDING_X = 16;
    const usableWidth  = Math.max(1, canvas.width  - HUD_PADDING_X);
    const usableHeight = Math.max(1, canvas.height - HUD_PADDING_Y);

    this.tileSize = Math.min(usableWidth / cols, usableHeight / rows);
    const tileSize = this.tileSize;

    const mazeWidth  = cols * tileSize;
    const mazeHeight = rows * tileSize;
    const offsetX = (canvas.width  - mazeWidth)  / 2;
    const offsetY = (canvas.height - mazeHeight) / 2;

    this._pulse += 0.06;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (state.phase === GamePhase.ROUND_INTRO) {
      this._drawRoundIntro(canvas.width, canvas.height, state.round, biome);
      return;
    }

    this._drawGrid(grid, offsetX, offsetY, biome, state);
    this._drawLadders(state.ladders ?? [], offsetX, offsetY, biome);
    if (state.aoeEvents?.length) this._drawAoeEvents(state.aoeEvents, offsetX, offsetY, biome);
    if (debugMode) this._drawDebugVisited(enemies, offsetX, offsetY);
    if (state.fogEnabled) {
      this._buildFogCanvas(canvas.width, canvas.height, player.pos, player.fogRadius, offsetX, offsetY);
      ctx.drawImage(this.fogCanvas as HTMLCanvasElement, 0, 0);
    }
    const isFreezeActive = player.freezeTimer > 0;
    this._drawEnemies(enemies, isFreezeActive, offsetX, offsetY);
    this._drawPlayer(player, state, offsetX, offsetY, biome);
    if (debugMode) this._drawDebugPaths(enemies, offsetX, offsetY);
    this._drawExitBeacon(grid, offsetX, offsetY);
    this._drawEventLabel(canvas.width, canvas.height, state);
  }

  // --------------- Round Intro ---------------

  private _drawRoundIntro(W: number, H: number, round: number, biome?: BiomeConfig) {
    const { ctx } = this;
    const intro = getRoundIntro(round);

    // Dark background with biome tint
    ctx.fillStyle = biome ? biome.wallColor : '#070714';
    ctx.fillRect(0, 0, W, H);

    const accentColor = biome ? biome.primaryColor : '#39ff14';
    const titleSize = Math.max(18, Math.min(32, W / 18));
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `900 ${titleSize}px 'Outfit', sans-serif`;
    ctx.shadowColor  = accentColor;
    ctx.shadowBlur   = 30;
    ctx.fillStyle    = accentColor;
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

  private _drawGrid(grid: CellType[][], offsetX: number, offsetY: number, biome?: BiomeConfig, state?: GameState) {
    const { ctx, tileSize } = this;
    const rows = grid.length;
    const cols = grid[0].length;
    const wallColor      = biome?.wallColor      ?? '#0e0e1a';
    const wallInset      = biome?.wallInset       ?? '#090912';
    const wallHighlight  = biome?.wallHighlight   ?? 'rgba(255,255,255,0.05)';
    const floorColor     = biome?.floorColor      ?? '#1e2d4a';
    const primaryColor   = biome?.primaryColor    ?? '#4edea3';

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = grid[r][c];
        const x = offsetX + c * tileSize;
        const y = offsetY + r * tileSize;

        // Base fill
        const isFloorLike =
          cell === CellType.FLOOR ||
          cell === CellType.STEALTH_NODE ||
          cell === CellType.CONVEYOR_UP  || cell === CellType.CONVEYOR_DOWN ||
          cell === CellType.CONVEYOR_LEFT|| cell === CellType.CONVEYOR_RIGHT||
          cell === CellType.VOLATILE     ||
          cell === CellType.FREEZE_CLOCK || cell === CellType.BOMB_PICKUP;

        ctx.fillStyle = isFloorLike
          ? floorColor
          : (CELL_COLORS_BASE[cell] ?? wallColor);
        ctx.fillRect(x, y, tileSize, tileSize);

        if (cell === CellType.WALL) {
          ctx.fillStyle = wallInset;
          ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);
          ctx.fillStyle = wallHighlight;
          ctx.fillRect(x, y, tileSize, 2);
          ctx.fillRect(x, y, 2, tileSize);
        }

        if (cell === CellType.FLOOR) {
          ctx.strokeStyle = 'rgba(255,255,255,0.04)';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(x + 0.5, y + 0.5, tileSize - 1, tileSize - 1);
        }

        if (cell === CellType.MUD) {
          this._drawThemedMud(ctx, x, y, tileSize, biome, state, r, c);
        }

        if (cell === CellType.ICE) {
          this._drawThemedIce(ctx, x, y, tileSize, biome);
        }

        if (cell === CellType.BRIDGE) {
          ctx.fillStyle = '#6b4a10';
          ctx.fillRect(x + 1, y + tileSize * 0.3, tileSize - 2, tileSize * 0.4);
          ctx.fillStyle = 'rgba(255,200,100,0.18)';
          for (let i = 0; i < tileSize; i += 5)
            ctx.fillRect(x + i, y + tileSize * 0.3, 2, tileSize * 0.4);
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
          ctx.shadowColor = '#f72585'; ctx.shadowBlur = 16; ctx.fillStyle = '#f72585';
          const s = tileSize * 0.38, cx2 = x + tileSize / 2, cy2 = y + tileSize / 2;
          ctx.beginPath();
          ctx.moveTo(cx2, cy2 - s); ctx.lineTo(cx2 + s * 0.6, cy2);
          ctx.lineTo(cx2, cy2 + s); ctx.lineTo(cx2 - s * 0.6, cy2);
          ctx.closePath(); ctx.fill(); ctx.restore();
        }

        if (cell === CellType.FREEZE_CLOCK) {
          ctx.save();
          const cx2 = x + tileSize / 2, cy2 = y + tileSize / 2;
          ctx.shadowColor = '#00e5ff'; ctx.shadowBlur = 12; ctx.fillStyle = '#00e5ff';
          ctx.font = `bold ${Math.round(tileSize * 0.6)}px sans-serif`;
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText('🕒', cx2, cy2); ctx.restore();
        }

        if (cell === CellType.BOMB_PICKUP) {
          ctx.save();
          const cx2 = x + tileSize / 2, cy2 = y + tileSize / 2;
          ctx.shadowColor = '#b82ff7'; ctx.shadowBlur = 12; ctx.fillStyle = '#b82ff7';
          ctx.font = `bold ${Math.round(tileSize * 0.6)}px sans-serif`;
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText('💣', cx2, cy2); ctx.restore();
        }

        if (cell === CellType.EXIT) {
          ctx.fillStyle = 'rgba(0,255,135,0.2)';
          ctx.fillRect(x, y, tileSize, tileSize);
        }

        // ── GIMMICK TILES ──────────────────────────────────────────────────
        const cx = x + tileSize / 2;
        const cy = y + tileSize / 2;

        if (cell === CellType.STEALTH_NODE) {
          const pulse = Math.sin(this._pulse * 1.8 + r * 0.3 + c * 0.3) * 0.3 + 0.7;
          ctx.save();
          ctx.globalAlpha = pulse * 0.55;
          ctx.fillStyle = primaryColor;
          ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);
          ctx.globalAlpha = 1;
          ctx.strokeStyle = primaryColor;
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 3]);
          ctx.strokeRect(x + 1, y + 1, tileSize - 2, tileSize - 2);
          ctx.setLineDash([]);
          ctx.restore();
        }

        if (
          cell === CellType.CONVEYOR_UP   || cell === CellType.CONVEYOR_DOWN ||
          cell === CellType.CONVEYOR_LEFT || cell === CellType.CONVEYOR_RIGHT
        ) {
          const pulse2 = Math.sin(this._pulse * 2 + r + c) * 0.25 + 0.75;
          ctx.save();
          ctx.globalAlpha = pulse2 * 0.7;
          ctx.fillStyle = '#003d5c';
          ctx.fillRect(x + 1, y + 1, tileSize - 2, tileSize - 2);
          // Draw arrow
          ctx.fillStyle = '#00ffff';
          ctx.shadowColor = '#00ffff'; ctx.shadowBlur = 6;
          ctx.font = `bold ${Math.round(tileSize * 0.5)}px sans-serif`;
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          const arrow = cell === CellType.CONVEYOR_UP ? '↑'
            : cell === CellType.CONVEYOR_DOWN  ? '↓'
            : cell === CellType.CONVEYOR_LEFT  ? '←' : '→';
          ctx.fillText(arrow, cx, cy);
          ctx.restore();
        }

        if (cell === CellType.VOLATILE) {
          const hot = state?.volatileHot?.has(`${r},${c}`) ?? false;
          const volTimer = state?.volatileTimer ?? 0;
          const timeFrac = clamp01(volTimer / 5000);
          const warningFrac = easeInOut(clamp01((timeFrac - 0.62) / 0.38));
          const heatNoise = this.noise3D(r * 0.7, c * 0.7, this._pulse * 0.16);
          const blinkRate = 1.5 + timeFrac * 5;
          const blink = clamp01(Math.sin(this._pulse * blinkRate + heatNoise * 0.8) * 0.5 + 0.5);
          ctx.save();
          ctx.globalAlpha = 0.38 + blink * 0.32 + warningFrac * 0.2 + heatNoise * 0.04;
          ctx.fillStyle = '#4a0e00';
          ctx.shadowColor = warningFrac > 0 ? '#ff2a00' : '#ff4500'; ctx.shadowBlur = 8 + warningFrac * 18;
          ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = 0.18 + warningFrac * 0.32 + (hot ? 0.35 : 0);
          const core = ctx.createRadialGradient(cx, cy, tileSize * 0.04, cx, cy, tileSize * 0.52);
          core.addColorStop(0, hot ? 'rgba(255,245,190,0.92)' : 'rgba(255,120,24,0.58)');
          core.addColorStop(0.48, 'rgba(255,42,0,0.34)');
          core.addColorStop(1, 'rgba(255,0,64,0)');
          ctx.fillStyle = core;
          ctx.fillRect(x, y, tileSize, tileSize);
          ctx.globalCompositeOperation = 'source-over';

          if (warningFrac > 0 && !hot) {
            const ringR = tileSize * (0.18 + warningFrac * 0.34 + blink * 0.08 + Math.abs(heatNoise) * 0.035);
            ctx.globalAlpha = 0.25 + warningFrac * 0.55;
            ctx.strokeStyle = '#ffcc00';
            ctx.lineWidth = Math.max(1, tileSize * 0.045);
            ctx.shadowColor = '#ffcc00';
            ctx.shadowBlur = 14;
            ctx.beginPath();
            ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = warningFrac * (0.18 + blink * 0.22);
            ctx.strokeStyle = '#ff1744';
            ctx.lineWidth = Math.max(1, tileSize * 0.025);
            ctx.beginPath();
            ctx.arc(cx, cy, tileSize * (0.46 + blink * 0.08), 0, Math.PI * 2);
            ctx.stroke();

            ctx.globalAlpha = 0.18 + warningFrac * 0.5;
            ctx.strokeStyle = '#ff2a00';
            ctx.lineWidth = Math.max(1, tileSize * 0.035);
            for (let i = -1; i <= 2; i++) {
              const yy = y + tileSize * (0.18 + i * 0.24 + (this._pulse * 0.05) % 0.24);
              ctx.beginPath();
              ctx.moveTo(x + tileSize * 0.18, yy);
              ctx.lineTo(x + tileSize * 0.82, yy - tileSize * 0.22);
              ctx.stroke();
            }

            ctx.fillStyle = '#ffcc00';
            for (let i = 0; i < 4; i++) {
              const angle = -Math.PI / 2 + i * (Math.PI * 0.5) + this._pulse * 0.08;
              const px = cx + Math.cos(angle) * tileSize * 0.36;
              const py = cy + Math.sin(angle) * tileSize * 0.36;
              ctx.globalAlpha = warningFrac * (0.45 + blink * 0.45);
              ctx.fillRect(px - tileSize * 0.035, py - tileSize * 0.035, tileSize * 0.07, tileSize * 0.07);
            }
          }

          if (hot) {
            const flashFrac = easeExplode(clamp01(1 - volTimer / 650));
            const blast = ctx.createRadialGradient(cx, cy, tileSize * 0.05, cx, cy, tileSize * (0.72 + flashFrac * 0.22));
            blast.addColorStop(0, 'rgba(255,245,180,0.95)');
            blast.addColorStop(0.25, 'rgba(255,70,0,0.78)');
            blast.addColorStop(0.68, 'rgba(255,0,64,0.28)');
            blast.addColorStop(1, 'rgba(40,0,0,0)');
            ctx.globalAlpha = 0.95;
            ctx.fillStyle = blast;
            ctx.fillRect(x - tileSize * 0.18, y - tileSize * 0.18, tileSize * 1.36, tileSize * 1.36);
            ctx.globalCompositeOperation = 'lighter';
            ctx.globalAlpha = 0.45 + flashFrac * 0.4;
            ctx.strokeStyle = '#fff3a0';
            ctx.lineWidth = Math.max(2, tileSize * 0.07);
            ctx.beginPath();
            ctx.arc(cx, cy, tileSize * (0.22 + flashFrac * 0.55), 0, Math.PI * 2);
            ctx.stroke();

            ctx.shadowColor = '#ff2a00';
            ctx.shadowBlur = 20;
            for (let i = 0; i < 16; i++) {
              const angle = i * (Math.PI * 2 / 16) + this._pulse * 0.08 + this.noise2D(i, this._pulse * 0.3) * 0.16;
              ctx.globalAlpha = 0.55 + flashFrac * 0.25;
              ctx.strokeStyle = i % 2 === 0 ? '#ffec8a' : '#ff1744';
              ctx.lineWidth = Math.max(1, tileSize * (i % 3 === 0 ? 0.06 : 0.035));
              ctx.beginPath();
              ctx.moveTo(cx + Math.cos(angle) * tileSize * 0.16, cy + Math.sin(angle) * tileSize * 0.16);
              ctx.lineTo(cx + Math.cos(angle) * tileSize * (0.72 + flashFrac * 0.18), cy + Math.sin(angle) * tileSize * (0.72 + flashFrac * 0.18));
              ctx.stroke();
            }
            ctx.globalCompositeOperation = 'source-over';

            ctx.fillStyle = '#ff1744';
            for (let i = 0; i < 14; i++) {
              const px = x + clamp01(0.5 + this.noise3D(i * 0.8, r, this._pulse * 0.9) * 0.48) * tileSize;
              const py = y + clamp01(0.5 + this.noise3D(i * 0.8, c, this._pulse * 0.85 + 12) * 0.48) * tileSize;
              const s = tileSize * (0.07 + (i % 3) * 0.025);
              ctx.globalAlpha = 0.38 + flashFrac * 0.35;
              ctx.fillRect(px - s / 2, py - s / 2, s, s);
            }
          }

          ctx.globalAlpha = 1;
          ctx.font = `bold ${Math.round(tileSize * 0.45)}px sans-serif`;
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillStyle = hot ? '#fff3a0' : warningFrac > 0 ? '#ffcc00' : '#ff9100';
          ctx.shadowColor = '#ff4500';
          ctx.shadowBlur = hot ? 14 : 6 + warningFrac * 10;
          ctx.fillText('!', cx, cy);
          ctx.restore();
        }
      }
    }
  }

  // --------------- Ladder Overlay ---------------

  /**
   * Vẽ tất cả LadderObject theo phong cách của biome hiện tại:
   * - DATA JUNGLE  → Hardlight Bridges (neon green glowing roots)
   * - COOLING SEA  → Ventilation Shaft  (steel-blue grates)
   * - LAVA CORE    → Thermal Elevator   (red-orange iron steps)
   */
  private _drawLadders(ladders: LadderObject[], offsetX: number, offsetY: number, biome?: BiomeConfig) {
    if (!ladders.length) return;
    const { ctx, tileSize } = this;
    const half = tileSize / 2;

    // Biome-specific palette
    const railColor = biome?.id === 'data_jungle' ? '#1a4a20'
                    : biome?.id === 'cooling_sea'  ? '#1e3a4a'
                    : biome?.id === 'lava_core'    ? '#5a1a08'
                    : '#7a4a18';
    const rungColor = biome?.id === 'data_jungle' ? '#39ff14'
                    : biome?.id === 'cooling_sea'  ? '#7ecdf5'
                    : biome?.id === 'lava_core'    ? '#ff6b35'
                    : '#c8a96e';
    const glowColor = biome?.id === 'data_jungle' ? '#39ff14'
                    : biome?.id === 'cooling_sea'  ? '#00e5ff'
                    : biome?.id === 'lava_core'    ? '#ff9100'
                    : '#f5c842';
    const innerColor = biome?.id === 'data_jungle' ? '#b0ffb0'
                     : biome?.id === 'cooling_sea'  ? '#e0f8ff'
                     : biome?.id === 'lava_core'    ? '#fff0c0'
                     : '#fff8dc';

    for (const ladder of ladders) {
      if (!ladder.path_nodes || ladder.path_nodes.length < 2) continue;

      const isThermal = biome?.id === 'lava_core';
      if (isThermal && ladder.isCollapsed) {
        this._drawCollapsedThermalElevator(ladder, offsetX, offsetY);
        continue;
      }

      const thermalShake = isThermal && (ladder.collapseTimerMs ?? Infinity) < 2000
        ? easeOut(clamp01(1 - (ladder.collapseTimerMs ?? 0) / 2000))
        : 0;
      const thermalSeed = ladder.path_nodes[0].row * 17 + ladder.path_nodes[0].col * 31;
      const shakeX = isThermal ? this.noise3D(thermalSeed, this._pulse * 3.6, 0) * tileSize * 0.12 * thermalShake : 0;
      const shakeY = isThermal ? this.noise3D(thermalSeed, this._pulse * 3.2, 8) * tileSize * 0.1 * thermalShake : 0;

      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.55)';
      ctx.shadowBlur  = 6;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      const RAIL_OFFSET = tileSize * 0.22;

      for (let i = 0; i < ladder.path_nodes.length - 1; i++) {
        const sx = offsetX + ladder.path_nodes[i].col * tileSize + half + shakeX;
        const sy = offsetY + ladder.path_nodes[i].row * tileSize + half + shakeY;
        const ex = offsetX + ladder.path_nodes[i+1].col * tileSize + half + shakeX;
        const ey = offsetY + ladder.path_nodes[i+1].row * tileSize + half + shakeY;
        const isHoriz = Math.abs(ex - sx) > Math.abs(ey - sy);

        // --- Rails ---
        ctx.strokeStyle = railColor;
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
        ctx.strokeStyle = rungColor;
        ctx.shadowColor = rungColor;
        ctx.shadowBlur  = biome?.id !== 'cooling_sea' ? 4 : 0; // glow on jungle/lava
        ctx.lineWidth   = Math.max(1.5, tileSize * 0.07);

        const totalPx   = isHoriz ? Math.abs(ex - sx) : Math.abs(ey - sy);
        const dirX      = Math.sign(ex - sx);
        const dirY      = Math.sign(ey - sy);
        const RUNG_SPACING = tileSize * 0.9;
        const rungCount = Math.max(1, Math.floor(totalPx / RUNG_SPACING));
        for (let j = 0; j <= rungCount; j++) {
          const t  = j / rungCount;
          const rx = sx + dirX * totalPx * t;
          const ry = sy + dirY * totalPx * t;
          ctx.beginPath();
          ctx.moveTo(rx + (isHoriz ?  0 : -RAIL_OFFSET), ry + (isHoriz ? -RAIL_OFFSET : 0));
          ctx.lineTo(rx + (isHoriz ?  0 :  RAIL_OFFSET), ry + (isHoriz ?  RAIL_OFFSET : 0));
          ctx.stroke();
        }
      }

      if (isThermal && thermalShake > 0) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.shadowColor = '#ff2a00';
        ctx.shadowBlur = 18 + thermalShake * 18;
        for (const node of ladder.path_nodes) {
          const nx = offsetX + node.col * tileSize + half + shakeX;
          const ny = offsetY + node.row * tileSize + half + shakeY;
          const sparkNoise = this.noise3D(node.row, node.col, this._pulse * 1.8);
          ctx.globalAlpha = thermalShake * (0.38 + Math.abs(sparkNoise) * 0.35);
          ctx.strokeStyle = sparkNoise > 0 ? '#ffec8a' : '#ff1744';
          ctx.lineWidth = Math.max(1, tileSize * 0.035);
          ctx.beginPath();
          ctx.moveTo(nx - tileSize * 0.22, ny + sparkNoise * tileSize * 0.08);
          ctx.lineTo(nx + tileSize * 0.22, ny - sparkNoise * tileSize * 0.08);
          ctx.stroke();
          ctx.globalAlpha = thermalShake * 0.45;
          ctx.beginPath();
          ctx.arc(nx, ny, tileSize * (0.2 + thermalShake * 0.16), 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.globalCompositeOperation = 'source-over';
      }

      ctx.restore();

      // --- Glowing endpoint nodes ---
      const pulse = Math.sin(this._pulse * 2.5) * 0.4 + 0.6;
      const startNode = ladder.path_nodes[0];
      const endNode   = ladder.path_nodes[ladder.path_nodes.length - 1];
      const endpoints = [
        [offsetX + startNode.col * tileSize + half + shakeX, offsetY + startNode.row * tileSize + half + shakeY],
        [offsetX + endNode.col   * tileSize + half + shakeX, offsetY + endNode.row   * tileSize + half + shakeY],
      ];

      for (const [nx, ny] of endpoints) {
        ctx.save();
        ctx.globalAlpha = 0.8 + pulse * 0.2;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur  = 10 + pulse * 6;
        ctx.fillStyle   = glowColor;
        ctx.beginPath();
        ctx.arc(nx, ny, tileSize * 0.18, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = innerColor;
        ctx.beginPath();
        ctx.arc(nx, ny, tileSize * 0.07, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  private _drawCollapsedThermalElevator(ladder: LadderObject, offsetX: number, offsetY: number) {
    const { ctx, tileSize } = this;
    const half = tileSize / 2;
    const rebuildFrac = easeInOut(clamp01(1 - (ladder.regenerateTimerMs ?? 0) / 5000));

    ctx.save();
    ctx.shadowColor = '#ff4500';
    ctx.shadowBlur = 8 + rebuildFrac * 10;

    for (const node of ladder.path_nodes) {
      const cx = offsetX + node.col * tileSize + half;
      const cy = offsetY + node.row * tileSize + half;

      ctx.globalAlpha = 0.22 + rebuildFrac * 0.25;
      ctx.fillStyle = '#2b0800';
      ctx.fillRect(cx - tileSize * 0.28, cy - tileSize * 0.12, tileSize * 0.56, tileSize * 0.24);

      ctx.globalAlpha = 0.55 + rebuildFrac * 0.35;
      ctx.strokeStyle = '#ff6b35';
      ctx.lineWidth = Math.max(1, tileSize * 0.04);
      ctx.beginPath();
      ctx.moveTo(cx - tileSize * 0.28, cy - tileSize * 0.18);
      ctx.lineTo(cx - tileSize * 0.02, cy + tileSize * 0.08);
      ctx.lineTo(cx + tileSize * 0.26, cy - tileSize * 0.12);
      ctx.stroke();

      for (let i = 0; i < 3; i++) {
        const emberPhase = this._pulse * 1.4 + i + node.row * 0.2 + node.col * 0.3;
        const emberNoise = this.noise3D(node.row + i, node.col - i, this._pulse * 0.25);
        const ex = cx + Math.sin(emberPhase + emberNoise) * tileSize * 0.22;
        const ey = cy + Math.cos(emberPhase * 0.8 + emberNoise) * tileSize * 0.12;
        ctx.globalAlpha = (0.25 + rebuildFrac * 0.55) * (0.6 + Math.sin(emberPhase * 2) * 0.25);
        ctx.fillStyle = i % 2 === 0 ? '#ff9100' : '#ff2a00';
        ctx.fillRect(ex, ey, tileSize * 0.055, tileSize * 0.055);
      }
    }

    if (rebuildFrac > 0.55) {
      const startNode = ladder.path_nodes[0];
      const endNode = ladder.path_nodes[ladder.path_nodes.length - 1];
      const sx = offsetX + startNode.col * tileSize + half;
      const sy = offsetY + startNode.row * tileSize + half;
      const ex = offsetX + endNode.col * tileSize + half;
      const ey = offsetY + endNode.row * tileSize + half;
      ctx.globalAlpha = (rebuildFrac - 0.55) / 0.45 * 0.45;
      ctx.strokeStyle = '#ff9100';
      ctx.lineWidth = Math.max(1.5, tileSize * 0.05);
      ctx.setLineDash([tileSize * 0.18, tileSize * 0.14]);
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();
  }

  // --------------- Themed Terrain Helpers ---------------

  /** Draw MUD tile with biome-specific appearance. Logic (slowdown) is unchanged. */
  private _drawThemedMud(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, tileSize: number,
    biome: BiomeConfig | undefined,
    state: GameState | undefined,
    r: number, c: number,
  ) {
    const biomeId = biome?.id ?? 'data_jungle';

    if (biomeId === 'data_jungle') {
      // ── Stealth Vines ─────────────────────────────────────────────────
      ctx.save();
      ctx.fillStyle = '#0b2415';
      ctx.fillRect(x + 1, y + 1, tileSize - 2, tileSize - 2);
      ctx.strokeStyle = '#39ff14';
      ctx.shadowColor = '#39ff14';
      ctx.shadowBlur  = 5;
      ctx.lineWidth   = 0.9;
      for (let v = 0; v < 3; v++) {
        const ox = x + 3 + v * Math.floor(tileSize / 3);
        const phase = this._pulse * 1.1 + r * 0.4 + c * 0.4 + v;
        ctx.beginPath();
        ctx.moveTo(ox, y + 2);
        ctx.bezierCurveTo(
          ox + Math.sin(phase)     * 4, y + tileSize * 0.33,
          ox + Math.sin(phase + 1) * 4, y + tileSize * 0.66,
          ox,                           y + tileSize - 2,
        );
        ctx.stroke();
      }
      ctx.restore();

    } else if (biomeId === 'cooling_sea') {
      // ── Deep Coolant ──────────────────────────────────────────────────
      ctx.save();
      const rip = Math.sin(this._pulse * 2.2 + r + c) * 0.15 + 0.85;
      ctx.globalAlpha = rip * 0.9;
      ctx.fillStyle = '#001e3d';
      ctx.fillRect(x + 1, y + 1, tileSize - 2, tileSize - 2);
      // Ripple highlight
      ctx.globalAlpha = rip * 0.55;
      ctx.fillStyle = 'rgba(0,140,220,0.6)';
      ctx.beginPath();
      ctx.ellipse(x + tileSize / 2, y + tileSize * 0.6,
        tileSize * 0.32, tileSize * 0.14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

    } else {
      // ── Melted Slag (Lava Core) ───────────────────────────────────────
      const slagTimer = state?.slagTimer ?? 0;
      const isHot     = state?.slagHot?.has(`${r},${c}`) ?? false;
      const frac      = slagTimer / 5000;
      const blinkRate = frac > 0.7 ? 7 : 2.5;
      const blink     = Math.sin(this._pulse * blinkRate) * 0.4 + 0.6;
      ctx.save();
      ctx.globalAlpha  = isHot ? 0.97 : 0.45 + blink * 0.45;
      ctx.fillStyle    = isHot ? '#ff2200' : '#7a1e00';
      ctx.shadowColor  = isHot ? '#ff4500' : '#7a1e00';
      ctx.shadowBlur   = isHot ? 20 : 5;
      ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);
      // Glowing cracks
      ctx.globalAlpha  = 1;
      ctx.strokeStyle  = isHot ? '#ffcc00' : '#ff4500';
      ctx.shadowColor  = isHot ? '#ffcc00' : '#ff4500';
      ctx.shadowBlur   = 6;
      ctx.lineWidth    = 0.8;
      ctx.beginPath();
      ctx.moveTo(x + tileSize * 0.2, y + tileSize * 0.5);
      ctx.lineTo(x + tileSize * 0.5, y + tileSize * 0.25);
      ctx.lineTo(x + tileSize * 0.8, y + tileSize * 0.5);
      ctx.moveTo(x + tileSize * 0.5, y + tileSize * 0.5);
      ctx.lineTo(x + tileSize * 0.5, y + tileSize * 0.85);
      ctx.stroke();
      ctx.restore();
    }
  }

  /** Draw ICE tile with biome-specific appearance. Logic (sliding) is unchanged. */
  private _drawThemedIce(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, tileSize: number,
    biome: BiomeConfig | undefined,
  ) {
    const biomeId = biome?.id ?? 'data_jungle';

    if (biomeId === 'data_jungle') {
      // ── Toxic Moss ────────────────────────────────────────────────────
      ctx.save();
      ctx.fillStyle = '#0a2a12';
      ctx.fillRect(x + 1, y + 1, tileSize - 2, tileSize - 2);
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = 'rgba(80,210,80,0.55)';
      ctx.beginPath();
      ctx.ellipse(x + tileSize * 0.42, y + tileSize * 0.55,
        tileSize * 0.28, tileSize * 0.18, 0.3, 0, Math.PI * 2);
      ctx.fill();
      // Slick shine
      ctx.globalAlpha = 0.65;
      ctx.fillStyle = 'rgba(180,255,160,0.55)';
      ctx.fillRect(x + 3, y + 4, tileSize * 0.28, 2);
      ctx.restore();

    } else if (biomeId === 'cooling_sea') {
      // ── Frozen Floor ──────────────────────────────────────────────────
      ctx.save();
      ctx.fillStyle = '#d6f0f8';
      ctx.fillRect(x + 1, y + 1, tileSize - 2, tileSize - 2);
      ctx.strokeStyle = '#00e5ff';
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur  = 3;
      ctx.lineWidth   = 0.7;
      ctx.beginPath();
      ctx.moveTo(x + 3,              y + tileSize * 0.3);
      ctx.lineTo(x + tileSize * 0.7, y + tileSize * 0.7);
      ctx.moveTo(x + tileSize * 0.5, y + 3);
      ctx.lineTo(x + tileSize * 0.3, y + tileSize - 3);
      ctx.stroke();
      ctx.fillStyle   = 'rgba(255,255,255,0.65)';
      ctx.fillRect(x + 3, y + 3, tileSize * 0.28, 2);
      ctx.restore();

    } else {
      // ── Scorched Glass (Lava Core) ────────────────────────────────────
      ctx.save();
      ctx.fillStyle = 'rgba(190,65,0,0.55)';
      ctx.fillRect(x + 1, y + 1, tileSize - 2, tileSize - 2);
      ctx.strokeStyle = '#ff7700';
      ctx.shadowColor = '#ff7700';
      ctx.shadowBlur  = 4;
      ctx.lineWidth   = 0.7;
      ctx.beginPath();
      ctx.moveTo(x + 2,              y + 2);
      ctx.lineTo(x + tileSize - 4,   y + tileSize - 4);
      ctx.moveTo(x + tileSize - 4,   y + 2);
      ctx.lineTo(x + 4,              y + tileSize * 0.6);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,170,0,0.45)';
      ctx.fillRect(x + 3, y + 3, tileSize * 0.32, 2);
      ctx.restore();
    }
  }

  // --------------- Tactical AoE Events ---------------

  /**
   * Draw AoE event warning zones (3×3 tile outline + countdown) and detonation flashes.
   * This is drawn ABOVE the grid but BELOW fog-of-war for immersion.
   */
  private _drawAoeEvents(events: AoeEvent[], offsetX: number, offsetY: number, biome: BiomeConfig) {
    const { ctx, tileSize } = this;
    const accent = biome.primaryColor;

    for (const ev of events) {
      const cx = offsetX + ev.center.col * tileSize + tileSize / 2;
      const cy = offsetY + ev.center.row * tileSize + tileSize / 2;
      const zoneX = offsetX + (ev.center.col - 1) * tileSize;
      const zoneY = offsetY + (ev.center.row - 1) * tileSize;
      const zoneW = tileSize * 3;
      const zoneH = tileSize * 3;

      if (ev.detonated && ev.flashMs > 0) {
        // ── Detonation Flash ─────────────────────────────────────────────
        const flashAlpha = ev.flashMs / AOE_FLASH_MS;
        ctx.save();
        this._drawBiomeAoeVisual(biome, zoneX, zoneY, zoneW, zoneH, cx, cy, 1, flashAlpha, true);
        ctx.restore();

      } else if (!ev.detonated) {
        // ── Warning Phase ─────────────────────────────────────────────────
        const warningFrac = 1 - (ev.warningMs / 3000); // 0 → 1
        const blinkHz     = 2.5 + warningFrac * 6;
        const blink       = Math.sin(this._pulse * blinkHz) * 0.35 + 0.65;

        // Zone fill
        ctx.save();
        this._drawBiomeAoeVisual(biome, zoneX, zoneY, zoneW, zoneH, cx, cy, warningFrac, blink, false);

        // Center crosshair
        ctx.strokeStyle = accent;
        ctx.shadowColor = accent;
        ctx.shadowBlur  = 14;
        ctx.globalAlpha = blink * 0.8;
        ctx.lineWidth   = 1.2;
        ctx.beginPath();
        ctx.moveTo(cx - tileSize * 0.45, cy); ctx.lineTo(cx + tileSize * 0.45, cy);
        ctx.moveTo(cx, cy - tileSize * 0.45); ctx.lineTo(cx, cy + tileSize * 0.45);
        ctx.stroke();

        // Countdown seconds
        const secLeft = Math.ceil(ev.warningMs / 1000);
        ctx.globalAlpha  = 0.95;
        ctx.shadowBlur   = 8;
        ctx.font         = `bold ${Math.round(tileSize * 0.55)}px 'Outfit', sans-serif`;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle    = '#ffffff';
        ctx.fillText(String(secLeft), cx, cy);

        ctx.restore();
      }
    }
  }

  private _drawBiomeAoeVisual(
    biome: BiomeConfig,
    zoneX: number,
    zoneY: number,
    zoneW: number,
    zoneH: number,
    cx: number,
    cy: number,
    progress: number,
    intensity: number,
    detonated: boolean
  ) {
    progress = easeInOut(clamp01(progress));
    intensity = clamp01(intensity);

    if (biome.id === 'data_jungle') {
      this._drawCyberSporeBloom(zoneX, zoneY, zoneW, zoneH, cx, cy, progress, intensity, detonated);
      return;
    }
    if (biome.id === 'cooling_sea') {
      this._drawCryoGeyser(zoneX, zoneY, zoneW, zoneH, cx, cy, progress, intensity, detonated);
      return;
    }
    this._drawVolatileEruption(zoneX, zoneY, zoneW, zoneH, cx, cy, progress, intensity, detonated);
  }

  private _drawCyberSporeBloom(
    zoneX: number,
    zoneY: number,
    zoneW: number,
    zoneH: number,
    cx: number,
    cy: number,
    progress: number,
    intensity: number,
    detonated: boolean
  ) {
    const { ctx, tileSize } = this;
    const phase = this._pulse;
    ctx.globalCompositeOperation = 'lighter';
    const mist = ctx.createRadialGradient(cx, cy, tileSize * 0.25, cx, cy, zoneW * 0.75);
    mist.addColorStop(0, detonated ? 'rgba(190,255,150,0.78)' : 'rgba(78,222,163,0.38)');
    mist.addColorStop(0.45, 'rgba(57,255,20,0.28)');
    mist.addColorStop(1, 'rgba(4,30,14,0)');

    ctx.globalAlpha = intensity * (detonated ? 0.95 : 0.75);
    ctx.fillStyle = mist;
    ctx.fillRect(zoneX, zoneY, zoneW, zoneH);

    for (let i = 0; i < 30; i++) {
      const t = i / 30;
      const sporeNoise = this.noise3D(i * 0.35, progress * 1.7, phase * 0.16);
      const orbit = phase * (0.45 + t) + i * 2.17 + sporeNoise * 0.75;
      const radius = tileSize * (0.25 + ((i * 7) % 10) / 10 + sporeNoise * 0.08) * (1.1 + progress * 0.9);
      const x = cx + Math.cos(orbit) * radius + this.noise3D(i, phase * 0.2, 3) * tileSize * 0.22;
      const y = cy + Math.sin(orbit * 0.8) * radius * 0.72 + this.noise3D(i, phase * 0.2, 9) * tileSize * 0.16;
      const dotR = tileSize * (0.045 + (i % 4) * 0.012) * (detonated ? 1.8 : 1);

      ctx.globalAlpha = intensity * (detonated ? 0.75 : 0.45);
      ctx.fillStyle = i % 3 === 0 ? '#b6ff7a' : '#39ff14';
      ctx.shadowColor = '#39ff14';
      ctx.shadowBlur = detonated ? 18 : 10;
      ctx.beginPath();
      ctx.arc(x, y, dotR, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = intensity * (0.18 + progress * 0.22);
    ctx.strokeStyle = '#7aff9e';
    ctx.lineWidth = Math.max(1, tileSize * 0.035);
    for (let i = 0; i < 8; i++) {
      const wispNoise = this.noise3D(i, phase * 0.12, progress);
      const y = zoneY + zoneH * (0.12 + i * 0.11) + wispNoise * tileSize * 0.16;
      ctx.beginPath();
      ctx.moveTo(zoneX + tileSize * 0.2, y);
      ctx.bezierCurveTo(cx - tileSize, y - tileSize * 0.5, cx + tileSize, y + tileSize * 0.5, zoneX + zoneW - tileSize * 0.2, y);
      ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  private _drawCryoGeyser(
    zoneX: number,
    zoneY: number,
    zoneW: number,
    zoneH: number,
    cx: number,
    cy: number,
    progress: number,
    intensity: number,
    detonated: boolean
  ) {
    const { ctx, tileSize } = this;
    const phase = this._pulse;
    const height = zoneH * (0.55 + progress * 0.35);
    ctx.globalCompositeOperation = 'lighter';
    const geyser = ctx.createLinearGradient(cx, cy + zoneH * 0.45, cx, cy - height);
    geyser.addColorStop(0, 'rgba(0,255,255,0.08)');
    geyser.addColorStop(0.45, detonated ? 'rgba(230,255,255,0.82)' : 'rgba(0,229,255,0.5)');
    geyser.addColorStop(1, 'rgba(255,255,255,0)');

    ctx.globalAlpha = intensity * (detonated ? 0.95 : 0.7);
    ctx.fillStyle = geyser;
    ctx.beginPath();
    ctx.ellipse(cx, cy + tileSize * 0.2, zoneW * 0.28, height, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = intensity * (0.25 + progress * 0.35);
    ctx.strokeStyle = '#e8ffff';
    ctx.lineWidth = Math.max(2, tileSize * 0.05);
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 22;
    ctx.beginPath();
    ctx.ellipse(cx, cy + tileSize * 0.34, zoneW * (0.18 + progress * 0.22), tileSize * (0.16 + progress * 0.08), 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#bffcff';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = detonated ? 20 : 12;
    for (let i = 0; i < 13; i++) {
      const plumeNoise = this.noise3D(i * 0.4, progress, phase * 0.2);
      const x = zoneX + zoneW * (0.13 + i * 0.062) + plumeNoise * tileSize * 0.22;
      const y1 = zoneY + zoneH * (0.12 + (i % 3) * 0.08);
      const y2 = zoneY + zoneH * (0.86 - (i % 2) * 0.1);
      ctx.globalAlpha = intensity * (0.35 + progress * 0.45);
      ctx.lineWidth = Math.max(1, tileSize * (0.025 + (i % 2) * 0.015));
      ctx.beginPath();
      ctx.moveTo(x, y2);
      ctx.bezierCurveTo(x - tileSize * 0.18, cy, x + tileSize * 0.2, cy, x, y1);
      ctx.stroke();
    }

    for (let i = 0; i < 11; i++) {
      const crystalNoise = this.noise2D(i, phase * 0.18);
      const angle = phase * 0.6 + i * (Math.PI * 2 / 11) + crystalNoise * 0.18;
      const r = tileSize * (0.45 + (i % 3) * 0.2 + crystalNoise * 0.04) * (detonated ? 1.25 : 1);
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r * 0.7;
      const spike = tileSize * (0.16 + progress * 0.08);
      ctx.globalAlpha = intensity * 0.8;
      ctx.fillStyle = i % 2 === 0 ? '#e8ffff' : '#00e5ff';
      ctx.beginPath();
      ctx.moveTo(x, y - spike);
      ctx.lineTo(x + spike * 0.45, y);
      ctx.lineTo(x, y + spike);
      ctx.lineTo(x - spike * 0.45, y);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  private _drawVolatileEruption(
    zoneX: number,
    zoneY: number,
    zoneW: number,
    zoneH: number,
    cx: number,
    cy: number,
    progress: number,
    intensity: number,
    detonated: boolean
  ) {
    const { ctx, tileSize } = this;
    const phase = this._pulse;
    ctx.globalCompositeOperation = 'lighter';
    const blast = ctx.createRadialGradient(cx, cy, tileSize * 0.1, cx, cy, zoneW * 0.72);
    blast.addColorStop(0, detonated ? 'rgba(255,255,220,1)' : 'rgba(255,140,48,0.52)');
    blast.addColorStop(0.28, 'rgba(255,45,0,0.68)');
    blast.addColorStop(0.7, 'rgba(255,0,64,0.3)');
    blast.addColorStop(1, 'rgba(40,0,0,0)');

    ctx.globalAlpha = intensity * (detonated ? 1 : 0.72);
    ctx.fillStyle = blast;
    ctx.fillRect(zoneX, zoneY, zoneW, zoneH);

    ctx.shadowColor = '#ff2a00';
    ctx.shadowBlur = detonated ? 28 : 14;
    ctx.globalAlpha = intensity * (0.24 + progress * 0.28);
    ctx.strokeStyle = '#ffec8a';
    ctx.lineWidth = Math.max(2, tileSize * 0.06);
    ctx.beginPath();
    ctx.arc(cx, cy, tileSize * (0.28 + easeExplode(progress) * 1.1), 0, Math.PI * 2);
    ctx.stroke();

    for (let i = 0; i < 20; i++) {
      const rayNoise = this.noise3D(i * 0.25, phase * 0.3, progress);
      const angle = i * (Math.PI * 2 / 20) + rayNoise * 0.22;
      const inner = tileSize * (0.25 + progress * 0.18 + rayNoise * 0.03);
      const outer = tileSize * (0.95 + easeExplode(progress) * 0.85 + Math.abs(rayNoise) * 0.12) * (detonated ? 1.2 : 1);
      ctx.globalAlpha = intensity * (0.42 + progress * 0.42);
      ctx.strokeStyle = i % 2 === 0 ? '#ffec8a' : '#ff1744';
      ctx.lineWidth = Math.max(1.5, tileSize * 0.045);
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
      ctx.lineTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer);
      ctx.stroke();
    }

    ctx.globalAlpha = intensity * (0.28 + progress * 0.4);
    ctx.fillStyle = '#ff1744';
    const blocks = detonated ? 28 : 16;
    for (let i = 0; i < blocks; i++) {
      const x = zoneX + clamp01(0.5 + this.noise3D(i * 0.3, phase * 0.7, 1) * 0.48) * zoneW;
      const y = zoneY + clamp01(0.5 + this.noise3D(i * 0.3, phase * 0.65, 7) * 0.48) * zoneH;
      const s = tileSize * (0.08 + (i % 3) * 0.035) * (detonated ? 1.5 : 1);
      ctx.fillRect(x - s / 2, y - s / 2, s, s);
    }

    ctx.globalAlpha = intensity * 0.72;
    ctx.strokeStyle = '#ff3b5c';
    ctx.lineWidth = Math.max(1, tileSize * 0.04);
    ctx.strokeRect(zoneX + tileSize * 0.18, zoneY + tileSize * 0.18, zoneW - tileSize * 0.36, zoneH - tileSize * 0.36);
    ctx.globalCompositeOperation = 'source-over';
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

  private _drawPlayer(player: import('../core/types.js').PlayerState, state: import('../core/types.js').GameState, offsetX: number, offsetY: number, biome?: BiomeConfig) {
    const { ctx, tileSize } = this;
    const PLAYER_COLOR = biome?.playerColor ?? '#39ff14';
    const PLAYER_GLOW  = biome?.playerGlow  ?? 'rgba(57,255,20,0.5)';

    const cx = offsetX + player.pos.col * tileSize + tileSize / 2;
    const cy = offsetY + player.pos.row * tileSize + tileSize / 2;

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

    // Ladder interaction visual cue
    if (!player.isOnLadder && state.ladders) {
      const isOnLadderEntrance = state.ladders.some(ladder => {
        if (ladder.isCollapsed) return false;
        if (!ladder.path_nodes || ladder.path_nodes.length < 2) return false;
        const start = ladder.path_nodes[0];
        const end = ladder.path_nodes[ladder.path_nodes.length - 1];
        return (player.pos.col === start.col && player.pos.row === start.row) ||
               (player.pos.col === end.col && player.pos.row === end.row);
      });

      if (isOnLadderEntrance) {
        const pulse = Math.sin(Date.now() / 200) * 0.5 + 0.5;
        ctx.save();
        ctx.globalAlpha = 0.5 + pulse * 0.5;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        const boxWidth = 32;
        const boxHeight = 18;
        ctx.fillRect(cx - boxWidth / 2, cy - r - 25, boxWidth, boxHeight);
        
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('[ E ]', cx, cy - r - 16);
        ctx.restore();
      }
    }
  }

  private _drawEnemies(enemies: EnemyState[], isFreezeActive: boolean, offsetX: number, offsetY: number) {
    const { ctx, tileSize } = this;

    for (const enemy of enemies) {
      const baseColor  = ENEMY_COLORS[enemy.algoType];
      const traitColor = TRAIT_COLORS[enemy.trait];
      let color      = traitColor ?? baseColor;
      
      if (isFreezeActive) {
        color = '#22d3ee'; // cyan-400
      }

      const cx = offsetX + enemy.pos.col * tileSize + tileSize / 2;
      const cy = offsetY + enemy.pos.row * tileSize + tileSize / 2;

      // Boss/Elite bigger radius
      const isBoss  = enemy.trait === EnemyTrait.BOSS;
      const isElite = enemy.trait === EnemyTrait.ELITE;
      const r = tileSize * (isBoss ? 0.44 : isElite ? 0.38 : 0.33);

      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur  = isFreezeActive ? 24 : (isBoss ? 28 : isElite ? 22 : 16);

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
