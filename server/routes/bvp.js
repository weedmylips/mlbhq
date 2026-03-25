import { Router } from 'express';
import { getOrFetch } from '../cache.js';

const router = Router();

router.get('/bvp', async (req, res) => {
  try {
    const { batterId, pitcherId } = req.query;
    if (!batterId || !pitcherId) {
      return res.status(400).json({ error: 'batterId and pitcherId required' });
    }

    const cacheKey = `bvp-${batterId}-${pitcherId}`;
    const result = await getOrFetch(cacheKey, async () => {
      const url = `https://statsapi.mlb.com/api/v1/people/${batterId}/stats?stats=vsPlayer&opposingPlayerId=${pitcherId}&group=hitting`;
      const resp = await fetch(url);
      const data = await resp.json();

      const splits = data.stats?.[0]?.splits || [];
      const career = splits[0]?.stat || null;

      if (!career) return { atBats: 0 };

      return {
        atBats: career.atBats ?? 0,
        hits: career.hits ?? 0,
        avg: career.avg ?? '-',
        hr: career.homeRuns ?? 0,
        rbi: career.rbi ?? 0,
        bb: career.baseOnBalls ?? 0,
        k: career.strikeOuts ?? 0,
      };
    }, 3600);

    res.json(result);
  } catch (err) {
    console.error('BvP error:', err.message);
    res.status(500).json({ error: 'Failed to fetch batter vs pitcher' });
  }
});

export default router;
