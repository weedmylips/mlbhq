import { Router } from 'express';
import { getOrFetch } from '../cache.js';

const router = Router();

const SITUATIONS = [
  { code: 'risp', label: 'RISP' },
  { code: 'bases_loaded', label: 'Bases Loaded' },
  { code: 'men_on', label: 'Men On' },
  { code: 'bases_empty', label: 'Bases Empty' },
];

router.get('/situational', async (req, res) => {
  try {
    const teamId = req.query.teamId || 147;
    const cacheKey = `situational-${teamId}`;
    const result = await getOrFetch(cacheKey, async () => {
      const season = new Date().getFullYear();
      const codes = SITUATIONS.map((s) => s.code).join(',');
      const url = `https://statsapi.mlb.com/api/v1/teams/${teamId}/stats?stats=season&group=hitting&season=${season}&situationCodes=${codes}`;
      const resp = await fetch(url);
      const data = await resp.json();

      const statEntries = data.stats || [];

      // The API returns one stats entry per situation code
      // Each entry has splits[0].stat with the situational stats
      const situations = SITUATIONS.map((sit) => {
        // Find the matching stat entry
        const entry = statEntries.find((e) =>
          e.type?.displayName === 'statSplits' || true
        );
        // Actually, MLB API returns all situations in one stats entry's splits
        // Let's handle both cases
        return null;
      });

      // Alternative approach: fetch each situation individually
      const fetches = SITUATIONS.map(async (sit) => {
        const sitUrl = `https://statsapi.mlb.com/api/v1/teams/${teamId}/stats?stats=season&group=hitting&season=${season}&situationCodes=${sit.code}`;
        const sitResp = await fetch(sitUrl);
        const sitData = await sitResp.json();
        const stat = sitData.stats?.[0]?.splits?.[0]?.stat || null;
        return {
          code: sit.code,
          label: sit.label,
          stat: stat
            ? {
                avg: stat.avg ?? '-',
                obp: stat.obp ?? '-',
                slg: stat.slg ?? '-',
                ops: stat.ops ?? '-',
                hr: stat.homeRuns ?? 0,
                rbi: stat.rbi ?? 0,
                hits: stat.hits ?? 0,
                ab: stat.atBats ?? 0,
                bb: stat.baseOnBalls ?? 0,
                k: stat.strikeOuts ?? 0,
              }
            : null,
        };
      });

      return Promise.all(fetches);
    }, 1800);
    res.json(result);
  } catch (err) {
    console.error('Situational error:', err.message);
    res.status(500).json({ error: 'Failed to fetch situational stats' });
  }
});

export default router;
