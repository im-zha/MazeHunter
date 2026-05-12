import { json } from '@sveltejs/kit';
import { sanitizePlayerName, upsertUser } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const name = sanitizePlayerName(body?.name);
    const user = upsertUser(name);
    return json({ user });
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : 'Could not create player.' },
      { status: 400 }
    );
  }
};
