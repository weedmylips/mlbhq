import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

export default async function handler(req, res) {
  try {
    const { gamePk } = req.query;
    if (!gamePk) return res.status(400).json({ error: 'gamePk required' });

    const cacheKey = `boxscore-${gamePk}`;
    const cached = cache.get(cacheKey);
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

    function pitcherStats(playerId) {
      for (const side of ['away', 'home']) {
        const players = teams[side]?.players || {};
        const key = `ID${playerId}`;
        if (players[key]) {
          const p = players[key];
          const s = p.stats?.pitching || {};
          return {
            name: p.person?.fullName || '',
            stats: {
              ip: s.inningsPitched ?? '0.0',
              h: s.hits ?? 0,
              er: s.earnedRuns ?? 0,
              bb: s.baseOnBalls ?? 0,
              so: s.strikeOuts ?? 0,
            },
          };
        }
      }
      return null;
    }

    const decisions = data.decisions || {};
    const result = {
      teams: {
        away: teamSummary('away'),
        home: teamSummary('home'),
      },
      decisions: {
        winner: decisions.winner ? pitcherStats(decisions.winner.id) : null,
        loser: decisions.loser ? pitcherStats(decisions.loser.id) : null,
        save: decisions.save ? pitcherStats(decisions.save.id) : null,
      },
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

    cache.set(cacheKey, result);
    res.json(result);
  } catch (err) {
    console.error('Boxscore error:', err.message);
    res.status(500).json({ error: 'Failed to fetch boxscore' });
  }
}
