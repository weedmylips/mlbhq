import { createCache } from './_cache.js';

const { getOrFetch } = createCache(900, 60);

export default async function handler(req, res) {
  try {
    const leagueId = req.query.leagueId || 103;
    const cacheKey = `standings-${leagueId}`;
    const divisions = await getOrFetch(cacheKey, async () => {
      const url = `https://statsapi.mlb.com/api/v1/standings?leagueId=${leagueId}&season=2025&standingsTypes=regularSeason`;
      const resp = await fetch(url);
      const data = await resp.json();

      return (data.records || []).map((record) => ({
        division: record.division?.name || '',
        divisionId: record.division?.id,
        teams: (record.teamRecords || []).map((tr) => ({
          teamId: tr.team?.id,
          teamName: tr.team?.name,
          wins: tr.wins,
          losses: tr.losses,
          pct: tr.winningPercentage,
          gb: tr.gamesBack,
          streak: tr.streak?.streakCode || '-',
          lastTen: tr.records?.splitRecords?.find((r) => r.type === 'lastTen')
            ? `${tr.records.splitRecords.find((r) => r.type === 'lastTen').wins}-${tr.records.splitRecords.find((r) => r.type === 'lastTen').losses}`
            : '-',
          runsScored: tr.runsScored,
          runsAllowed: tr.runsAllowed,
          runDiff: tr.runDifferential,
        })),
      }));
    }, 900);
    res.json(divisions);
  } catch (err) {
    console.error('Standings error:', err.message);
    res.status(500).json({ error: 'Failed to fetch standings' });
  }
}
