// ============================================================
// game-loop.ts — requestAnimationFrame game loop (3-round demo)
// ============================================================

import {
  CellType,
  Direction,
  EnemyMode,
  EnemyTrait,
  GamePhase,
  TimedEventType,
  type BiomeId,
  type GameState,
  type Pos,
  type SessionLogType,
} from '../core/types.js';
import { InputHandler, Action } from './input-handler.js';
import { Renderer } from './renderer.js';
import { generateMaze } from '../core/maze-generator.js';
import { findWalkable, posEqual, crackKey } from '../core/graph.js';
import {
  activatePowerUp,
  activateFreeze,
  createPlayer,
  movePlayer,
  updatePlayer,
} from '../entities/player.js';
import {
  setFleeMode,
  setPursueMode,
  updateEnemy,
} from '../entities/enemy.js';
import {
  buildWave,
  calcWaveScore,
  getWaveTimeLimit,
  getRoundLives,
  getRoundBombs,
  getRoundIntro,
  ROUND_INTRO_DURATION,
} from './wave-manager.js';
import {
  buildTimedEvents,
  applyTimedEvent,
} from './timed-events.js';
import {
  tickAoeEvents,
  AOE_SPAWN_INTERVAL_MS,
} from './event-manager.js';
import { isWallSafe } from '../algorithms/dsu.js';
import { gameState } from '../stores/game-state.js';
import { settings } from '../stores/settings-store.js';
import { sessionConfig } from '../stores/session-config.js';
import { resolveTheme } from '../core/map-themes.js';
import type { Settings } from '../core/types.js';
import type { SessionConfig } from '../stores/session-config.js';

const TARGET_FPS   = 60;
const FIXED_STEP_MS = 1000 / TARGET_FPS;

/** Event label display duration. */
const EVENT_LABEL_MS = 3_000;

/** ROUND_INTRO display duration. */
const INTRO_DURATION = ROUND_INTRO_DURATION;

/** Lớp đại diện cho GameLoop. */
export class GameLoop {
  private _canvas: HTMLCanvasElement;
  private _renderer: Renderer;
  private _input: InputHandler;
  private _rafId: number = 0;
  private _running = false;
  private _lastTime = 0;
  private _accumulator = 0;

  private _state!: GameState;
  private _currentSettings!: Settings;
  private _currentSessionConfig!: SessionConfig;
  private _exitPos!: Pos;
  private _waveTimeMs = 0;
  private _pathInvalidFlag = false;

  /** Remaining ms for round intro screen. */
  private _introTimer = 0;

  /** Volatile: ms since last explosion. */
  private _volatileTimer = 0;
  /** Interval between Volatile explosions (ms). */
  private static readonly VOLATILE_INTERVAL = 5000;
  /** Duration to keep Volatile sector detonation visuals visible. */
  private static readonly VOLATILE_FLASH_MS = 650;

  /** Melted Slag (Lava Core MUD): cycle timer (ms). */
  private _slagTimer = 0;
  private static readonly SLAG_INTERVAL = 5000;
  private static readonly SLAG_ERUPT_MS = 1000; // last 1000 ms = eruption
  private static readonly THERMAL_REBUILD_MS = 5000;

  constructor(canvas: HTMLCanvasElement) {
    this._canvas = canvas;
    this._renderer = new Renderer(canvas);
    this._input = new InputHandler();

    settings.subscribe(s => {
      this._currentSettings = s;
      this._renderer.setTileSize(s.tileSize);
    });

    sessionConfig.subscribe(sc => {
      this._currentSessionConfig = sc;
    });

  }

  // --------------- Lifecycle ---------------

  start() {
    this._input.attach();
    this._initRound(1, true);
    this._running = true;
    this._lastTime = performance.now();
    this._loop(this._lastTime);
  }

  stop() {
    this._running = false;
    cancelAnimationFrame(this._rafId);
    this._input.detach();
  }

  pause() {
    if (this._state?.phase === GamePhase.PLAYING) {
      this._state = { ...this._state, phase: GamePhase.PAUSED };
      this._pushState();
    }
  }

  resume() {
    if (this._state?.phase === GamePhase.PAUSED) {
      this._state = { ...this._state, phase: GamePhase.PLAYING };
      this._lastTime = performance.now();
      this._pushState();
    }
  }

