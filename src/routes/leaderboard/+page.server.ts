import { getLeaderboard } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
  return {
    rows: getLeaderboard(50),
  };
};
