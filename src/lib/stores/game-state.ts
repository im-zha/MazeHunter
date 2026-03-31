// ============================================================
// Svelte Stores — game-state.ts
// ============================================================

import { writable } from 'svelte/store';
import { GamePhase, type GameState } from '../core/types.js';
import { DEFAULT_SETTINGS } from '../core/types.js';

function createInitialGameState(): GameState {
  return {
    phase: GamePhase.MENU,
    score: 0,
    wave: 1,
    lives: 3,
    timeElapsedMs: 0,
    debugMode: false,
    player: {
      pos: { row: 1, col: 1 },
      fogRadius: 4,
      powerUpTimer: 0,
      wallBombs: 3,
      isSliding: false,
      slideDir: null,
    },
    enemies: [],
    grid: [],
  };
}

/**
 * $gameState — the primary reactive store.
 * Written by game-loop, read by HUD and overlay screens.
 * UI components NEVER write to this store directly.
 */
export const gameState = writable<GameState>(createInitialGameState());

/** Reset game state to initial values. */
export function resetGameState() {
  gameState.set(createInitialGameState());
}
