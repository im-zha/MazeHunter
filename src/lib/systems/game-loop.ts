// ============================================================
// game-loop.ts — requestAnimationFrame game loop
// ============================================================

import {
  CellType,
  Direction,
  EnemyMode,
  GamePhase,
  type GameState,
  type Pos,
} from '../core/types.js';
import { InputHandler, Action } from './input-handler.js';
import { Renderer } from './renderer.js';
import { generateMaze } from '../core/maze-generator.js';
import { findCells, posEqual } from '../core/graph.js';
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
import { buildWave, calcWaveScore, getWaveTimeLimit } from './wave-manager.js';
import { isWallSafe } from '../algorithms/dsu.js';
import { gameState } from '../stores/game-state.js';
import { debugMode, toggleDebug } from '../stores/debug-store.js';
import { settings } from '../stores/settings-store.js';
import type { Settings } from '../core/types.js';

const TARGET_FPS = 60;
const FIXED_STEP_MS = 1000 / TARGET_FPS;

export class GameLoop {
  private _canvas: HTMLCanvasElement;
  private _renderer: Renderer;
  private _input: InputHandler;
  private _rafId: number = 0;
  private _running = false;
  private _lastTime = 0;
  private _accumulator = 0;

  // Game state (mutable, not reactive — passed to stores after each tick)
  private _state!: GameState;
  private _currentSettings!: Settings;
  private _exitPos!: Pos;
  private _waveTimeMs = 0;
  private _pathInvalidFlag = false;
  private _debugMode = false;

  constructor(canvas: HTMLCanvasElement) {
    this._canvas = canvas;
    this._renderer = new Renderer(canvas);
    this._input = new InputHandler();

    // Subscribe to settings
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
    this._initWave(1);
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
    this._initWave(1);
    this._running = true;
    this._lastTime = performance.now();
    this._loop(this._lastTime);
  }

