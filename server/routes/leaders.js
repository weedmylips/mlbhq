import { Router } from 'express';
import { getOrFetch } from '../cache.js';

const router = Router();

// Categories where the MLB API returns leaders in ascending order but higher is better
const REVERSE_SORT_CATS = new Set(['sluggingPercentage']);

// Counting stats don't need minimum PA/IP filters
const COUNTING_STATS = new Set(['homeRuns', 'runsBattedIn', 'stolenBases', 'hits', 'runs', 'walks', 'strikeouts', 'wins', 'losses', 'saves', 'blownSaves', 'holds', 'inningsPitched']);

// Minimum thresholds for rate stats to avoid early-season noise
const MIN_PA = 3;
const MIN_IP = 1.0;

function meetsMinimum(leader, isPitching) {
  const stats = leader.person?.stats?.[0]?.splits?.[0]?.stat;
  if (!stats) return true; // no stats hydrated, let it through
  if (isPitching) return parseFloat(stats.inningsPitched || 0) >= MIN_IP;
  return (stats.plateAppearances || stats.atBats || 0) >= MIN_PA;
}

function fixLeaderOrder(category, leaders) {
  if (!REVERSE_SORT_CATS.has(category)) return leaders;
  const sorted = [...leaders].sort((a, b) => parseFloat(b.value) - parseFloat(a.value));
  return sorted.map((l, i) => ({ ...l, rank: i + 1 }));
}

const TRADITIONAL_HITTING = [
  { key: 'onBasePlusSlugging', label: 'OPS' },
  { key: 'battingAverage', label: 'AVG' },
  { key: 'homeRuns', label: 'HR' },
  { key: 'runsBattedIn', label: 'RBI' },
  { key: 'hits', label: 'H' },
  { key: 'runs', label: 'R' },
  { key: 'stolenBases', label: 'SB' },
  { key: 'walks', label: 'BB' },
  { key: 'strikeouts', label: 'SO' },
  { key: 'onBasePercentage', label: 'OBP' },
  { key: 'sluggingPercentage', label: 'SLG' },
];

const TRADITIONAL_PITCHING = [
  { key: 'earnedRunAverage', label: 'ERA' },
  { key: 'walksAndHitsPerInningPitched', label: 'WHIP' },
  { key: 'wins', label: 'W' },
  { key: 'losses', label: 'L' },
  { key: 'saves', label: 'SV' },
  { key: 'blownSaves', label: 'BS' },
  { key: 'holds', label: 'HLD' },
  { key: 'strikeoutsPer9Inn', label: 'K/9' },
  { key: 'walksPer9Inn', label: 'BB/9' },
  { key: 'inningsPitched', label: 'IP' },
  { key: 'strikeoutWalkRatio', label: 'K/BB' },
  { key: 'homeRunsPer9', label: 'HR/9' },
];

const ALL_CATS = [
  ...TRADITIONAL_HITTING,
  ...TRADITIONAL_PITCHING,
];

const LABEL_MAP = Object.fromEntries(ALL_CATS.map((c) => [c.key, c.label]));
const SORT_ORDER = Object.fromEntries(ALL_CATS.map((c, i) => [c.key, i]));

const TRAD_HITTING_SET = new Set(TRADITIONAL_HITTING.map((c) => c.key));
const TRAD_PITCHING_SET = new Set(TRADITIONAL_PITCHING.map((c) => c.key));

const TEAM_ABBR = {108:'LAA',109:'ARI',110:'BAL',111:'BOS',112:'CHC',113:'CIN',114:'CLE',115:'COL',116:'DET',117:'HOU',118:'KC',119:'LAD',120:'WSH',121:'NYM',133:'OAK',134:'PIT',135:'SD',136:'SEA',137:'SF',138:'STL',139:'TB',140:'TEX',141:'TOR',142:'MIN',143:'PHI',144:'ATL',145:'CWS',146:'MIA',147:'NYY',158:'MIL'};

