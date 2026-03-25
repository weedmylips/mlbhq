import { createCache } from './_cache.js';

const { getOrFetch } = createCache(3600, 60);

async function fetchPitcherStats(pitcherId) {
  const url = `https://statsapi.mlb.com/api/v1/people/${pitcherId}?hydrate=stats(group=[pitching],type=[season,gameLog])`;
  const resp = await fetch(url);
  const data = await resp.json();
  const person = data.people?.[0];
  if (!person) return null;

  const stats = person.stats || [];
  const seasonSplit = stats.find(
    (s) => s.group?.displayName === 'pitching' && s.type?.displayName === 'season'
  );
  const gameLogSplit = stats.find(
    (s) => s.group?.displayName === 'pitching' && s.type?.displayName === 'gameLog'
  );

  const season = seasonSplit?.splits?.[0]?.stat || null;
  const lastStarts = (gameLogSplit?.splits || []).slice(-3).reverse().map((g) => ({
    date: g.date,
    opponent: g.opponent?.name,
    result: g.isWin ? 'W' : g.isLoss ? 'L' : '-',
    ip: g.stat?.inningsPitched,
    hits: g.stat?.hits,
    er: g.stat?.earnedRuns,
    k: g.stat?.strikeOuts,
    bb: g.stat?.baseOnBalls,
    era: g.stat?.era,
  }));

  return {
    id: person.id,
    name: person.fullName,
    number: person.primaryNumber,
    pitchHand: person.pitchHand?.code,
    season: season
      ? {
          wins: season.wins,
          losses: season.losses,
          era: season.era,
          whip: season.whip,
          k: season.strikeOuts,
          ip: season.inningsPitched,
          k9: season.strikeoutsPer9Inn,
          bb9: season.walksPer9Inn,
          avg: season.avg,
        }
      : null,
    lastStarts,
  };
}

export default async function handler(req, res) {
  try {
    const { pitcher1, pitcher2 } = req.query;
    if (!pitcher1 && !pitcher2) {
      return res.status(400).json({ error: 'At least one pitcher ID required' });
    }

    const cacheKey = `matchup-${pitcher1 || 0}-${pitcher2 || 0}`;
    const result = await getOrFetch(cacheKey, async () => {
      const [p1, p2] = await Promise.all([
        pitcher1 ? fetchPitcherStats(pitcher1) : null,
        pitcher2 ? fetchPitcherStats(pitcher2) : null,
      ]);
      return { home: p1, away: p2 };
    }, 3600);

    res.json(result);
  } catch (err) {
    console.error('Matchup error:', err.message);
    res.status(500).json({ error: 'Failed to fetch matchup' });
  }
}