  loadState(savedState: GameState) {
    cancelAnimationFrame(this._rafId);
    this._state = savedState;
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
    this._pathInvalidFlag = true; // force path recalculation for enemies

    const ts = this._currentSettings?.tileSize ?? 32;
    this._canvas.width = savedState.grid[0].length * ts;
    this._canvas.height = savedState.grid.length * ts;

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

    const delta = Math.min(timestamp - this._lastTime, 100); // cap at 100ms
    this._lastTime = timestamp;

    if (this._state.phase !== GamePhase.PLAYING) {
      // Still render even when paused
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
        case Action.TOGGLE_DEBUG: toggleDebug();                break;
        case Action.PAUSE:
          if (this._state.phase === GamePhase.PLAYING) this.pause();
          else if (this._state.phase === GamePhase.PAUSED) this.resume();
          break;
      }
    }
  }

  private _tryMove(dir: Direction) {
    const newPlayer = movePlayer(this._state.player, dir, this._state.grid);
    if (!newPlayer) return;
    this._state = { ...this._state, player: newPlayer };
    // Invalidate enemy paths whenever player moves
    this._pathInvalidFlag = true;
  }

  private _useWallBomb() {
    const { player, grid } = this._state;
    if (player.wallBombs <= 0) return;

    let destroyed = false;
    const newGrid = grid.map(row => [...row]);
    const { row, col } = player.pos;

    // Check 4 adjacent directions
    const neighbors: Pos[] = [
      { row: row - 1, col: col },
      { row: row + 1, col: col },
      { row: row, col: col - 1 },
      { row: row, col: col + 1 },
    ];

    for (const nb of neighbors) {
      // Prevent destroying outer boundaries
      if (nb.row > 0 && nb.row < grid.length - 1 && nb.col > 0 && nb.col < grid[0].length - 1) {
        if (newGrid[nb.row][nb.col] === CellType.WALL) {
          newGrid[nb.row][nb.col] = CellType.FLOOR;
          destroyed = true;
        }
      }
    }

    if (!destroyed) return; // Keep bomb if no walls were effectively destroyed

    this._state = {
      ...this._state,
      grid: newGrid,
      player: { ...player, wallBombs: player.wallBombs - 1 },
    };
    this._pathInvalidFlag = true;
  }

  // --------------- Entity Updates ---------------

  private _updateEntities(dt: number) {
    // Update player (power-up timer, ICE slide)
    let player = updatePlayer(this._state.player, dt);

    // ICE slide: continue moving in slide direction
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
    const nowExpired = player.powerUpTimer === 0;
    let enemies = this._state.enemies;

    if (wasActivated && nowExpired) {
      enemies = enemies.map(setPursueMode);
    }

    // Update enemies (if not frozen)
    if (player.freezeTimer <= 0) {
      enemies = enemies.map(e =>
        updateEnemy(e, dt, this._state.grid, player.pos, this._exitPos, this._pathInvalidFlag)
      );
    }

    this._state = { ...this._state, player, enemies };
    this._pathInvalidFlag = false;
  }

  // --------------- Collision Detection ---------------

  private _checkCollisions() {
    const { player, enemies, grid } = this._state;

    // Player vs Enemy
    let scoreGained = 0;
    for (let i = 0; i < enemies.length; i++) {
      const enemy = enemies[i];
      if (posEqual(player.pos, enemy.pos)) {
        if (player.powerUpTimer > 0) {
          // Kill enemy -> respawn at start
          enemies[i] = { ...enemy, pos: { row: 1, col: 1 }, pathCache: [], visitedCache: [] };
          scoreGained += 500;
        } else {
          this._loseLife();
          return;
        }
      }
    }
    
    if (scoreGained > 0) {
      this._state = { ...this._state, score: this._state.score + scoreGained, enemies: [...enemies] };
    }

    // Pickups
    const cell = grid[player.pos.row][player.pos.col];
    if (cell === CellType.CRYSTAL || cell === CellType.FREEZE_CLOCK || cell === CellType.BOMB_PICKUP) {
      const newGrid = grid.map(row => [...row]);
      newGrid[player.pos.row][player.pos.col] = CellType.FLOOR;

      let newPlayer = player;
      let newEnemies = this._state.enemies;

      if (cell === CellType.CRYSTAL) {
        newPlayer = activatePowerUp(player);
        newEnemies = this._state.enemies.map(setFleeMode);
      } else if (cell === CellType.FREEZE_CLOCK) {
        newPlayer = activateFreeze(player);
      } else if (cell === CellType.BOMB_PICKUP) {
        newPlayer = { ...player, wallBombs: Math.min(3, player.wallBombs + 1) };
      }

      this._state = { ...this._state, grid: newGrid, player: newPlayer, enemies: newEnemies };
    }

    // Player vs Exit
    if (posEqual(player.pos, this._exitPos)) {
      this._completeWave();
    }
  }

  // --------------- Wave / Life Management ---------------

  private _loseLife() {
    const lives = this._state.lives - 1;
    if (lives <= 0) {
      this._state = { ...this._state, lives: 0, phase: GamePhase.GAME_OVER };
    } else {
      // Respawn player at start, keep wave
      this._state = {
        ...this._state,
        lives,
        player: createPlayer({ row: 1, col: 1 }),
      };
    }
    this._pushState();
  }

  private _completeWave() {
    const timeRemaining = Math.max(0, getWaveTimeLimit(this._state.wave) - this._waveTimeMs);
    const bonus = calcWaveScore(this._state.wave, timeRemaining);
    const newScore = this._state.score + bonus;
    const nextWave = this._state.wave + 1;

    this._state = { ...this._state, score: newScore };
    this._initWave(nextWave);
  }

  private _updateWaveTimer(dt: number) {
    this._waveTimeMs += dt;
    const limit = getWaveTimeLimit(this._state.wave);
    if (limit > 0 && this._waveTimeMs >= limit) {
      // Time's up — lose a life
      this._loseLife();
    }
  }

  // --------------- Wave Initialization ---------------

  private _initWave(wave: number) {
    const s = this._currentSettings;
    const { grid, start, exit } = generateMaze({
      rows: s?.gridRows ?? 21,
      cols: s?.gridCols ?? 21,
    });

    this._exitPos = exit;
    this._waveTimeMs = 0;
    this._pathInvalidFlag = false;

    const player = createPlayer(start);
    const enemies = buildWave(wave, grid, start, s?.difficulty ?? 'normal');

    this._state = {
      phase: GamePhase.PLAYING,
      score: this._state?.score ?? 0,
      wave,
      lives: this._state?.lives ?? 3,
      timeElapsedMs: 0,
      debugMode: this._debugMode,
      fogEnabled: s?.fogEnabled ?? true,
      player,
      enemies,
      grid,
    };

    // Resize canvas for this grid
    const ts = s?.tileSize ?? 32;
    this._canvas.width = grid[0].length * ts;
    this._canvas.height = grid.length * ts;

    this._pushState();
  }

  private _pushState() {
    gameState.set({ ...this._state, debugMode: this._debugMode });
  }
}
