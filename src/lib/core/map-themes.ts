// ============================================================
// map-themes.ts — Biome configuration for Maze Hunter
// ============================================================

import type { BiomeId } from './types.js';

/** Cấu hình màu sắc và gimmick cho một Biome. */
export interface BiomeConfig {
  id: Exclude<BiomeId, 'shuffle'>;
  /** Tên hiển thị trong UI */
  label: string;
  /** Màu chủ đạo (hex) — dùng cho tường, sáng, viền HUD */
  primaryColor: string;
  /** Màu nền ô FLOOR */
  floorColor: string;
  /** Màu tường */
  wallColor: string;
  /** Màu tường bên trong (inset) */
  wallInset: string;
  /** Màu highlight tường */
  wallHighlight: string;
  /** Màu ô gimmick */
  gimmickColor: string;
  /** Tỉ lệ ô gimmick trên tổng ô floor (0–1) */
  gimmickDensity: number;
  /** Tên gimmick */
  gimmickName: string;
  /** Mô tả ngắn gimmick cho HUD */
  gimmickDesc: string;
  /** Màu nhân vật player */
  playerColor: string;
  /** Màu glow nhân vật player */
  playerGlow: string;
}

export const MAP_THEMES: Record<Exclude<BiomeId, 'shuffle'>, BiomeConfig> = {
  data_jungle: {
    id: 'data_jungle',
    label: 'DATA JUNGLE',
    primaryColor:   '#4edea3',
    floorColor:     '#0a1f14',
    wallColor:      '#081a10',
    wallInset:      '#05120a',
    wallHighlight:  'rgba(78,222,163,0.07)',
    gimmickColor:   '#1a4d2e',
    gimmickDensity: 0.07,
    gimmickName:    'STEALTH NODE',
    gimmickDesc:    'Stand inside to blind enemy sensors by 70%',
    playerColor:    '#39ff14',
    playerGlow:     'rgba(57,255,20,0.5)',
  },

  cooling_sea: {
    id: 'cooling_sea',
    label: 'COOLING SEA',
    primaryColor:   '#00ffff',
    floorColor:     '#051828',
    wallColor:      '#030f1c',
    wallInset:      '#020b14',
    wallHighlight:  'rgba(0,255,255,0.07)',
    gimmickColor:   '#003d5c',
    gimmickDensity: 0.06,
    gimmickName:    'DATA STREAM',
    gimmickDesc:    'Move with the stream for 2× speed, against it for 0.5×',
    playerColor:    '#00e5ff',
    playerGlow:     'rgba(0,229,255,0.5)',
  },

  lava_core: {
    id: 'lava_core',
    label: 'LAVA CORE',
    primaryColor:   '#ff4500',
    floorColor:     '#1c0800',
    wallColor:      '#150500',
    wallInset:      '#0f0400',
    wallHighlight:  'rgba(255,69,0,0.07)',
    gimmickColor:   '#4a0e00',
    gimmickDensity: 0.05,
    gimmickName:    'VOLATILE SECTOR',
    gimmickDesc:    'Pulsing tiles explode every 5 s — vacate immediately',
    playerColor:    '#ff9100',
    playerGlow:     'rgba(255,145,0,0.5)',
  },
};

/** Giải ngẫu nhiên nếu shuffle, trả về config biome cụ thể. */
export function resolveTheme(biomeId: BiomeId): BiomeConfig {
  if (biomeId === 'shuffle') {
    const keys = Object.keys(MAP_THEMES) as Exclude<BiomeId, 'shuffle'>[];
    return MAP_THEMES[keys[Math.floor(Math.random() * keys.length)]];
  }
  return MAP_THEMES[biomeId];
}