  private _formatRunTime(ms: number) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  private _appendSessionLog(msg: string, type: SessionLogType = 'info') {
    const elapsedMs = this._state?.timeElapsedMs ?? 0;
    const entry = {
      time: this._formatRunTime(elapsedMs),
      elapsedMs,
      msg,
      type,
    };
    const logs = [...(this._state.sessionLogs ?? []), entry].slice(-30);
    this._state = { ...this._state, sessionLogs: logs };
  }

  private _setEventLabel(msg: string, timer = EVENT_LABEL_MS, type: SessionLogType = 'info') {
    this._state = {
      ...this._state,
      lastEventLabel: msg,
      eventLabelTimer: timer,
    };
    this._appendSessionLog(msg, type);
  }

  restart() {
    cancelAnimationFrame(this._rafId);
    this._initRound(1, true);
    this._running = true;
    this._lastTime = performance.now();
    this._loop(this._lastTime);
  }

  loadState(savedState: GameState) {
    cancelAnimationFrame(this._rafId);
    // Patch player for any saved states predating the mudBlocked field
    const patchedGrid = savedState.grid.map(row =>
      row.map(cell => {
        const numericCell = cell as unknown as number;
        if (numericCell === 11 || numericCell === 13 || cell === CellType.BRIDGE) {
          return CellType.FLOOR;
        }
        return cell;
      })
    );

    // Find a valid floor cell for the player if needed (fallback)
    let validStartPos = savedState.player.pos;
    if (patchedGrid[validStartPos.row]?.[validStartPos.col] !== CellType.FLOOR) {
      for (let r = 1; r < patchedGrid.length - 1; r++) {
        for (let c = 1; c < patchedGrid[0].length - 1; c++) {
          if (patchedGrid[r][c] === CellType.FLOOR) {
            validStartPos = { row: r, col: c };
            break;
          }
        }
        if (validStartPos !== savedState.player.pos) break;
      }
    }

    this._state = {
      ...savedState,
      grid: patchedGrid,
      ladders: savedState.ladders ?? [],
      sessionLogs: savedState.sessionLogs ?? [],
      player: { 
        ...savedState.player, 
        pos: validStartPos,
        mudBlocked: false, 
      },
    };

    // Find exit pos from grid
    this._exitPos = { row: 1, col: 1 };
    for (let r = 0; r < savedState.grid.length; r++) {
      for (let c = 0; c < savedState.grid[0].length; c++) {
        if (savedState.grid[r][c] === CellType.EXIT) {
          this._exitPos = { row: r, col: c };
          break;
        }
      }
    }
    this._waveTimeMs = 0;
    this._pathInvalidFlag = true;
    this._pathInvalidFlag = true;

    this._canvas.width  = window.innerWidth;
    this._canvas.height = window.innerHeight;

    this._pushState();
    this._input.attach();
    this._running = true;
    this._lastTime = performance.now();
    this._loop(this._lastTime);
  }

  // --------------- rAF Loop ---------------

  private _loop = (timestamp: number) => {
    if (!this._running) return;
    this._rafId = requestAnimationFrame(this._loop);

    const delta = Math.min(timestamp - this._lastTime, 100);
    this._lastTime = timestamp;

    // Round intro: just render, countdown, then start playing
    if (this._state.phase === GamePhase.ROUND_INTRO) {
      this._introTimer -= delta;
      if (this._introTimer <= 0) {
        this._state = { ...this._state, phase: GamePhase.PLAYING };
        this._lastTime = performance.now();
        this._pushState();
      }
      this._renderer.render(this._state);
      return;
    }

    if (this._state.phase !== GamePhase.PLAYING) {
      this._renderer.render(this._state);
      return;
    }

    this._accumulator += delta;
    while (this._accumulator >= FIXED_STEP_MS) {
      this._tick(FIXED_STEP_MS);
      this._accumulator -= FIXED_STEP_MS;
    }

    this._renderer.render(this._state);
  };

  // --------------- Single Tick ---------------

  private _tick(dt: number) {
    this._state = {
      ...this._state,
      timeElapsedMs: this._state.timeElapsedMs + dt,
    };
    this._processInput();
    this._updateEntities(dt);
    this._checkCollisions();
    this._updateWaveTimer(dt);
    this._processTimedEvents();
    this._tickEventLabel(dt);
    this._updateBiomeGimmicks(dt);
    this._pushState();
  }

  // --------------- Input Processing ---------------

