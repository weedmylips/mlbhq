import { Router } from 'express';
import { getOrFetch } from '../cache.js';

const router = Router();

// FIP constant approximation by season (historical average ~3.10)
const C_FIP = 3.10;

function computeAdvanced(stat, isPitching) {
  const result = {};

  if (isPitching) {
    const ip = parseFloat(stat.inningsPitched) || 0;
    const hr = stat.homeRuns ?? 0;
    const bb = stat.baseOnBalls ?? 0;
    const hbp = stat.hitByPitch ?? 0;
    const k = stat.strikeOuts ?? 0;
    const h = stat.hits ?? 0;
    const bf = stat.battersFaced ?? stat.atBats ?? 0;

    // FIP = ((13*HR) + (3*(BB+HBP)) - (2*K)) / IP + cFIP
    result.fip = ip > 0
      ? (((13 * hr) + (3 * (bb + hbp)) - (2 * k)) / ip + C_FIP).toFixed(2)
      : null;

    // K% and BB%
    result.kPct = bf > 0 ? ((k / bf) * 100).toFixed(1) : null;
    result.bbPct = bf > 0 ? ((bb / bf) * 100).toFixed(1) : null;

    // BABIP = (H - HR) / (BF - K - HR + SF)
    const sf = stat.sacFlies ?? 0;
    const denom = bf - k - hr + sf;
    result.babip = denom > 0 ? ((h - hr) / denom).toFixed(3) : null;

    // HR/9
    result.hr9 = ip > 0 ? ((hr * 9) / ip).toFixed(2) : null;

    // K-BB%
    result.kBBPct = bf > 0 ? (((k - bb) / bf) * 100).toFixed(1) : null;

    // Pass through standard
    result.era = stat.era ?? null;
    result.whip = stat.whip ?? null;
    result.k = k;
    result.bb = bb;
    result.ip = stat.inningsPitched;
    result.wins = stat.wins ?? 0;
    result.losses = stat.losses ?? 0;
  } else {
    const ab = stat.atBats ?? 0;
    const h = stat.hits ?? 0;
    const hr = stat.homeRuns ?? 0;
    const bb = stat.baseOnBalls ?? 0;
    const hbp = stat.hitByPitch ?? 0;
    const sf = stat.sacFlies ?? 0;
    const k = stat.strikeOuts ?? 0;
    const pa = stat.plateAppearances ?? (ab + bb + hbp + sf);

    // ISO = SLG - AVG
    const slg = parseFloat(stat.slg) || 0;
    const avg = parseFloat(stat.avg) || 0;
    result.iso = (slg - avg).toFixed(3);

    // K% and BB%
    result.kPct = pa > 0 ? ((k / pa) * 100).toFixed(1) : null;
    result.bbPct = pa > 0 ? ((bb / pa) * 100).toFixed(1) : null;

    // BABIP = (H - HR) / (AB - K - HR + SF)
    const denom = ab - k - hr + sf;
    result.babip = denom > 0 ? ((h - hr) / denom).toFixed(3) : null;

    // wOBA approximation (2024 linear weights)
    const ubb = bb - (stat.intentionalWalks ?? 0);
    const singles = h - (stat.doubles ?? 0) - (stat.triples ?? 0) - hr;
    const woba_num =
      0.69 * ubb +
      0.72 * hbp +
      0.88 * singles +
      1.24 * (stat.doubles ?? 0) +
      1.56 * (stat.triples ?? 0) +
      2.01 * hr;
    const woba_denom = ab + bb - (stat.intentionalWalks ?? 0) + sf + hbp;
    result.woba = woba_denom > 0 ? (woba_num / woba_denom).toFixed(3) : null;

    // Pass through standard
    result.avg = stat.avg ?? null;
    result.obp = stat.obp ?? null;
    result.slg = stat.slg ?? null;
    result.ops = stat.ops ?? null;
    result.hr = hr;
    result.sb = stat.stolenBases ?? 0;
    result.rbi = stat.rbi ?? 0;
    result.runs = stat.runs ?? 0;
  }

  return result;
}

