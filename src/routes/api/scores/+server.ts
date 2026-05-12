import { json } from '@sveltejs/kit';
import { insertScore } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const scoreId = insertScore({
      userId: Number(body?.userId),
      score: Number(body?.score ?? 0),
      wave: Number(body?.wave ?? 1),
      lives: Number(body?.lives ?? 0),
      biome: String(body?.biome ?? 'unknown'),
      difficulty: String(body?.difficulty ?? 'normal'),
      outcome: String(body?.outcome ?? 'game_over'),
    });

    return json({ scoreId });
  } catch {
    return json({ error: 'Could not save score.' }, { status: 400 });
  }
};
