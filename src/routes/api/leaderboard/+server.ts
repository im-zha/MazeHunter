import { json } from '@sveltejs/kit';
import { getLeaderboard } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ url }) => {
  const limit = Number(url.searchParams.get('limit') ?? 20);
  return json({ rows: getLeaderboard(limit) });
};
