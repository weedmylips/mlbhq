import { Router } from 'express';
import { getOrFetch } from '../cache.js';

const router = Router();

const TRADITIONAL_HITTING = [
  { key: 'battingAverage', label: 'AVG' },
  { key: 'homeRuns', label: 'HR' },
  { key: 'runsBattedIn', label: 'RBI' },
  { key: 'stolenBases', label: 'SB' },
  { key: 'onBasePercentage', label: 'OBP' },
];

const ADVANCED_HITTING = [
  { key: 'onBasePlusSlugging', label: 'OPS' },
  { key: 'sluggingPercentage', label: 'SLG' },
  { key: 'isolatedPower', label: 'ISO' },
  { key: 'strikeoutRate', label: 'K%' },
  { key: 'walksPerPlateAppearance', label: 'BB%' },
];

const TRADITIONAL_PITCHING = [
  { key: 'earnedRunAverage', label: 'ERA' },
  { key: 'wins', label: 'W' },
  { key: 'saves', label: 'SV' },
  { key: 'strikeoutsPer9Inn', label: 'K/9' },
];

const ADVANCED_PITCHING = [
  { key: 'walksAndHitsPerInningPitched', label: 'WHIP' },
  { key: 'strikeoutWalkRatio', label: 'K/BB' },
  { key: 'groundOutsToAirouts', label: 'GO/AO' },
];

const ALL_CATS = [
  ...TRADITIONAL_HITTING,
  ...ADVANCED_HITTING,
  ...TRADITIONAL_PITCHING,
  ...ADVANCED_PITCHING,
];

const LABEL_MAP = Object.fromEntries(ALL_CATS.map((c) => [c.key, c.label]));

const TRAD_HITTING_SET = new Set(TRADITIONAL_HITTING.map((c) => c.key));
const ADV_HITTING_SET = new Set(ADVANCED_HITTING.map((c) => c.key));
const TRAD_PITCHING_SET = new Set(TRADITIONAL_PITCHING.map((c) => c.key));
const ADV_PITCHING_SET = new Set(ADVANCED_PITCHING.map((c) => c.key));

const TEAM_ABBR = {108:'LAA',109:'ARI',110:'BAL',111:'BOS',112:'CHC',113:'CIN',114:'CLE',115:'COL',116:'DET',117:'HOU',118:'KC',119:'LAD',120:'WSH',121:'NYM',133:'OAK',134:'PIT',135:'SD',136:'SEA',137:'SF',138:'STL',139:'TB',140:'TEX',141:'TOR',142:'MIN',143:'PHI',144:'ATL',145:'CWS',146:'MIA',147:'NYY',158:'MIL'};

function classifyCategory(key) {
  if (TRAD_HITTING_SET.has(key)) return { group: 'hitting', type: 'traditional' };
  if (ADV_HITTING_SET.has(key)) return { group: 'hitting', type: 'advanced' };
  if (TRAD_PITCHING_SET.has(key)) return { group: 'pitching', type: 'traditional' };
  if (ADV_PITCHING_SET.has(key)) return { group: 'pitching', type: 'advanced' };
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
      let teamUrl = `https://statsapi.mlb.com/api/v1/teams/${teamId}/leaders?leaderCategories=${cats}&season=${season}&limit=5`;
      const leagueUrl = `https://statsapi.mlb.com/api/v1/stats/leaders?leaderCategories=${cats}&season=${season}&sportId=1&limit=50`;

      let [teamResp, leagueResp] = await Promise.all([fetch(teamUrl), fetch(leagueUrl)]);
      let [data, leagueData] = await Promise.all([teamResp.json(), leagueResp.json()]);

      if (!data.teamLeaders?.length) {
        const prevTeamUrl = `https://statsapi.mlb.com/api/v1/teams/${teamId}/leaders?leaderCategories=${cats}&season=${season - 1}&limit=5`;
        const prevLeagueUrl = `https://statsapi.mlb.com/api/v1/stats/leaders?leaderCategories=${cats}&season=${season - 1}&sportId=1&limit=50`;
        [teamResp, leagueResp] = await Promise.all([fetch(prevTeamUrl), fetch(prevLeagueUrl)]);
        [data, leagueData] = await Promise.all([teamResp.json(), leagueResp.json()]);
      }

      // Build lookup: category -> playerId -> league rank
      const leagueRankMap = {};
      for (const cat of leagueData.leagueLeaders || []) {
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
            leaders: (cat.leaders || []).map((l) => ({
              rank: l.rank,
              name: l.person?.fullName,
              playerId: l.person?.id,
              value: l.value,
              leagueRank: catRanks[l.person?.id] || null,
            })),
          };
        });
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
      const cats = ALL_CATS.map((c) => c.key).join(',');
      let url = `https://statsapi.mlb.com/api/v1/stats/leaders?leaderCategories=${cats}&season=${season}&sportId=1&limit=5&hydrate=person(team)`;
      let resp = await fetch(url);
      let data = await resp.json();

      if (!data.leagueLeaders?.length) {
        url = `https://statsapi.mlb.com/api/v1/stats/leaders?leaderCategories=${cats}&season=${season - 1}&sportId=1&limit=5&hydrate=person(team)`;
        resp = await fetch(url);
        data = await resp.json();
      }

      const seen = new Set();
      return (data.leagueLeaders || [])
        .filter((cat) => {
          if (seen.has(cat.leaderCategory)) return false;
          seen.add(cat.leaderCategory);
          return LABEL_MAP[cat.leaderCategory] !== undefined;
        })
        .map((cat) => {
          const { group, type } = classifyCategory(cat.leaderCategory);
          return {
            category: cat.leaderCategory,
            label: LABEL_MAP[cat.leaderCategory],
            group,
            type,
            leaders: (cat.leaders || []).map((l) => ({
              rank: l.rank,
              name: l.person?.fullName,
              playerId: l.person?.id,
              team: l.team?.name || l.person?.currentTeam?.name || l.person?.team?.name || '',
              teamAbbr: TEAM_ABBR[l.team?.id] || l.team?.abbreviation || l.person?.currentTeam?.abbreviation || '',
              value: l.value,
            })),
          };
        });
    }, 3600);

    res.json(leaders);
  } catch (err) {
    console.error('League leaders error:', err.message);
    res.status(500).json({ error: 'Failed to fetch league leaders' });
  }
});

export default router;
