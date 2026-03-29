import { Router } from 'express';
import { getOrFetch } from '../cache.js';

const router = Router();

function ordinalRank(n) {
  if (!n) return null;
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function getRank(splits, teamId, statField, lowerIsBetter) {
  const valid = splits.filter(s => s.stat?.[statField] != null);
  const sorted = [...valid].sort((a, b) => {
    const va = parseFloat(a.stat[statField]) || 0;
    const vb = parseFloat(b.stat[statField]) || 0;
    return lowerIsBetter ? va - vb : vb - va;
  });
  const idx = sorted.findIndex(s => String(s.team?.id) === String(teamId));
  return idx >= 0 ? ordinalRank(idx + 1) : null;
}

function abbrevName(fullName) {
  if (!fullName) return '';
  const parts = fullName.split(' ');
  if (parts.length < 2) return fullName;
  return `${parts[0][0]}. ${parts.slice(1).join(' ')}`;
}

router.get('/stats', async (req, res) => {
  try {
    const teamId = req.query.teamId || 147;
    const leagueId = req.query.leagueId;
    const cacheKey = leagueId ? `stats-${teamId}-${leagueId}` : `stats-${teamId}-mlb`;
    const result = await getOrFetch(cacheKey, async () => {
      let season = new Date().getFullYear();
      const leagueFilter = leagueId ? `&leagueIds=${leagueId}` : '';

      async function fetchStats(s) {
        return Promise.all([
          fetch(`https://statsapi.mlb.com/api/v1/teams/${teamId}/stats?stats=season&group=hitting&season=${s}`),
          fetch(`https://statsapi.mlb.com/api/v1/teams/${teamId}/stats?stats=season&group=pitching&season=${s}`),
          fetch(`https://statsapi.mlb.com/api/v1/teams/stats?stats=season&group=hitting&season=${s}${leagueFilter}&sportId=1`),
          fetch(`https://statsapi.mlb.com/api/v1/teams/stats?stats=season&group=pitching&season=${s}${leagueFilter}&sportId=1`),
          fetch(`https://statsapi.mlb.com/api/v1/stats?stats=season&group=hitting&season=${s}&teamId=${teamId}&playerPool=All&sportId=1`),
          fetch(`https://statsapi.mlb.com/api/v1/stats?stats=season&group=pitching&season=${s}&teamId=${teamId}&playerPool=All&sportId=1`),
        ]);
      }

      let [hittingResp, pitchingResp, allHittingResp, allPitchingResp, playerHittingResp, playerPitchingResp] = await fetchStats(season);

      // Check if current season has data; if not, fall back to previous season
      const testData = await hittingResp.clone().json();
      if (!testData.stats?.length) {
        season = season - 1;
        [hittingResp, pitchingResp, allHittingResp, allPitchingResp, playerHittingResp, playerPitchingResp] = await fetchStats(season);
      }

      const [hittingData, pitchingData, allHittingData, allPitchingData, playerHittingData, playerPitchingData] = await Promise.all([
        hittingResp.json(),
        pitchingResp.json(),
        allHittingResp.json(),
        allPitchingResp.json(),
        playerHittingResp.json(),
        playerPitchingResp.json(),
      ]);

      const hittingStat = hittingData.stats?.[0]?.splits?.[0]?.stat || {};
      const pitchingStat = pitchingData.stats?.[0]?.splits?.[0]?.stat || {};

      const allHittingSplits = allHittingData.stats?.[0]?.splits || [];
      const allPitchingSplits = allPitchingData.stats?.[0]?.splits || [];

      const hittingRanks = allHittingSplits.length > 0 ? {
        avg: getRank(allHittingSplits, teamId, 'avg', false),
        ops: getRank(allHittingSplits, teamId, 'ops', false),
        hr: getRank(allHittingSplits, teamId, 'homeRuns', false),
        runs: getRank(allHittingSplits, teamId, 'runs', false),
        sb: getRank(allHittingSplits, teamId, 'stolenBases', false),
        rbi: getRank(allHittingSplits, teamId, 'rbi', false),
      } : null;

      const pitchingRanks = allPitchingSplits.length > 0 ? {
        era: getRank(allPitchingSplits, teamId, 'era', true),
        whip: getRank(allPitchingSplits, teamId, 'whip', true),
        k: getRank(allPitchingSplits, teamId, 'strikeOuts', false),
        saves: getRank(allPitchingSplits, teamId, 'saves', false),
        wins: getRank(allPitchingSplits, teamId, 'wins', false),
        losses: getRank(allPitchingSplits, teamId, 'losses', true),
      } : null;

      // Compute league averages from all-teams data
      function leagueAvg(splits, field) {
        const vals = splits.map(s => parseFloat(s.stat?.[field]) || 0).filter(v => v > 0);
        if (vals.length === 0) return null;
        return vals.reduce((a, b) => a + b, 0) / vals.length;
      }

      const leagueAvgHitting = allHittingSplits.length > 0 ? {
        avg: leagueAvg(allHittingSplits, 'avg')?.toFixed(3) || null,
        ops: leagueAvg(allHittingSplits, 'ops')?.toFixed(3) || null,
        hr: Math.round(leagueAvg(allHittingSplits, 'homeRuns') || 0),
        runs: Math.round(leagueAvg(allHittingSplits, 'runs') || 0),
        sb: Math.round(leagueAvg(allHittingSplits, 'stolenBases') || 0),
        rbi: Math.round(leagueAvg(allHittingSplits, 'rbi') || 0),
      } : null;

      const leagueAvgPitching = allPitchingSplits.length > 0 ? {
        era: leagueAvg(allPitchingSplits, 'era')?.toFixed(2) || null,
        whip: leagueAvg(allPitchingSplits, 'whip')?.toFixed(2) || null,
        k: Math.round(leagueAvg(allPitchingSplits, 'strikeOuts') || 0),
        saves: Math.round(leagueAvg(allPitchingSplits, 'saves') || 0),
        wins: Math.round(leagueAvg(allPitchingSplits, 'wins') || 0),
        losses: Math.round(leagueAvg(allPitchingSplits, 'losses') || 0),
      } : null;

      const playerHittingSplits = playerHittingData.stats?.[0]?.splits || [];
      const topBatters = playerHittingSplits
        .filter(s => (s.stat?.atBats || 0) >= 5)
        .sort((a, b) => parseFloat(b.stat?.ops || 0) - parseFloat(a.stat?.ops || 0))
        .slice(0, 5)
        .map(s => ({
          name: abbrevName(s.player?.fullName),
          avg: s.stat?.avg || '.000',
          hr: s.stat?.homeRuns || 0,
          rbi: s.stat?.rbi || 0,
        }));

      const playerPitchingSplits = playerPitchingData.stats?.[0]?.splits || [];
      const topPitchers = playerPitchingSplits
        .filter(s => {
          const gs = s.stat?.gamesStarted || 0;
          const gp = s.stat?.gamesPlayed || s.stat?.gamesPitched || 1;
          return gs >= 1 && gs / gp >= 0.4;
        })
        .sort((a, b) => parseFloat(a.stat?.era || 99) - parseFloat(b.stat?.era || 99))
        .slice(0, 5)
        .map(s => ({
          name: abbrevName(s.player?.fullName),
          era: s.stat?.era || '-.--',
          wins: s.stat?.wins || 0,
          losses: s.stat?.losses || 0,
          k: s.stat?.strikeOuts || 0,
          ip: s.stat?.inningsPitched || '0.0',
        }));

      return {
        hitting: {
          avg: hittingStat.avg || '.000',
          ops: hittingStat.ops || '.000',
          hr: hittingStat.homeRuns || 0,
          runs: hittingStat.runs || 0,
          sb: hittingStat.stolenBases || 0,
          hits: hittingStat.hits || 0,
          rbi: hittingStat.rbi || 0,
          obp: hittingStat.obp || '.000',
          slg: hittingStat.slg || '.000',
        },
        pitching: {
          era: pitchingStat.era || '0.00',
          whip: pitchingStat.whip || '0.00',
          k: pitchingStat.strikeOuts || 0,
          saves: pitchingStat.saves || 0,
          wins: pitchingStat.wins || 0,
          losses: pitchingStat.losses || 0,
          ip: pitchingStat.inningsPitched || '0.0',
          avg: pitchingStat.avg || '.000',
        },
        hittingRanks,
        pitchingRanks,
        leagueAvgHitting,
        leagueAvgPitching,
        topBatters,
        topPitchers,
      };
    }, 900);
    res.json(result);
  } catch (err) {
    console.error('Stats error:', err.message);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
