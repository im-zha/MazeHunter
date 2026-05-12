import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

const dbPath = join(process.cwd(), 'data', 'mazehunter.sqlite');
mkdirSync(dirname(dbPath), { recursive: true });

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE COLLATE NOCASE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    wave INTEGER NOT NULL,
    lives INTEGER NOT NULL,
    biome TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    outcome TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_scores_rank
    ON scores(score DESC, wave DESC, created_at ASC);
`);

export interface LeaderboardRow {
  id: number;
  name: string;
  score: number;
  wave: number;
  lives: number;
  biome: string;
  difficulty: string;
  outcome: string;
  created_at: string;
}

export function sanitizePlayerName(name: unknown): string {
  return String(name ?? '').trim().replace(/\s+/g, ' ').slice(0, 24);
}

export function upsertUser(name: string) {
  const cleanName = sanitizePlayerName(name);
  if (cleanName.length < 2) {
    throw new Error('Player name must be at least 2 characters.');
  }

  db.prepare(`
    INSERT INTO users (name) VALUES (@name)
    ON CONFLICT(name) DO UPDATE SET last_seen_at = CURRENT_TIMESTAMP
  `).run({ name: cleanName });

  return db.prepare('SELECT id, name FROM users WHERE name = ?').get(cleanName) as { id: number; name: string };
}

export function insertScore(input: {
  userId: number;
  score: number;
  wave: number;
  lives: number;
  biome: string;
  difficulty: string;
  outcome: string;
}) {
  const info = db.prepare(`
    INSERT INTO scores (user_id, score, wave, lives, biome, difficulty, outcome)
    VALUES (@userId, @score, @wave, @lives, @biome, @difficulty, @outcome)
  `).run({
    userId: input.userId,
    score: Math.max(0, Math.floor(input.score)),
    wave: Math.max(1, Math.floor(input.wave)),
    lives: Math.max(0, Math.floor(input.lives)),
    biome: input.biome,
    difficulty: input.difficulty,
    outcome: input.outcome,
  });

  return Number(info.lastInsertRowid);
}

export function getLeaderboard(limit = 20): LeaderboardRow[] {
  return db.prepare(`
    SELECT
      scores.id,
      users.name,
      scores.score,
      scores.wave,
      scores.lives,
      scores.biome,
      scores.difficulty,
      scores.outcome,
      scores.created_at
    FROM scores
    JOIN users ON users.id = scores.user_id
    ORDER BY scores.score DESC, scores.wave DESC, scores.created_at ASC
    LIMIT ?
  `).all(Math.max(1, Math.min(100, limit))) as LeaderboardRow[];
}