  private _processInput() {
    const actions = this._input.flush();
    for (const action of actions) {
      switch (action) {
        case Action.MOVE_UP:    this._tryMove(Direction.UP);    break;
        case Action.MOVE_DOWN:  this._tryMove(Direction.DOWN);  break;
        case Action.MOVE_LEFT:  this._tryMove(Direction.LEFT);  break;
        case Action.MOVE_RIGHT: this._tryMove(Direction.RIGHT); break;
        case Action.PLACE_WALL: this._useWallBomb();            break;
        case Action.INTERACT:   this._interact();               break;

        case Action.PAUSE:
          if (this._state.phase === GamePhase.PLAYING) this.pause();
          else if (this._state.phase === GamePhase.PAUSED) this.resume();
          break;
      }
    }
  }

  private _tryMove(dir: Direction) {
    const { player, grid } = this._state;

    const oldPos = player.pos;

    const newPlayer = movePlayer(player, dir, grid, this._state.ladders);
    if (!newPlayer) {
      // Mud slow: nếu player đang bị chặn bởi bùn thì chỉ reset cờ mudBlocked,
      // không thay đổi vị trí và không trigger pathInvalidFlag.
      const currentCell = grid[player.pos.row]?.[player.pos.col];
      const delta = dir === Direction.UP ? { row: -1, col: 0 }
        : dir === Direction.DOWN ? { row: 1, col: 0 }
        : dir === Direction.LEFT ? { row: 0, col: -1 }
        : { row: 0, col: 1 };
      const targetCell = grid[player.pos.row + delta.row]?.[player.pos.col + delta.col];
      const isMudBlock =
        (currentCell === CellType.MUD || targetCell === CellType.MUD) &&
        player.mudBlocked;
      if (isMudBlock) {
        this._state = { ...this._state, player: { ...player, mudBlocked: false } };
      }
      return;
    }

    let newGrid = grid;
    const oldCell = grid[oldPos.row]?.[oldPos.col];
    if (oldCell === CellType.CRACK) {
      newGrid = grid.map(r => [...r]);
      newGrid[oldPos.row][oldPos.col] = CellType.WALL;
      this._pathInvalidFlag = true;
    }

    // ── CONVEYOR effect (Cooling Sea) ─────────────────────────────────────
    // Check the DESTINATION cell of this move.
    const destCell = grid[newPlayer.pos.row]?.[newPlayer.pos.col];
    let finalPlayer = newPlayer;
    if (
      destCell === CellType.CONVEYOR_UP   ||
      destCell === CellType.CONVEYOR_DOWN ||
      destCell === CellType.CONVEYOR_LEFT ||
      destCell === CellType.CONVEYOR_RIGHT
    ) {
      const conveyorDir =
        destCell === CellType.CONVEYOR_UP    ? Direction.UP   :
        destCell === CellType.CONVEYOR_DOWN  ? Direction.DOWN :
        destCell === CellType.CONVEYOR_LEFT  ? Direction.LEFT : Direction.RIGHT;

      if (conveyorDir === dir) {
        // Moving WITH the stream → bonus move in same direction immediately
        const bonusPlayer = movePlayer(finalPlayer, dir, newGrid, this._state.ladders);
        if (bonusPlayer) finalPlayer = bonusPlayer;
      } else if (
        (conveyorDir === Direction.UP    && dir === Direction.DOWN)  ||
        (conveyorDir === Direction.DOWN  && dir === Direction.UP)    ||
        (conveyorDir === Direction.LEFT  && dir === Direction.RIGHT) ||
        (conveyorDir === Direction.RIGHT && dir === Direction.LEFT)
      ) {
        // Moving AGAINST the stream → consume one extra move (skip next input)
        // We simulate this by blocking mudBlocked for one step
        finalPlayer = { ...finalPlayer, mudBlocked: true };
      }
    }

    this._state = { ...this._state, player: finalPlayer, grid: newGrid };
    this._pathInvalidFlag = true;
  }

  private _interact() {
    const { player, ladders } = this._state;
    
    // Toggle ladder interaction
    for (const ladder of ladders) {
      if (ladder.isCollapsed) continue;
      if (ladder.path_nodes.length < 2) continue;
      
      let playerOnLadderNode = false;
      for (const node of ladder.path_nodes) {
        if (player.pos.row === node.row && player.pos.col === node.col) {
          playerOnLadderNode = true;
          break;
        }
      }
      
      if (playerOnLadderNode) {
        // Toggle ladder state
        this._state = {
          ...this._state,
          player: {
            ...player,
            isOnLadder: !player.isOnLadder,
          }
        };
        break;
      }
    }
  }

