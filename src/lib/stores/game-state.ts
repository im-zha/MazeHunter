// ============================================================
// Svelte Stores — game-state.ts
// ============================================================

import { writable } from 'svelte/store';
import { GamePhase, type GameState } from '../core/types.js';
import { DEFAULT_SETTINGS } from '../core/types.js';

/** Hàm createInitialGameState. */
function createInitialGameState(): GameState {
  return {
    phase: GamePhase.MENU,
    score: 0,
    round: 1,
    wave: 1,
    lives: 3,
    timeElapsedMs: 0,
    player: {
      pos: { row: 1, col: 1 },
      fogRadius: 4,
      powerUpTimer: 0,
      wallBombs: 3,
      isSliding: false,
      slideDir: null,
      freezeTimer: 0,
      sensorJamTimer: 0,
      mudBlocked: false,
      isOnLadder: false,
    },
    enemies: [],
    grid: [],
    ladders: [],
    timedEvents: [],
    lastEventLabel: '',
    eventLabelTimer: 0,
    sessionLogs: [],
    fogEnabled: DEFAULT_SETTINGS.fogEnabled,
    debugMode: false,
    bridgeOccupancy: {},

    // Biome defaults
    selectedBiome: 'data_jungle',
    currentBiome:  'data_jungle',
    volatileTimer: 0,
    volatileHot:   new Set<string>(),
    playerInStealth: false,
    aoeEvents: [],
    nextAoeMs: 10_000,
    slagTimer: 0,
    slagHot: new Set<string>(),
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
