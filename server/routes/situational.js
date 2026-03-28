import { Router } from 'express';
import { getOrFetch } from '../cache.js';

const router = Router();

const SITUATIONS = [
  { code: 'risp', label: 'RISP' },
  { code: 'r123', label: 'Bases Loaded' },
  { code: 'ron', label: 'Men On' },
  { code: 'r0', label: 'Bases Empty' },
  { code: 'vl', label: 'vs LHP' },
  { code: 'vr', label: 'vs RHP' },
];

function extractStat(data) {
  const stat = data.stats?.[0]?.splits?.[0]?.stat || null;
  if (!stat) return null;
  return {
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
  };
}

router.get('/situational', async (req, res) => {
  try {
    const teamId = req.query.teamId || 147;
    const cacheKey = `situational-${teamId}`;
    const result = await getOrFetch(cacheKey, async () => {
      const season = new Date().getFullYear();

      // Fetch each situation individually with the correct MLB API sitCodes
      const fetches = SITUATIONS.map(async (sit) => {
        const sitUrl = `https://statsapi.mlb.com/api/v1/teams/${teamId}/stats?stats=statSplits&group=hitting&season=${season}&sitCodes=${sit.code}`;
        const sitResp = await fetch(sitUrl);
        const sitData = await sitResp.json();
        return {
          code: sit.code,
          label: sit.label,
          stat: extractStat(sitData),
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
