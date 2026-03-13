import { createCache } from './_cache.js';

const { getOrFetch } = createCache(15, 10);

export default async function handler(req, res) {
  try {
    const gamePk = req.query.gamePk;
    if (!gamePk) return res.status(400).json({ error: 'gamePk required' });

    const cacheKey = `live-${gamePk}`;
    const result = await getOrFetch(cacheKey, async () => {
      const url = `https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live`;
      const resp = await fetch(url);
      const data = await resp.json();

      const linescore = data.liveData?.linescore || {};
      const plays = data.liveData?.plays || {};

      return {
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
    }, 15);
    res.json(result);
  } catch (err) {
    console.error('Live error:', err.message);
    res.status(500).json({ error: 'Failed to fetch live game' });
  }
}
