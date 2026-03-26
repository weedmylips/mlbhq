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
      const boxscore = data.liveData?.boxscore || {};

      function getLineup(side) {
        const team = boxscore.teams?.[side] || {};
        const battingOrder = team.battingOrder || [];
        const players = team.players || {};
        return battingOrder.map((id, idx) => {
          const p = players[`ID${id}`];
          return {
            id,
            order: idx + 1,
            name: p?.person?.fullName || '',
            position: p?.position?.abbreviation || '',
            batting: p?.stats?.batting || null,
          };
        });
      }

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
        innings: linescore.innings || [],
        currentBatter: linescore.offense?.batter || null,
        currentPitcher: linescore.defense?.pitcher || null,
        battingTeamId: linescore.offense?.team?.id || null,
        fieldingTeamId: linescore.defense?.team?.id || null,
        lastPlay: plays.currentPlay?.result?.description || '',
        probablePitchers: data.gameData?.probablePitchers || {},
        lineups: {
          away: getLineup('away'),
          home: getLineup('home'),
        },
        pitchCount: (() => {
          const currentPitcherId = linescore.defense?.pitcher?.id;
          if (!currentPitcherId) return null;
          const side = linescore.inningHalf === 'Top' ? 'home' : 'away';
          const p = boxscore.teams?.[side]?.players?.[`ID${currentPitcherId}`];
          const ps = p?.stats?.pitching || {};
          return {
            pitches: ps.pitchesThrown ?? null,
            strikes: ps.strikes ?? null,
            balls: (ps.pitchesThrown ?? 0) - (ps.strikes ?? 0),
            ip: ps.inningsPitched ?? null,
          };
        })(),
        awayPitchCount: (() => {
          const pitcherIds = boxscore.teams?.away?.pitchers || [];
          const currentId = pitcherIds[pitcherIds.length - 1];
          if (!currentId) return null;
          const p = boxscore.teams?.away?.players?.[`ID${currentId}`];
          const ps = p?.stats?.pitching || {};
          return {
            name: p?.person?.fullName?.split(' ').at(-1) || 'Pitcher',
            pitches: ps.pitchesThrown ?? null,
            strikes: ps.strikes ?? null,
            balls: (ps.pitchesThrown ?? 0) - (ps.strikes ?? 0),
            ip: ps.inningsPitched ?? null,
          };
        })(),
        homePitchCount: (() => {
          const pitcherIds = boxscore.teams?.home?.pitchers || [];
          const currentId = pitcherIds[pitcherIds.length - 1];
          if (!currentId) return null;
          const p = boxscore.teams?.home?.players?.[`ID${currentId}`];
          const ps = p?.stats?.pitching || {};
          return {
            name: p?.person?.fullName?.split(' ').at(-1) || 'Pitcher',
            pitches: ps.pitchesThrown ?? null,
            strikes: ps.strikes ?? null,
            balls: (ps.pitchesThrown ?? 0) - (ps.strikes ?? 0),
            ip: ps.inningsPitched ?? null,
          };
        })(),
        currentAtBat: (plays.currentPlay?.playEvents || [])
          .filter((e) => e.isPitch)
          .map((e) => ({
            pitchNumber: e.pitchNumber,
            type: e.details?.type?.description || e.details?.description || '',
            speed: e.pitchData?.startSpeed ?? null,
            result: e.details?.description || '',
            call: e.details?.call?.description || '',
            isStrike: e.details?.isStrike ?? false,
            isBall: e.details?.isBall ?? false,
            isInPlay: e.details?.isInPlay ?? false,
            pX: e.pitchData?.coordinates?.pX ?? null,
            pZ: e.pitchData?.coordinates?.pZ ?? null,
            zone: e.pitchData?.zone ?? null,
          })),
        recentPlays: (plays.allPlays || [])
          .slice(-6, -1)
          .reverse()
          .map((p) => ({
            description: p.result?.description || '',
            event: p.result?.event || '',
            isOut: p.result?.isOut ?? false,
            rbi: p.result?.rbi ?? 0,
            awayScore: p.result?.awayScore ?? 0,
            homeScore: p.result?.homeScore ?? 0,
          })),
        scoringPlays: (plays.allPlays || [])
          .filter((p) => p.about?.isScoringPlay)
          .map((p) => ({
            inning: p.about?.inning,
            halfInning: p.about?.halfInning,
            event: p.result?.event || '',
            description: p.result?.description || '',
            rbi: p.result?.rbi ?? 0,
            awayScore: p.result?.awayScore ?? 0,
            homeScore: p.result?.homeScore ?? 0,
          })),
      };
    }, 15);
    res.json(result);
  } catch (err) {
    console.error('Live error:', err.message);
    res.status(500).json({ error: 'Failed to fetch live game' });
  }
}
