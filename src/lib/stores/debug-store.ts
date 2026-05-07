// ============================================================
// Svelte Stores — debug-store.ts
// ============================================================

import { writable } from 'svelte/store';

/**
 * $debugMode — toggles the algorithm visualization overlay.
 * Toggled by F1 key. Read by renderer and AlgorithmPanel.
 */
export const debugMode = writable<boolean>(false);

/** Hàm toggleDebug. */
export function toggleDebug() {
  debugMode.update(v => !v);
}