function classifyCategory(key) {
  if (TRAD_HITTING_SET.has(key)) return { group: 'hitting', type: 'traditional' };
  if (TRAD_PITCHING_SET.has(key)) return { group: 'pitching', type: 'traditional' };
  return { group: 'hitting', type: 'traditional' };
}

router.get('/leaders', async (req, res) => {
  try {
    const { teamId } = req.query;
    if (!teamId) return res.status(400).json({ error: 'teamId required' });

    const cacheKey = `leaders-${teamId}`;
    const leaders = await getOrFetch(cacheKey, async () => {
      const season = new Date().getFullYear();
      const cats = ALL_CATS.map((c) => c.key).join(',');
      const hittingCats = TRADITIONAL_HITTING.map((c) => c.key).join(',');
      const pitchingCats = TRADITIONAL_PITCHING.map((c) => c.key).join(',');
      let teamUrl = `https://statsapi.mlb.com/api/v1/teams/${teamId}/leaders?leaderCategories=${cats}&season=${season}&limit=5`;
      let leagueHUrl = `https://statsapi.mlb.com/api/v1/stats/leaders?leaderCategories=${hittingCats}&season=${season}&sportId=1&limit=50&statGroup=hitting`;
      let leaguePUrl = `https://statsapi.mlb.com/api/v1/stats/leaders?leaderCategories=${pitchingCats}&season=${season}&sportId=1&limit=50&statGroup=pitching`;

      let [teamResp, lhResp, lpResp] = await Promise.all([fetch(teamUrl), fetch(leagueHUrl), fetch(leaguePUrl)]);
      let [data, lhData, lpData] = await Promise.all([teamResp.json(), lhResp.json(), lpResp.json()]);

      if (!data.teamLeaders?.length) {
        const prevTeamUrl = `https://statsapi.mlb.com/api/v1/teams/${teamId}/leaders?leaderCategories=${cats}&season=${season - 1}&limit=5`;
        leagueHUrl = `https://statsapi.mlb.com/api/v1/stats/leaders?leaderCategories=${hittingCats}&season=${season - 1}&sportId=1&limit=50&statGroup=hitting`;
        leaguePUrl = `https://statsapi.mlb.com/api/v1/stats/leaders?leaderCategories=${pitchingCats}&season=${season - 1}&sportId=1&limit=50&statGroup=pitching`;
        [teamResp, lhResp, lpResp] = await Promise.all([fetch(prevTeamUrl), fetch(leagueHUrl), fetch(leaguePUrl)]);
        [data, lhData, lpData] = await Promise.all([teamResp.json(), lhResp.json(), lpResp.json()]);
      }

      // Build lookup: category -> playerId -> league rank
      const allLeagueLeaders = [...(lhData.leagueLeaders || []), ...(lpData.leagueLeaders || [])];
      const leagueRankMap = {};
      for (const cat of allLeagueLeaders) {
        const map = {};
        for (const l of cat.leaders || []) {
          if (l.person?.id) map[l.person.id] = l.rank;
        }
        leagueRankMap[cat.leaderCategory] = map;
      }

      const seen = new Set();
      return (data.teamLeaders || [])
        .filter((cat) => {
          if (seen.has(cat.leaderCategory)) return false;
          seen.add(cat.leaderCategory);
          return LABEL_MAP[cat.leaderCategory] !== undefined;
        })
        .map((cat) => {
          const { group, type } = classifyCategory(cat.leaderCategory);
          const catRanks = leagueRankMap[cat.leaderCategory] || {};
          return {
            category: cat.leaderCategory,
            label: LABEL_MAP[cat.leaderCategory],
            group,
            type,
            leaders: fixLeaderOrder(cat.leaderCategory, (cat.leaders || []).map((l) => ({
              rank: l.rank,
              name: l.person?.fullName,
              playerId: l.person?.id,
              value: l.value,
              leagueRank: catRanks[l.person?.id] || null,
            }))),
          };
        })
        .sort((a, b) => (SORT_ORDER[a.category] ?? 99) - (SORT_ORDER[b.category] ?? 99));
    }, 3600);

    res.json(leaders);
  } catch (err) {
    console.error('Leaders error:', err.message);
    res.status(500).json({ error: 'Failed to fetch leaders' });
  }
});

