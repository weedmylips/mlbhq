import { Router } from 'express';
import { getCached, setCached } from '../cache.js';

const router = Router();

router.get('/stats', async (req, res) => {
  try {
    const teamId = req.query.teamId || 147;
    const cacheKey = `stats-${teamId}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    const [hittingResp, pitchingResp] = await Promise.all([
      fetch(`https://statsapi.mlb.com/api/v1/teams/${teamId}/stats?stats=season&group=hitting&season=2025`),
      fetch(`https://statsapi.mlb.com/api/v1/teams/${teamId}/stats?stats=season&group=pitching&season=2025`),
    ]);

    const hittingData = await hittingResp.json();
    const pitchingData = await pitchingResp.json();

    const hittingStat = hittingData.stats?.[0]?.splits?.[0]?.stat || {};
    const pitchingStat = pitchingData.stats?.[0]?.splits?.[0]?.stat || {};

    const result = {
      hitting: {
        avg: hittingStat.avg || '.000',
        ops: hittingStat.ops || '.000',
        hr: hittingStat.homeRuns || 0,
        runs: hittingStat.runs || 0,
        sb: hittingStat.stolenBases || 0,
        hits: hittingStat.hits || 0,
        rbi: hittingStat.rbi || 0,
        obp: hittingStat.obp || '.000',
        slg: hittingStat.slg || '.000',
      },
      pitching: {
        era: pitchingStat.era || '0.00',
        whip: pitchingStat.whip || '0.00',
        k: pitchingStat.strikeOuts || 0,
        saves: pitchingStat.saves || 0,
        wins: pitchingStat.wins || 0,
        losses: pitchingStat.losses || 0,
        ip: pitchingStat.inningsPitched || '0.0',
        avg: pitchingStat.avg || '.000',
      },
    };

    setCached(cacheKey, result, 300);
    res.json(result);
  } catch (err) {
    console.error('Stats error:', err.message);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
