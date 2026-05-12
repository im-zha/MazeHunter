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
  type GameState,
  type Pos,
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
import { isWallSafe } from '../algorithms/dsu.js';
import { gameState } from '../stores/game-state.js';
import { debugMode, toggleDebug } from '../stores/debug-store.js';
import { settings } from '../stores/settings-store.js';
import type { Settings } from '../core/types.js';

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
  private _exitPos!: Pos;
  private _waveTimeMs = 0;
  private _pathInvalidFlag = false;
  private _debugMode = false;

  /** Remaining ms for round intro screen. */
  private _introTimer = 0;

  constructor(canvas: HTMLCanvasElement) {
    this._canvas = canvas;
    this._renderer = new Renderer(canvas);
    this._input = new InputHandler();

    settings.subscribe(s => {
      this._currentSettings = s;
      this._renderer.setTileSize(s.tileSize);
    });

    debugMode.subscribe(d => {
      this._debugMode = d;
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
      row.map(cell => ((cell as unknown as number) === 11 || (cell as unknown as number) === 13) ? CellType.FLOOR : cell)
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
      player: { 
        ...savedState.player, 
        pos: validStartPos,
        mudBlocked: false, 
        isClimbing: false, 
        climbTimer: 0, 
        climbDuration: 0, 
        climbStart: null, 
        climbEnd: null 
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
    this._processInput();
    this._updateEntities(dt);
    this._checkCollisions();
    this._updateWaveTimer(dt);
    this._processTimedEvents();
    this._tickEventLabel(dt);
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

    this._state = { ...this._state, player: newPlayer, grid: newGrid };
    this._pathInvalidFlag = true;
  }

  private _interact() {
    const { player, ladders } = this._state;
    
    // Toggle ladder interaction
    for (const ladder of ladders) {
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
          confusedTarget
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
    }

    if (scoreGained > 0) {
      this._state = { ...this._state, score: this._state.score + scoreGained, enemies: updatedEnemies };
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
      } else if (cell === CellType.FREEZE_CLOCK) {
        newPlayer = activateFreeze(player);
      } else if (cell === CellType.BOMB_PICKUP) {
        if (player.wallBombs < 5) {
          newPlayer = { ...player, wallBombs: player.wallBombs + 1 };
        } else {
          this._state = { ...this._state, score: this._state.score + 200 };
        }
      }

      this._state = { ...this._state, grid: newGrid, player: newPlayer, enemies: newEnemies };
    }

    // --- Exit ---
    if (posEqual(player.pos, this._exitPos)) {
      this._completeRound();
    }
  }

  // --------------- Wave Timer ---------------

  private _updateWaveTimer(dt: number) {
    this._waveTimeMs += dt;
    const limit = getWaveTimeLimit(this._state.wave);
    if (limit > 0 && this._waveTimeMs >= limit) {
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
    } else {
      this._state = {
        ...this._state,
        lives,
        player: createPlayer({ row: 1, col: 1 }, getRoundBombs(this._state.round)),
      };
    }
    this._pushState();
  }

  private _completeRound() {
    const timeRemaining = Math.max(0, getWaveTimeLimit(this._state.wave) - this._waveTimeMs);
    const bonus    = calcWaveScore(this._state.wave, timeRemaining);
    const newScore = this._state.score + bonus;
    const nextWave = this._state.wave + 1;

    this._state = { ...this._state, score: newScore };
    this._initRound(nextWave, false);
  }

  // --------------- Round Initialization ---------------

  private _initRound(wave: number, isRestart: boolean) {
    const s    = this._currentSettings;
    const round = wave;

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
    
    let bombs = getRoundBombs(round);
    if (!isRestart && this._state && this._state.player) {
      bombs = Math.min(5, this._state.player.wallBombs + 1);
    }
    
    const player  = createPlayer(validStart, bombs);
    player.isOnLadder = false;

    const enemies = buildWave(wave, grid, validStart, s?.difficulty ?? 'normal');
    const timedEvents     = buildTimedEvents(round);

    this._state = {
      phase: GamePhase.ROUND_INTRO,
      score: isRestart ? 0 : (this._state?.score ?? 0),
      round,
      wave,
      lives,
      timeElapsedMs: 0,
      debugMode: this._debugMode,
      fogEnabled: s?.fogEnabled ?? true,
      player,
      enemies,
      grid,
      ladders,
      timedEvents,
      lastEventLabel: '',
      eventLabelTimer: 0,
      bridgeOccupancy: {},
    };

    this._canvas.width  = window.innerWidth;
    this._canvas.height = window.innerHeight;

    this._pushState();
  }

  // --------------- Push state to store ---------------

  private _pushState() {
    gameState.set({ ...this._state, debugMode: this._debugMode });
  }
}