  private _useWallBomb() {
    const { player, grid } = this._state;
    if (player.wallBombs <= 0) return;

    let destroyed = false;
    const newGrid = grid.map(row => [...row]);
    const { row, col } = player.pos;

    const neighbors: Pos[] = [
      { row: row - 1, col },
      { row: row + 1, col },
      { row, col: col - 1 },
      { row, col: col + 1 },
    ];

    for (const nb of neighbors) {
      if (nb.row > 0 && nb.row < grid.length - 1 && nb.col > 0 && nb.col < grid[0].length - 1) {
        if (newGrid[nb.row][nb.col] === CellType.WALL) {
          newGrid[nb.row][nb.col] = CellType.FLOOR;
          destroyed = true;
        }
      }
    }

    if (!destroyed) return;

    this._state = {
      ...this._state,
      grid: newGrid,
      player: { ...player, wallBombs: player.wallBombs - 1 },
    };
    this._appendSessionLog('WALL BOMB DETONATED', 'warning');
    this._pathInvalidFlag = true;
  }

// --------------- Entity Updates ---------------

  private _updateEntities(dt: number) {
    let player = this._state.player;
    player = updatePlayer(player, dt);

    // ICE slide
    if (player.isSliding && player.slideDir) {
      const slid = movePlayer(player, player.slideDir, this._state.grid);
      if (slid) {
        player = slid;
        this._pathInvalidFlag = true;
      } else {
        player = { ...player, isSliding: false, slideDir: null };
      }
    }

    // Power-up expiry → restore enemy pursue mode
    const wasActivated = this._state.player.powerUpTimer > 0;
    const nowExpired   = player.powerUpTimer === 0;
    let enemies = this._state.enemies;

    if (wasActivated && nowExpired) {
      enemies = enemies.map(setPursueMode);
    }

    // Update enemies (frozen check)
    if (player.freezeTimer <= 0) {
      // Confused target: a position away from player
      const confusedTarget: Pos = {
        row: this._exitPos.row,
        col: 1,
      };

      // Bridge congestion: allow only 1 enemy on a bridge at a time
      const bridgeOccupancy: Record<string, string> = {};
      for (const e of enemies) {
        if (e.onBridge) {
          const k = crackKey(e.pos);
          bridgeOccupancy[k] = e.id;
        }
      }

      enemies = enemies.map(e => {
        // Check if next step would be onto a bridge already occupied
        const nextInCache = e.pathCache[0];
        if (
          nextInCache &&
          this._state.grid[nextInCache.row]?.[nextInCache.col] === CellType.BRIDGE
        ) {
          const k = crackKey(nextInCache);
          const occupant = bridgeOccupancy[k];
          if (occupant && occupant !== e.id) {
            // Skip movement this tick (congestion)
            return { ...e, stepTimer: 0 };
          }
        }

        return updateEnemy(
          e,
          dt,
          this._state.grid,
          player.pos,
          this._exitPos,
          this._pathInvalidFlag,
          this._state.ladders,
          confusedTarget,
          this._state.playerInStealth
        );
      });
    }

    this._state = { ...this._state, player, enemies };
    this._pathInvalidFlag = false;
  }

  // --------------- Collision Detection ---------------