router.get('/league-leaders', async (req, res) => {
  try {
    const cacheKey = 'league-leaders';
    const leaders = await getOrFetch(cacheKey, async () => {
      const season = new Date().getFullYear();
      const hittingCats = TRADITIONAL_HITTING.map((c) => c.key).join(',');
      const pitchingCats = TRADITIONAL_PITCHING.map((c) => c.key).join(',');

      // Fetch extra results with hydrated stats so we can filter by minimum PA/IP
      let hUrl = `https://statsapi.mlb.com/api/v1/stats/leaders?leaderCategories=${hittingCats}&season=${season}&sportId=1&limit=50&statGroup=hitting&hydrate=person(team,stats(group=hitting,type=season))`;
      let pUrl = `https://statsapi.mlb.com/api/v1/stats/leaders?leaderCategories=${pitchingCats}&season=${season}&sportId=1&limit=50&statGroup=pitching&hydrate=person(team,stats(group=pitching,type=season))`;

      let [hResp, pResp] = await Promise.all([fetch(hUrl), fetch(pUrl)]);
      let [hData, pData] = await Promise.all([hResp.json(), pResp.json()]);

      if (!hData.leagueLeaders?.length && !pData.leagueLeaders?.length) {
        hUrl = `https://statsapi.mlb.com/api/v1/stats/leaders?leaderCategories=${hittingCats}&season=${season - 1}&sportId=1&limit=50&statGroup=hitting&hydrate=person(team,stats(group=hitting,type=season))`;
        pUrl = `https://statsapi.mlb.com/api/v1/stats/leaders?leaderCategories=${pitchingCats}&season=${season - 1}&sportId=1&limit=50&statGroup=pitching&hydrate=person(team,stats(group=pitching,type=season))`;
        [hResp, pResp] = await Promise.all([fetch(hUrl), fetch(pUrl)]);
        [hData, pData] = await Promise.all([hResp.json(), pResp.json()]);
      }

      const allLeaders = [...(hData.leagueLeaders || []), ...(pData.leagueLeaders || [])];

      const seen = new Set();
      return allLeaders
        .filter((cat) => {
          if (seen.has(cat.leaderCategory)) return false;
          seen.add(cat.leaderCategory);
          return LABEL_MAP[cat.leaderCategory] !== undefined;
        })
        .map((cat) => {
          const { group, type } = classifyCategory(cat.leaderCategory);
          const isPitching = group === 'pitching';
          const isCounting = COUNTING_STATS.has(cat.leaderCategory);
          // For rate stats, filter by minimum PA/IP to avoid early-season noise
          const filtered = isCounting
            ? (cat.leaders || [])
            : (cat.leaders || []).filter((l) => meetsMinimum(l, isPitching));
          return {
            category: cat.leaderCategory,
            label: LABEL_MAP[cat.leaderCategory],
            group,
            type,
            leaders: fixLeaderOrder(cat.leaderCategory, filtered.slice(0, 10).map((l, i) => ({
              rank: i + 1,
              name: l.person?.fullName,
              playerId: l.person?.id,
              teamId: l.team?.id || l.person?.currentTeam?.id || null,
              team: l.team?.name || l.person?.currentTeam?.name || l.person?.team?.name || '',
              teamAbbr: TEAM_ABBR[l.team?.id] || l.team?.abbreviation || l.person?.currentTeam?.abbreviation || '',
              value: l.value,
            }))),
          };
        })
        .sort((a, b) => (SORT_ORDER[a.category] ?? 99) - (SORT_ORDER[b.category] ?? 99));
    }, 3600);

    res.json(leaders);
  } catch (err) {
    console.error('League leaders error:', err.message);
    res.status(500).json({ error: 'Failed to fetch league leaders' });
  }
});

export default router;
