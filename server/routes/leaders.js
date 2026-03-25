import { Router } from 'express';
import { getOrFetch } from '../cache.js';

const router = Router();

const CATEGORIES = [
  'battingAverage',
  'homeRuns',
  'runsBattedIn',
  'stolenBases',
  'strikeouts',
  'earnedRunAverage',
  'wins',
  'saves',
  'strikeoutsPer9Inn',
];

const CATEGORY_LABELS = {
  battingAverage: 'AVG',
  homeRuns: 'HR',
  runsBattedIn: 'RBI',
  stolenBases: 'SB',
  strikeouts: 'K',
  earnedRunAverage: 'ERA',
  wins: 'W',
  saves: 'SV',
  strikeoutsPer9Inn: 'K/9',
};

router.get('/leaders', async (req, res) => {
  try {
    const { teamId } = req.query;
    if (!teamId) return res.status(400).json({ error: 'teamId required' });

    const cacheKey = `leaders-${teamId}`;
    const leaders = await getOrFetch(cacheKey, async () => {
      const season = new Date().getFullYear();
      let url = `https://statsapi.mlb.com/api/v1/teams/${teamId}/leaders?leaderCategories=${CATEGORIES.join(',')}&season=${season}&limit=5`;
      let resp = await fetch(url);
      let data = await resp.json();

      if (!data.teamLeaders?.length) {
        url = `https://statsapi.mlb.com/api/v1/teams/${teamId}/leaders?leaderCategories=${CATEGORIES.join(',')}&season=${season - 1}&limit=5`;
        resp = await fetch(url);
        data = await resp.json();
      }

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