  private _checkCollisions() {
    const { player, enemies, grid } = this._state;

    // Player vs Enemy
    let scoreGained = 0;
    const updatedEnemies = [...enemies];
    for (let i = 0; i < enemies.length; i++) {
      const enemy = enemies[i];
      if (posEqual(player.pos, enemy.pos)) {
        if (player.powerUpTimer > 0) {
          updatedEnemies[i] = { ...enemy, pos: { row: 1, col: 1 }, pathCache: [], visitedCache: [] };
          scoreGained += 500;
        } else {
          this._loseLife();
          return;
        }
      }
    }

    if (scoreGained > 0) {
      this._state = { ...this._state, score: this._state.score + scoreGained, enemies: updatedEnemies };
      this._appendSessionLog(`ENEMY NEUTRALIZED +${scoreGained}`, 'success');
    }

    // --- Pickups from grid ---
    const cell = grid[player.pos.row][player.pos.col];
    if (
      cell === CellType.CRYSTAL    ||
      cell === CellType.FREEZE_CLOCK ||
      cell === CellType.BOMB_PICKUP
    ) {
      const newGrid = grid.map(row => [...row]);
      newGrid[player.pos.row][player.pos.col] = CellType.FLOOR;

      let newPlayer = player;
      let newEnemies = this._state.enemies;

      if (cell === CellType.CRYSTAL) {
        newPlayer  = activatePowerUp(player);
        newEnemies = this._state.enemies.map(setFleeMode);
        this._setEventLabel('POWER CRYSTAL ENGAGED', EVENT_LABEL_MS, 'crystal');
      } else if (cell === CellType.FREEZE_CLOCK) {
        newPlayer = activateFreeze(player);
        this._setEventLabel('FREEZE CLOCK ACTIVATED', EVENT_LABEL_MS, 'info');
      } else if (cell === CellType.BOMB_PICKUP) {
        if (player.wallBombs < 5) {
          newPlayer = { ...player, wallBombs: player.wallBombs + 1 };
          this._appendSessionLog('WALL BOMB ACQUIRED', 'info');
        } else {
          this._state = { ...this._state, score: this._state.score + 200 };
          this._appendSessionLog('BOMB CACHE CONVERTED +200', 'success');
        }
      }

      this._state = { ...this._state, grid: newGrid, player: newPlayer, enemies: newEnemies };
    }

    // --- Exit ---
    if (posEqual(player.pos, this._exitPos)) {
      this._completeRound();
    }
  }

  // --------------- Biome Gimmick Logic ---------------

  private _updateBiomeGimmicks(dt: number) {
    const { currentBiome, grid, player } = this._state;

    // ── STEALTH (Data Jungle) ──────────────────────────────────────────
    // MUD tiles become "Stealth Vines" — same 70% vision reduction as STEALTH_NODE
    if (currentBiome === 'data_jungle') {
      const cell = grid[player.pos.row]?.[player.pos.col];
      const inStealth = cell === CellType.STEALTH_NODE || cell === CellType.MUD;
      if (inStealth !== this._state.playerInStealth) {
        this._state = { ...this._state, playerInStealth: inStealth };
        this._pathInvalidFlag = true;
      }
    }

    // ── CONVEYOR (Cooling Sea) ─────────────────────────────────────────
    // Handled inside _tryMove via speed modifier. Nothing to tick here.

    // ── VOLATILE SECTORS (Lava Core) ──────────────────────────────────
    if (currentBiome === 'lava_core') {
      this._volatileTimer += dt;
      if (this._volatileTimer >= GameLoop.VOLATILE_INTERVAL) {
        this._volatileTimer -= GameLoop.VOLATILE_INTERVAL;
        this._triggerVolatileExplosion();
      }
      const volatileHot = this._volatileTimer < GameLoop.VOLATILE_FLASH_MS
        ? this._state.volatileHot
        : new Set<string>();
      this._state = { ...this._state, volatileTimer: this._volatileTimer, volatileHot };

      // ── MELTED SLAG (Lava Core MUD — 5 s cycle, last 1 s = eruption) ──
      this._slagTimer += dt;
      if (this._slagTimer >= GameLoop.SLAG_INTERVAL) {
        this._slagTimer -= GameLoop.SLAG_INTERVAL;
      }
      const erupting = this._slagTimer >= GameLoop.SLAG_INTERVAL - GameLoop.SLAG_ERUPT_MS;
      const slagHot  = new Set<string>();
      if (erupting) {
        for (let r = 0; r < grid.length; r++) {
          for (let c = 0; c < grid[0].length; c++) {
            if (grid[r][c] === CellType.MUD) slagHot.add(`${r},${c}`);
          }
        }
        if (slagHot.has(`${player.pos.row},${player.pos.col}`)) {
          this._state = { ...this._state, slagTimer: this._slagTimer, slagHot };
          this._loseLife();
          return;
        }
      }
      this._state = { ...this._state, slagTimer: this._slagTimer, slagHot };

      this._tickThermalElevators(dt);
    }

    // ── TACTICAL AOE EVENTS (all biomes) ──────────────────────────────
    this._tickAoeEvents(dt);
  }

  private _nextThermalCollapseMs(): number {
    return 7_000 + Math.floor(Math.random() * 8_000);
  }