function abbrevName(fullName) {
  if (!fullName) return '';
  const parts = fullName.split(' ');
  if (parts.length < 2) return fullName;
  return `${parts[0][0]}. ${parts.slice(1).join(' ')}`;
}

function ordinalRank(n) {
  if (!n) return null;
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function advRank(allAdvanced, teamId, field, lowerIsBetter) {
  const valid = allAdvanced.filter((t) => t[field] != null);
  const sorted = [...valid].sort((a, b) => {
    const va = parseFloat(a[field]) || 0;
    const vb = parseFloat(b[field]) || 0;
    return lowerIsBetter ? va - vb : vb - va;
  });
  const idx = sorted.findIndex((t) => String(t.teamId) === String(teamId));
  return idx >= 0 ? ordinalRank(idx + 1) : null;
}

router.get('/analytics', async (req, res) => {
  try {
    const teamId = req.query.teamId || 147;
    const leagueId = req.query.leagueId;
    const cacheKey = leagueId ? `analytics-${teamId}-${leagueId}` : `analytics-${teamId}-mlb`;
    const result = await getOrFetch(cacheKey, async () => {
      let season = new Date().getFullYear();

      const leagueFilter = leagueId ? `&leagueIds=${leagueId}` : '';

      async function fetchData(s) {
        return Promise.all([
          fetch(`https://statsapi.mlb.com/api/v1/teams/${teamId}/stats?stats=season&group=hitting&season=${s}`).then((r) => r.json()),
          fetch(`https://statsapi.mlb.com/api/v1/teams/${teamId}/stats?stats=season&group=pitching&season=${s}`).then((r) => r.json()),
          fetch(`https://statsapi.mlb.com/api/v1/stats?stats=season&group=hitting&season=${s}&teamId=${teamId}&playerPool=All&sportId=1`).then((r) => r.json()),
          fetch(`https://statsapi.mlb.com/api/v1/stats?stats=season&group=pitching&season=${s}&teamId=${teamId}&playerPool=All&sportId=1`).then((r) => r.json()),
          fetch(`https://statsapi.mlb.com/api/v1/teams/stats?stats=season&group=hitting&season=${s}${leagueFilter}&sportId=1`).then((r) => r.json()),
          fetch(`https://statsapi.mlb.com/api/v1/teams/stats?stats=season&group=pitching&season=${s}${leagueFilter}&sportId=1`).then((r) => r.json()),
        ]);
      }

      let [hittingData, pitchingData, playerHitting, playerPitching, allHittingData, allPitchingData] = await fetchData(season);

      if (!hittingData.stats?.length) {
        season = season - 1;
        [hittingData, pitchingData, playerHitting, playerPitching, allHittingData, allPitchingData] = await fetchData(season);
      }

      const teamHitting = hittingData.stats?.[0]?.splits?.[0]?.stat || {};
      const teamPitching = pitchingData.stats?.[0]?.splits?.[0]?.stat || {};

      // Compute advanced stats for all league teams to derive rankings
      const allHittingSplits = allHittingData.stats?.[0]?.splits || [];
      const allHittingAdv = allHittingSplits.map((s) => ({
        teamId: s.team?.id,
        ...computeAdvanced(s.stat || {}, false),
      }));

      const allPitchingSplits = allPitchingData.stats?.[0]?.splits || [];
      const allPitchingAdv = allPitchingSplits.map((s) => ({
        teamId: s.team?.id,
        ...computeAdvanced(s.stat || {}, true),
      }));

      const hittingRanks = allHittingAdv.length > 0 ? {
        woba: advRank(allHittingAdv, teamId, 'woba', false),
        iso: advRank(allHittingAdv, teamId, 'iso', false),
        babip: advRank(allHittingAdv, teamId, 'babip', false),
        kPct: advRank(allHittingAdv, teamId, 'kPct', true),
        bbPct: advRank(allHittingAdv, teamId, 'bbPct', false),
        sb: advRank(allHittingAdv, teamId, 'sb', false),
      } : null;

      const pitchingRanks = allPitchingAdv.length > 0 ? {
        fip: advRank(allPitchingAdv, teamId, 'fip', true),
        babip: advRank(allPitchingAdv, teamId, 'babip', true),
        kPct: advRank(allPitchingAdv, teamId, 'kPct', false),
        bbPct: advRank(allPitchingAdv, teamId, 'bbPct', true),
        kBBPct: advRank(allPitchingAdv, teamId, 'kBBPct', false),
        hr9: advRank(allPitchingAdv, teamId, 'hr9', true),
      } : null;

      // Compute league averages from all-teams advanced stats
      function advAvg(arr, field) {
        const vals = arr.map(t => parseFloat(t[field]) || 0).filter(v => v > 0);
        if (vals.length === 0) return null;
        return vals.reduce((a, b) => a + b, 0) / vals.length;
      }

      const leagueAvgHitting = allHittingAdv.length > 0 ? {
        woba: advAvg(allHittingAdv, 'woba')?.toFixed(3) || null,
        iso: advAvg(allHittingAdv, 'iso')?.toFixed(3) || null,
        babip: advAvg(allHittingAdv, 'babip')?.toFixed(3) || null,
        kPct: advAvg(allHittingAdv, 'kPct')?.toFixed(1) || null,
        bbPct: advAvg(allHittingAdv, 'bbPct')?.toFixed(1) || null,
        sb: Math.round(advAvg(allHittingAdv, 'sb') || 0),
      } : null;

      const leagueAvgPitching = allPitchingAdv.length > 0 ? {
        fip: advAvg(allPitchingAdv, 'fip')?.toFixed(2) || null,
        babip: advAvg(allPitchingAdv, 'babip')?.toFixed(3) || null,
        kPct: advAvg(allPitchingAdv, 'kPct')?.toFixed(1) || null,
        bbPct: advAvg(allPitchingAdv, 'bbPct')?.toFixed(1) || null,
        kBBPct: advAvg(allPitchingAdv, 'kBBPct')?.toFixed(1) || null,
        hr9: advAvg(allPitchingAdv, 'hr9')?.toFixed(2) || null,
        whip: advAvg(allPitchingAdv, 'whip')?.toFixed(2) || null,
      } : null;

      // Player-level advanced stats
      const playerHittingSplits = playerHitting.stats?.[0]?.splits || [];
      const advancedBatters = playerHittingSplits
        .filter((s) => (s.stat?.plateAppearances || s.stat?.atBats || 0) >= 20)
        .map((s) => ({
          name: abbrevName(s.player?.fullName),
          playerId: s.player?.id,
          ...computeAdvanced(s.stat, false),
        }))
        .sort((a, b) => parseFloat(b.woba || 0) - parseFloat(a.woba || 0));

      const playerPitchingSplits = playerPitching.stats?.[0]?.splits || [];
      const advancedPitchers = playerPitchingSplits
        .filter((s) => parseFloat(s.stat?.inningsPitched || 0) >= 10)
        .map((s) => ({
          name: abbrevName(s.player?.fullName),
          playerId: s.player?.id,
          ...computeAdvanced(s.stat, true),
        }))
        .sort((a, b) => parseFloat(a.fip || 99) - parseFloat(b.fip || 99));

      return {
        teamHitting: computeAdvanced(teamHitting, false),
        teamPitching: computeAdvanced(teamPitching, true),
        hittingRanks,
        pitchingRanks,
        leagueAvgHitting,
        leagueAvgPitching,
        batters: advancedBatters,
        pitchers: advancedPitchers,
      };
    }, 900);
    res.json(result);
  } catch (err) {
    console.error('Analytics error:', err.message);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router;
