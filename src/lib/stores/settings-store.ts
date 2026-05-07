// ============================================================
// Svelte Stores — settings-store.ts
// ============================================================

import { writable } from 'svelte/store';
import { DEFAULT_SETTINGS, type Settings } from '../core/types.js';

const STORAGE_KEY = 'mazehunter_settings';

/** Hàm loadSettings. */
function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      delete parsed.algoMode; // Clean up legacy setting
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT_SETTINGS };
}

/** Hàm createSettingsStore. */
function createSettingsStore() {
  const { subscribe, set, update } = writable<Settings>(loadSettings());

  return {
    subscribe,
    set: (value: Settings) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      } catch {
        // ignore localStorage errors
      }
      set(value);
    },
    update: (fn: (s: Settings) => Settings) => {
      update(current => {
        const next = fn(current);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    },
    reset: () => {
      localStorage.removeItem(STORAGE_KEY);
      set({ ...DEFAULT_SETTINGS });
    },
  };
}

/**
 * $settings — user preferences persisted to localStorage.
 * Includes tile size, FPS cap, and difficulty.
 */
export const settings = createSettingsStore();