  private _tickThermalElevators(dt: number) {
    let changed = false;
    const { player } = this._state;

    const ladders = this._state.ladders.map(ladder => {
      if (!ladder.path_nodes?.length) return ladder;

      if (ladder.isCollapsed) {
        const regenerateTimerMs = (ladder.regenerateTimerMs ?? GameLoop.THERMAL_REBUILD_MS) - dt;
        if (regenerateTimerMs <= 0) {
          changed = true;
          return {
            ...ladder,
            isCollapsed: false,
            collapseTimerMs: this._nextThermalCollapseMs(),
            regenerateTimerMs: undefined,
          };
        }
        return { ...ladder, regenerateTimerMs };
      }

      const collapseTimerMs = (ladder.collapseTimerMs ?? this._nextThermalCollapseMs()) - dt;
      if (collapseTimerMs <= 0) {
        changed = true;
        return {
          ...ladder,
          isCollapsed: true,
          collapseTimerMs: undefined,
          regenerateTimerMs: GameLoop.THERMAL_REBUILD_MS,
        };
      }

      if (collapseTimerMs !== ladder.collapseTimerMs) changed = true;
      return { ...ladder, collapseTimerMs };
    });

    if (!changed) return;

    const collapsedUnderPlayer = ladders.find(ladder =>
      ladder.isCollapsed && ladder.path_nodes.some(node => posEqual(node, player.pos))
    );
    let updatedPlayer = player;
    if (collapsedUnderPlayer) {
      const endpoints = [
        collapsedUnderPlayer.path_nodes[0],
        collapsedUnderPlayer.path_nodes[collapsedUnderPlayer.path_nodes.length - 1],
      ];
      const nearest = endpoints.reduce((best, cur) => {
        const bestDist = Math.abs(best.row - player.pos.row) + Math.abs(best.col - player.pos.col);
        const curDist = Math.abs(cur.row - player.pos.row) + Math.abs(cur.col - player.pos.col);
        return curDist < bestDist ? cur : best;
      });
      updatedPlayer = { ...player, pos: nearest, isOnLadder: false };
    }

    this._state = {
      ...this._state,
      ladders,
      player: updatedPlayer,
    };
    this._pathInvalidFlag = true;
  }

  /** Tick Tactical AoE Events and apply biome-specific detonation side-effects. */
  private _tickAoeEvents(dt: number) {
    const { aoeEvents, nextAoeMs, currentBiome, grid, player, enemies } = this._state;

    const result = tickAoeEvents(aoeEvents, nextAoeMs, dt, currentBiome, grid, player, enemies);

    let newPlayer  = player;
    let newEnemies = enemies;
    let label      = this._state.lastEventLabel;
    let labelTimer = this._state.eventLabelTimer;

    for (const det of result.detonations) {
      newEnemies = det.enemies;

      // Data Jungle — Sensor Jamming
      if (det.playerSensorJamMs > 0) {
        newPlayer = { ...newPlayer, sensorJamTimer: det.playerSensorJamMs, fogRadius: 1 };
      }

      // Cooling Sea — Push + Slide
      if (det.playerPushedTo) {
        newPlayer = {
          ...newPlayer,
          pos:       det.playerPushedTo,
          isSliding: det.playerPushedSlide !== null,
          slideDir:  det.playerPushedSlide,
        };
        this._pathInvalidFlag = true;
      }

      // Lava Core — Damage
      if (det.playerDamaged) {
        this._state = { ...this._state, aoeEvents: result.events, nextAoeMs: result.nextAoeMs,
          player: newPlayer, enemies: newEnemies };
        this._loseLife();
        return;
      }
    }

    if (result.eventLabel) {
      label      = result.eventLabel;
      labelTimer = 3_000;
      this._appendSessionLog(result.eventLabel, 'warning');
    }

    this._state = {
      ...this._state,
      aoeEvents:       result.events,
      nextAoeMs:       result.nextAoeMs,
      player:          newPlayer,
      enemies:         newEnemies,
      lastEventLabel:  label,
      eventLabelTimer: labelTimer,
    };
  }

