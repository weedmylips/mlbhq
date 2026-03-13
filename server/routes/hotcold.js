import { Router } from 'express';
import { getOrFetch } from '../cache.js';

const router = Router();

function abbrevName(fullName) {
  if (!fullName) return '';
  const parts = fullName.split(' ');
  if (parts.length < 2) return fullName;
  return `${parts[0][0]}. ${parts.slice(1).join(' ')}`;
}

function dateStr(d) {
  return d.toISOString().slice(0, 10);
}

router.get('/hotcold', async (req, res) => {
  try {
    const teamId = req.query.teamId || 147;
    const cacheKey = `hotcold-${teamId}`;
    const result = await getOrFetch(cacheKey, async () => {
      const today = new Date();
      const weekAgo = new Date(today - 7 * 24 * 60 * 60 * 1000);
      const startDate = dateStr(weekAgo);
      const endDate = dateStr(today);
      const season = today.getFullYear();

      const [hitResp, pitchResp] = await Promise.all([
        fetch(`https://statsapi.mlb.com/api/v1/stats?stats=byDateRange&group=hitting&season=${season}&startDate=${startDate}&endDate=${endDate}&teamId=${teamId}&playerPool=All&sportId=1`),
        fetch(`https://statsapi.mlb.com/api/v1/stats?stats=byDateRange&group=pitching&season=${season}&startDate=${startDate}&endDate=${endDate}&teamId=${teamId}&playerPool=All&sportId=1`),
      ]);

      const [hitData, pitchData] = await Promise.all([hitResp.json(), pitchResp.json()]);

      const batters = (hitData.stats?.[0]?.splits || [])
        .filter(s => (s.stat?.atBats || 0) >= 10)
        .map(s => ({
          name: abbrevName(s.player?.fullName),
          avg: s.stat?.avg || '.000',
          ops: parseFloat(s.stat?.ops || 0),
          hr: s.stat?.homeRuns || 0,
          rbi: s.stat?.rbi || 0,
          ab: s.stat?.atBats || 0,
        }))
        .sort((a, b) => b.ops - a.ops);

      const pitchers = (pitchData.stats?.[0]?.splits || [])
        .filter(s => {
          const gs = s.stat?.gamesStarted || 0;
          const gp = s.stat?.gamesPlayed || s.stat?.gamesPitched || 1;
          return gs >= 1 && gs / gp >= 0.4 && parseFloat(s.stat?.inningsPitched || 0) >= 1;
        })
        .map(s => ({
          name: abbrevName(s.player?.fullName),
          era: s.stat?.era || '-.--',
          eraNum: parseFloat(s.stat?.era || 99),
          wins: s.stat?.wins || 0,
          losses: s.stat?.losses || 0,
          k: s.stat?.strikeOuts || 0,
          ip: s.stat?.inningsPitched || '0.0',
        }))
        .sort((a, b) => a.eraNum - b.eraNum);

      const formatBatter = ({ name, avg, hr, rbi, ops }) => ({ name, avg, hr, rbi, ops: ops.toFixed(3).replace(/^0/, '') });
      const formatPitcher = ({ name, era, wins, losses, k, ip }) => ({ name, era, wins, losses, k, ip });

      return {
        hot: {
          batters: batters.slice(0, 3).map(formatBatter),
          pitchers: pitchers.slice(0, 2).map(formatPitcher),
        },
        cold: {
          batters: batters.slice(-3).reverse().map(formatBatter),
          pitchers: pitchers.slice(-2).reverse().map(formatPitcher),
        },
        period: `${startDate} – ${endDate}`,
      };
    }, 7200);
    res.json(result);
  } catch (err) {
    console.error('Hot/cold error:', err.message);
    res.status(500).json({ error: 'Failed to fetch hot/cold data' });
  }
});

export default router;
