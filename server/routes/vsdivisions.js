import { Router } from 'express';
import { getOrFetch } from '../cache.js';

const router = Router();

router.get('/vsdivisions', async (req, res) => {
  try {
    const teamId = req.query.teamId;
    if (!teamId) return res.status(400).json({ error: 'teamId required' });

    const cacheKey = `vsdivisions-${teamId}`;
    const result = await getOrFetch(cacheKey, async () => {
      const season = new Date().getFullYear();
      const url = `https://statsapi.mlb.com/api/v1/schedule?teamId=${teamId}&season=${season}&sportId=1&gameType=R&hydrate=team(division)&fields=dates,date,games,status,codedGameState,teams,away,home,team,id,division,nameShort,isWinner`;
      const resp = await fetch(url);
      const data = await resp.json();

      const records = {};
      for (const date of (data.dates || [])) {
        for (const game of (date.games || [])) {
          if (game.status?.codedGameState !== 'F') continue;
          const home = game.teams.home;
          const away = game.teams.away;
          let oppDiv, isWin;
          if (home.team.id === Number(teamId)) {
            oppDiv = away.team.division?.nameShort;
            isWin = home.isWinner;
          } else {
            oppDiv = home.team.division?.nameShort;
            isWin = away.isWinner;
          }
          if (!oppDiv) continue;
          if (!records[oppDiv]) records[oppDiv] = { division: oppDiv, wins: 0, losses: 0 };
          if (isWin) records[oppDiv].wins++;
          else records[oppDiv].losses++;
        }
      }

      const order = ['AL East', 'AL Central', 'AL West', 'NL East', 'NL Central', 'NL West'];
      return order.map((d) => ({
        division: d,
        record: records[d] ? `${records[d].wins}-${records[d].losses}` : '0-0',
      }));
    }, 3600);

    res.json(result);
  } catch (err) {
    console.error('VsDivisions error:', err.message);
    res.status(500).json({ error: 'Failed to fetch division records' });
  }
});

export default router;
