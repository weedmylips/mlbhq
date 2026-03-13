import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

export default async function handler(req, res) {
  try {
    const { gamePk } = req.query;
    if (!gamePk) return res.status(400).json({ error: 'gamePk required' });

    const cacheKey = `boxscore-${gamePk}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const [bsResp, lsResp] = await Promise.all([
      fetch(`https://statsapi.mlb.com/api/v1/game/${gamePk}/boxscore`),
      fetch(`https://statsapi.mlb.com/api/v1/game/${gamePk}/linescore`),
    ]);
    const [data, linescore] = await Promise.all([bsResp.json(), lsResp.json()]);

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
      innings: (linescore.innings || []).map((inn) => ({
        num: inn.num,
        away: inn.away?.runs ?? null,
        home: inn.home?.runs ?? null,
      })),
      teams: {
        away: teamSummary('away'),
        home: teamSummary('home'),
      },
      pitchers: Object.fromEntries(['away', 'home'].map((side) => {
        const t = teams[side] || {};
        const players = t.players || {};
        const list = (t.pitchers || []).flatMap((id) => {
          const p = players[`ID${id}`];
          if (!p) return [];
          const s = p.stats?.pitching || {};
          return [{
            name: p.person?.fullName || '',
            decision: decisionMap[id] || null,
            stats: {
              ip: s.inningsPitched ?? '0.0',
              h: s.hits ?? 0,
              er: s.earnedRuns ?? 0,
              bb: s.baseOnBalls ?? 0,
              so: s.strikeOuts ?? 0,
            },
          }];
        });
        return [side, { abbr: t.team?.abbreviation || '', pitchers: list }];
      })),
      topHitters: Object.fromEntries(['away', 'home'].map((side) => {
        const t = teams[side] || {};
        const players = t.players || {};
        const hitters = Object.values(players).flatMap((p) => {
          const s = p.stats?.batting || {};
          if ((s.atBats ?? 0) === 0) return [];
          return [{
            name: p.person?.fullName || '',
            ab: s.atBats ?? 0,
            h: s.hits ?? 0,
            rbi: s.rbi ?? 0,
            hr: s.homeRuns ?? 0,
            bb: s.baseOnBalls ?? 0,
          }];
        });
        return [side, {
          abbr: t.team?.abbreviation || '',
          hitters: hitters.sort((a, b) => b.rbi - a.rbi || b.h - a.h).slice(0, 5),
        }];
      })),
    };

    cache.set(cacheKey, result);
    res.json(result);
  } catch (err) {
    console.error('Boxscore error:', err.message);
    res.status(500).json({ error: 'Failed to fetch boxscore' });
  }
}
