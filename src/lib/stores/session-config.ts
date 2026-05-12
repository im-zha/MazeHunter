// ============================================================
// biome-store.ts — lưu lựa chọn Biome của người chơi
// ============================================================

import { writable } from 'svelte/store';
import type { BiomeId } from '../core/types.js';
import type { Difficulty } from '../core/types.js';

export interface SessionConfig {
  difficulty: Difficulty;
  biome: BiomeId;
}

export const sessionConfig = writable<SessionConfig>({
  difficulty: 'normal',
  biome: 'data_jungle',
});
