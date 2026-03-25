import { Router } from 'express';
import { getOrFetch } from '../cache.js';

const router = Router();

router.get('/scoreboard', async (req, res) => {
  try {
    const dateParam = req.query.date;
    const today = dateParam || new Date().toISOString().split('T')[0];
    const cacheKey = `scoreboard-${today}`;
    const result = await getOrFetch(cacheKey, async () => {
      const url = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${today}&hydrate=linescore,decisions,probablePitcher,team`;
      const resp = await fetch(url);
      const data = await resp.json();

      const games = (data.dates || []).flatMap((d) => d.games || []);

      return games.map((g) => {
        const status = g.status || {};
        const ls = g.linescore || {};
        return {
          gamePk: g.gamePk,
          gameDate: g.gameDate,
          state: status.abstractGameState,
          detailedState: status.detailedState,
          inning: ls.currentInning || null,
          inningHalf: ls.inningHalf || null,
          away: {
            id: g.teams?.away?.team?.id,
            name: g.teams?.away?.team?.name,
            abbr: g.teams?.away?.team?.abbreviation,
            wins: g.teams?.away?.leagueRecord?.wins,
            losses: g.teams?.away?.leagueRecord?.losses,
            score: ls.teams?.away?.runs ?? (status.abstractGameState === 'Final' ? g.teams?.away?.score : null),
            probablePitcher: g.teams?.away?.probablePitcher
              ? { id: g.teams.away.probablePitcher.id, name: g.teams.away.probablePitcher.fullName }
              : null,
          },
          home: {
            id: g.teams?.home?.team?.id,
            name: g.teams?.home?.team?.name,
            abbr: g.teams?.home?.team?.abbreviation,
            wins: g.teams?.home?.leagueRecord?.wins,
            losses: g.teams?.home?.leagueRecord?.losses,
            score: ls.teams?.home?.runs ?? (status.abstractGameState === 'Final' ? g.teams?.home?.score : null),
            probablePitcher: g.teams?.home?.probablePitcher
              ? { id: g.teams.home.probablePitcher.id, name: g.teams.home.probablePitcher.fullName }
              : null,
          },
          decisions: g.decisions
            ? {
                winner: g.decisions.winner ? { id: g.decisions.winner.id, name: g.decisions.winner.fullName } : null,
                loser: g.decisions.loser ? { id: g.decisions.loser.id, name: g.decisions.loser.fullName } : null,
                save: g.decisions.save ? { id: g.decisions.save.id, name: g.decisions.save.fullName } : null,
              }
            : null,
          innings: (ls.innings || []).map((inn) => ({
            num: inn.num,
            away: inn.away?.runs ?? null,
            home: inn.home?.runs ?? null,
          })),
        };
      });
    }, (result) => result.some((g) => g.state === 'Live') ? 30 : 120);
    res.json(result);
  } catch (err) {
    console.error('Scoreboard error:', err.message);
    res.status(500).json({ error: 'Failed to fetch scoreboard' });
  }
});

export default router;
