import { Router } from 'express';
import { getOrFetch } from '../cache.js';

const router = Router();

const CATEGORIES = [
  'battingAverage',
  'homeRuns',
  'runsBattedIn',
  'stolenBases',
  'earnedRunAverage',
  'wins',
  'saves',
  'strikeouts',
];

const CATEGORY_LABELS = {
  battingAverage: 'AVG',
  homeRuns: 'HR',
  runsBattedIn: 'RBI',
  stolenBases: 'SB',
  earnedRunAverage: 'ERA',
  wins: 'W',
  saves: 'SV',
  strikeouts: 'K',
};

router.get('/leaders', async (req, res) => {
  try {
    const { teamId } = req.query;
    if (!teamId) return res.status(400).json({ error: 'teamId required' });

    const cacheKey = `leaders-${teamId}`;
    const leaders = await getOrFetch(cacheKey, async () => {
      const season = new Date().getFullYear();
      const url = `https://statsapi.mlb.com/api/v1/teams/${teamId}/leaders?leaderCategories=${CATEGORIES.join(',')}&season=${season}&limit=5`;
      const resp = await fetch(url);
      const data = await resp.json();

      const seen = new Set();
      return (data.teamLeaders || [])
        .filter((cat) => {
          if (seen.has(cat.leaderCategory)) return false;
          seen.add(cat.leaderCategory);
          return true;
        })
        .map((cat) => ({
          category: cat.leaderCategory,
          label: CATEGORY_LABELS[cat.leaderCategory] || cat.leaderCategory,
          leaders: (cat.leaders || []).map((l) => ({
            rank: l.rank,
            name: l.person?.fullName,
            playerId: l.person?.id,
            value: l.value,
          })),
        }));
    }, 3600);

    res.json(leaders);
  } catch (err) {
    console.error('Leaders error:', err.message);
    res.status(500).json({ error: 'Failed to fetch leaders' });
  }
});

export default router;