  /** Detonate all VOLATILE tiles. Kill player if standing on one. */
  private _triggerVolatileExplosion() {
    const { grid, player } = this._state;
    const hot = new Set<string>();
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[0].length; c++) {
        if (grid[r][c] === CellType.VOLATILE) {
          hot.add(`${r},${c}`);
        }
      }
    }
    this._state = { ...this._state, volatileHot: hot, lastEventLabel: '🔥 VOLATILE DETONATION!', eventLabelTimer: 2500 };

    this._appendSessionLog('VOLATILE DETONATION!', 'warning');

    if (hot.has(`${player.pos.row},${player.pos.col}`)) {
      this._loseLife();
    }
  }

  // --------------- Wave Timer ---------------

  private _updateWaveTimer(dt: number) {
    this._waveTimeMs += dt;
    const limit = getWaveTimeLimit(this._state.wave);
    if (limit > 0 && this._waveTimeMs >= limit) {
      this._appendSessionLog('ROUND TIMER EXPIRED', 'warning');
      this._loseLife();
    }
  }

  // --------------- Timed Events ---------------

  private _processTimedEvents() {
    const { timedEvents, round } = this._state;
    let changed = false;
    let newGrid  = this._state.grid;
    let enemies  = this._state.enemies;
    let label    = this._state.lastEventLabel;
    let labelTimer = this._state.eventLabelTimer;

    const updatedEvents = timedEvents.map(ev => {
      if (ev.fired || this._waveTimeMs < ev.triggerMs) return ev;

      // Apply
      const baseInterval = 380; // normal difficulty fallback
      const result = applyTimedEvent(ev, { ...this._state, grid: newGrid, enemies }, baseInterval);

      newGrid  = result.grid as typeof newGrid;
      enemies  = result.enemies;
      label    = ev.label;
      labelTimer = EVENT_LABEL_MS;
      this._appendSessionLog(ev.label, 'info');
      changed  = true;

      // Ladder spawned via timed event
      if (result.newLadder) {
        this._state = {
          ...this._state,
          ladders: [...this._state.ladders, result.newLadder],
        };
        this._pathInvalidFlag = true;
      }

      if (result.grid !== newGrid) this._pathInvalidFlag = true;

      return { ...ev, fired: true };
    });

    if (changed) {
      this._pathInvalidFlag = true;
      this._state = {
        ...this._state,
        grid: newGrid,
        enemies,
        timedEvents: updatedEvents,
        lastEventLabel: label,
        eventLabelTimer: labelTimer,
      };

      this._canvas.width  = window.innerWidth;
      this._canvas.height = window.innerHeight;
    } else {
      this._state = { ...this._state, timedEvents: updatedEvents };
    }
  }

  // --------------- Event label countdown ---------------

  private _tickEventLabel(dt: number) {
    if (this._state.eventLabelTimer > 0) {
      this._state = {
        ...this._state,
        eventLabelTimer: Math.max(0, this._state.eventLabelTimer - dt),
      };
    }
  }

  // --------------- Life / Round Management ---------------

  private _loseLife() {
    const lives = this._state.lives - 1;
    if (lives <= 0) {
      this._state = { ...this._state, lives: 0, phase: GamePhase.GAME_OVER };
      this._appendSessionLog('OPERATOR DOWN - GAME OVER', 'error');
    } else {
      this._state = {
        ...this._state,
        lives,
        player: createPlayer({ row: 1, col: 1 }, getRoundBombs(this._state.round)),
      };
      this._appendSessionLog(`OPERATOR HIT - ${lives} LIVES REMAINING`, 'error');
    }
    this._pushState();
  }

  private _completeRound() {
    const timeRemaining = Math.max(0, getWaveTimeLimit(this._state.wave) - this._waveTimeMs);
    const bonus    = calcWaveScore(this._state.wave, timeRemaining);
    const newScore = this._state.score + bonus;
    const nextWave = this._state.wave + 1;

    this._state = { ...this._state, score: newScore };
    this._appendSessionLog(`ROUND ${this._state.round} CLEARED +${bonus}`, 'success');
    this._initRound(nextWave, false);
  }

  // --------------- Round Initialization ---------------

  private _initRound(wave: number, isRestart: boolean) {
    const s    = this._currentSettings;
    const round = wave;

    // ── Resolve Biome ──────────────────────────────────────────────────
    const selectedBiome = (this._currentSessionConfig?.biome ?? 'data_jungle') as import('../core/types.js').BiomeId;
    const themeConfig   = resolveTheme(selectedBiome);
    const currentBiome  = themeConfig.id;
    this._volatileTimer = 0;

    const baseSize = 15;
    const scaleFactor = Math.floor((round - 1) / 3);
    const MAX_GRID_SIZE = 35;

    let size = Math.min(baseSize + scaleFactor * 4, MAX_GRID_SIZE);
    let rows = size;
    let cols = size;
    if (rows % 2 === 0) rows++;
    if (cols % 2 === 0) cols++;

    const { grid, start, exit, ladders } = generateMaze({
      rows,
      cols,
      round,
    });

    // ── Inject Biome Gimmick Tiles ─────────────────────────────────────
    this._injectBiomeTiles(grid, currentBiome, themeConfig.gimmickDensity);

    this._waveTimeMs      = 0;
    this._pathInvalidFlag = false;
    this._introTimer      = INTRO_DURATION;
    this._exitPos         = exit;

    // Force Player Spawn on Floor
    let validStart = start;
    if (grid[validStart.row]?.[validStart.col] !== CellType.FLOOR) {
      for (let r = 1; r < rows - 1; r++) {
        for (let c = 1; c < cols - 1; c++) {
          if (grid[r][c] === CellType.FLOOR) {
            validStart = { row: r, col: c };
            break;
          }
        }
        if (validStart !== start) break;
      }
    }

    const lives   = isRestart ? getRoundLives(round) : (this._state?.lives ?? getRoundLives(round));
    const timeElapsedMs = isRestart ? 0 : (this._state?.timeElapsedMs ?? 0);
    const sessionLogs = isRestart ? [] : (this._state?.sessionLogs ?? []);
    
    let bombs = getRoundBombs(round);
    if (!isRestart && this._state && this._state.player) {
      bombs = Math.min(5, this._state.player.wallBombs + 1);
    }
    
    const player  = createPlayer(validStart, bombs);
    player.isOnLadder = false;

    const difficulty = this._currentSessionConfig?.difficulty ?? s?.difficulty ?? 'normal';
    const enemies = buildWave(wave, grid, validStart, difficulty);
    const timedEvents     = buildTimedEvents(round);

    this._state = {
      phase: GamePhase.ROUND_INTRO,
      score: isRestart ? 0 : (this._state?.score ?? 0),
      round,
      wave,
      lives,
      timeElapsedMs,
      debugMode: false,
      fogEnabled: s?.fogEnabled ?? true,
      player,
      enemies,
      grid,
      ladders,
      timedEvents,
      lastEventLabel: '',
      eventLabelTimer: 0,
      sessionLogs,
      bridgeOccupancy: {},
      // Biome
      selectedBiome,
      currentBiome,
      volatileTimer: 0,
      volatileHot: new Set<string>(),
      playerInStealth: false,
      // AoE Events — first event spawns after 10 s
      aoeEvents: [],
      nextAoeMs: AOE_SPAWN_INTERVAL_MS,
      // Melted Slag
      slagTimer: 0,
      slagHot: new Set<string>(),
    };

    this._canvas.width  = window.innerWidth;
    this._canvas.height = window.innerHeight;

    this._appendSessionLog(`ROUND ${round} START - ${themeConfig.label}`, 'info');
    this._pushState();
  }

  /** Sprinkle biome gimmick tiles across floor cells. */
  private _injectBiomeTiles(
    grid: import('../core/types.js').Grid,
    biome: Exclude<import('../core/types.js').BiomeId, 'shuffle'>,
    density: number
  ) {
    const rows = grid.length;
    const cols = grid[0].length;
    const floorCells: Pos[] = [];
    for (let r = 1; r < rows - 1; r++) {
      for (let c = 1; c < cols - 1; c++) {
        if (grid[r][c] === CellType.FLOOR) floorCells.push({ row: r, col: c });
      }
    }
    const count = Math.floor(floorCells.length * density);
    // Fisher-Yates shuffle slice
    for (let i = floorCells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [floorCells[i], floorCells[j]] = [floorCells[j], floorCells[i]];
    }
    const targets = floorCells.slice(0, count);

    if (biome === 'data_jungle') {
      for (const p of targets) grid[p.row][p.col] = CellType.STEALTH_NODE;
    } else if (biome === 'cooling_sea') {
      const dirs = [CellType.CONVEYOR_UP, CellType.CONVEYOR_DOWN, CellType.CONVEYOR_LEFT, CellType.CONVEYOR_RIGHT];
      for (const p of targets) grid[p.row][p.col] = dirs[Math.floor(Math.random() * dirs.length)];
    } else if (biome === 'lava_core') {
      for (const p of targets) grid[p.row][p.col] = CellType.VOLATILE;
    }
  }

  // --------------- Push state to store ---------------

  private _pushState() {
    gameState.set({ ...this._state, debugMode: false });
  }
}
