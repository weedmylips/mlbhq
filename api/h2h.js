import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

export default async function handler(req, res) {
  try {
    const { teamId, opponentId } = req.query;
    if (!teamId || !opponentId) return res.status(400).json({ error: 'teamId and opponentId required' });

    const cacheKey = `h2h-${teamId}-${opponentId}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const url = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&teamId=${teamId}&opponentId=${opponentId}&season=2025&gameType=R`;
    const resp = await fetch(url);
    const data = await resp.json();

    const games = (data.dates || []).flatMap((d) => d.games || []);
    const finalGames = games.filter((g) => g.status?.abstractGameState === 'Final');

    let wins = 0;
    let losses = 0;
    for (const g of finalGames) {
      const teamSide = g.teams?.home?.team?.id === Number(teamId) ? 'home' : 'away';
      if (g.teams?.[teamSide]?.isWinner) wins++;
      else losses++;
    }

    const result = { wins, losses, gamesPlayed: finalGames.length };
    cache.set(cacheKey, result, 300);
    res.json(result);
  } catch (err) {
    console.error('H2H error:', err.message);
    res.status(500).json({ error: 'Failed to fetch H2H data' });
  }
}
