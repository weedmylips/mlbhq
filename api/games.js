import { createCache } from './_cache.js';

const { getOrFetch } = createCache(60, 30);

function formatDate(d) {
  return d.toISOString().split('T')[0];
}

export default async function handler(req, res) {
  try {
    const teamId = req.query.teamId || 147;
    const cacheKey = `games-${teamId}`;
    const result = await getOrFetch(cacheKey, async () => {
      const today = new Date();
      const start = new Date(today);
      start.setDate(start.getDate() - 7);
      const end = new Date(today);
      end.setDate(end.getDate() + 14);

      const season = new Date().getFullYear();
      const url = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&teamId=${teamId}&season=${season}&startDate=${formatDate(start)}&endDate=${formatDate(end)}&hydrate=linescore,decisions,probablePitcher`;
      const resp = await fetch(url);
      const data = await resp.json();

      const allGames = (data.dates || []).flatMap((d) => d.games || []);

      const live = allGames.find(
        (g) =>
          g.status?.abstractGameState === 'Live' ||
          g.status?.detailedState === 'In Progress' ||
          (g.status?.detailedState || '').includes('Delayed')
      ) || null;

      const now = new Date();
      const upcoming = allGames
        .filter((g) => g.status?.abstractGameState === 'Preview' && new Date(g.gameDate) > now)
        .sort((a, b) => new Date(a.gameDate) - new Date(b.gameDate));
      const next = upcoming[0] || null;

      const recent = allGames
        .filter((g) => g.status?.abstractGameState === 'Final')
        .sort((a, b) => new Date(b.gameDate) - new Date(a.gameDate))
        .slice(0, 10);

      return { live, next, recent, allGames };
    }, (result) => result.live ? 60 : 300);
    res.json(result);
  } catch (err) {
    console.error('Games error:', err.message);
    res.status(500).json({ error: 'Failed to fetch games' });
  }
}
