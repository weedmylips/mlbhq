import { Router } from 'express';
import { getCached, setCached } from '../cache.js';

const router = Router();

function formatDate(d) {
  return d.toISOString().split('T')[0];
}

router.get('/games', async (req, res) => {
  try {
    const teamId = req.query.teamId || 147;
    const cacheKey = `games-${teamId}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - 7);
    const end = new Date(today);
    end.setDate(end.getDate() + 14);

    const url = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&teamId=${teamId}&season=2025&startDate=${formatDate(start)}&endDate=${formatDate(end)}&hydrate=linescore,decisions,probablePitcher`;
    const resp = await fetch(url);
    const data = await resp.json();

    const allGames = (data.dates || []).flatMap((d) => d.games || []);

    const live = allGames.find(
      (g) =>
        g.status?.abstractGameState === 'Live' ||
        g.status?.detailedState === 'In Progress'
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

    const result = { live, next, recent, allGames };
    const ttl = live ? 60 : 300;
    setCached(cacheKey, result, ttl);
    res.json(result);
  } catch (err) {
    console.error('Games error:', err.message);
    res.status(500).json({ error: 'Failed to fetch games' });
  }
});

router.get('/live', async (req, res) => {
  try {
    const gamePk = req.query.gamePk;
    if (!gamePk) return res.status(400).json({ error: 'gamePk required' });

    const cacheKey = `live-${gamePk}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    const url = `https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live`;
    const resp = await fetch(url);
    const data = await resp.json();

    const linescore = data.liveData?.linescore || {};
    const plays = data.liveData?.plays || {};
    const boxscore = data.liveData?.boxscore || {};

    const result = {
      gameData: data.gameData || {},
      inning: linescore.currentInning,
      inningHalf: linescore.inningHalf,
      balls: linescore.balls,
      strikes: linescore.strikes,
      outs: linescore.outs,
      away: {
        team: data.gameData?.teams?.away || {},
        runs: linescore.teams?.away?.runs || 0,
        hits: linescore.teams?.away?.hits || 0,
        errors: linescore.teams?.away?.errors || 0,
      },
      home: {
        team: data.gameData?.teams?.home || {},
        runs: linescore.teams?.home?.runs || 0,
        hits: linescore.teams?.home?.hits || 0,
        errors: linescore.teams?.home?.errors || 0,
      },
      runners: {
        first: !!linescore.offense?.first,
        second: !!linescore.offense?.second,
        third: !!linescore.offense?.third,
      },
      currentBatter: linescore.offense?.batter || null,
      currentPitcher: linescore.defense?.pitcher || null,
      lastPlay: plays.currentPlay?.result?.description || '',
      probablePitchers: data.gameData?.probablePitchers || {},
    };

    setCached(cacheKey, result, 15);
    res.json(result);
  } catch (err) {
    console.error('Live error:', err.message);
    res.status(500).json({ error: 'Failed to fetch live game' });
  }
});

router.get('/boxscore', async (req, res) => {
  try {
    const { gamePk } = req.query;
    if (!gamePk) return res.status(400).json({ error: 'gamePk required' });

    const cacheKey = `boxscore-${gamePk}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    const url = `https://statsapi.mlb.com/api/v1/game/${gamePk}/boxscore`;
    const resp = await fetch(url);
    const data = await resp.json();

    const teams = data.teams || {};

    function teamSummary(side) {
      const t = teams[side] || {};
      const info = t.team || {};
      const ls = t.teamStats?.batting || {};
      return {
        team: { id: info.id, name: info.name, abbreviation: info.abbreviation },
        runs: ls.runs ?? 0,
        hits: ls.hits ?? 0,
        errors: t.teamStats?.fielding?.errors ?? 0,
      };
    }

    const decisions = data.decisions || {};
    const decisionMap = {
      ...(decisions.winner ? { [decisions.winner.id]: 'W' } : {}),
      ...(decisions.loser ? { [decisions.loser.id]: 'L' } : {}),
      ...(decisions.save ? { [decisions.save.id]: 'SV' } : {}),
    };

    const result = {
      teams: {
        away: teamSummary('away'),
        home: teamSummary('home'),
      },
      pitchers: (() => {
        const list = [];
        for (const side of ['away', 'home']) {
          const t = teams[side] || {};
          const abbr = t.team?.abbreviation || '';
          const players = t.players || {};
          for (const id of (t.pitchers || [])) {
            const p = players[`ID${id}`];
            if (!p) continue;
            const s = p.stats?.pitching || {};
            list.push({
              name: p.person?.fullName || '',
              teamAbbr: abbr,
              decision: decisionMap[id] || null,
              stats: {
                ip: s.inningsPitched ?? '0.0',
                h: s.hits ?? 0,
                er: s.earnedRuns ?? 0,
                bb: s.baseOnBalls ?? 0,
                so: s.strikeOuts ?? 0,
              },
            });
          }
        }
        return list;
      })(),
      topHitters: (() => {
        const hitters = [];
        for (const side of ['away', 'home']) {
          const t = teams[side] || {};
          const abbr = t.team?.abbreviation || '';
          const players = t.players || {};
          for (const p of Object.values(players)) {
            const s = p.stats?.batting || {};
            if ((s.atBats ?? 0) === 0) continue;
            hitters.push({
              name: p.person?.fullName || '',
              teamAbbr: abbr,
              ab: s.atBats ?? 0,
              h: s.hits ?? 0,
              rbi: s.rbi ?? 0,
              hr: s.homeRuns ?? 0,
              bb: s.baseOnBalls ?? 0,
            });
          }
        }
        return hitters
          .sort((a, b) => b.rbi - a.rbi || b.h - a.h)
          .slice(0, 5);
      })(),
    };

    setCached(cacheKey, result, 300);
    res.json(result);
  } catch (err) {
    console.error('Boxscore error:', err.message);
    res.status(500).json({ error: 'Failed to fetch boxscore' });
  }
});

export default router;
