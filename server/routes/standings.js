import { Router } from 'express';
import { getOrFetch } from '../cache.js';

const router = Router();

function mapTeamRecord(tr, isWildCard) {
  const base = {
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
  };
  if (isWildCard) {
    base.wcRank = tr.wildCardRank ? parseInt(tr.wildCardRank, 10) : null;
    base.wcGb = tr.wildCardGamesBack ?? '-';
    base.elimNum = tr.eliminationNumber ?? '-';
    base.divisionLeader = tr.divisionLeader ?? false;
    base.divisionName = tr.team?.division?.name || '';
  }
  return base;
}

router.get('/standings', async (req, res) => {
  try {
    const leagueId = req.query.leagueId || 103;
    const type = req.query.type === 'wildCard' ? 'wildCard' : 'regularSeason';
    const cacheKey = `standings-${leagueId}-${type}`;
    const divisions = await getOrFetch(cacheKey, async () => {
      const url = `https://statsapi.mlb.com/api/v1/standings?leagueId=${leagueId}&season=2025&standingsTypes=${type}&hydrate=team(division)`;
      const resp = await fetch(url);
      const data = await resp.json();
      const isWC = type === 'wildCard';
      return (data.records || []).map((record) => ({
        division: record.division?.name || '',
        divisionId: record.division?.id,
        teams: (record.teamRecords || []).map((tr) => mapTeamRecord(tr, isWC)),
      }));
    }, 900);
    res.json(divisions);
  } catch (err) {
    console.error('Standings error:', err.message);
    res.status(500).json({ error: 'Failed to fetch standings' });
  }
});

export default router;
