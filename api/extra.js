import { createCache } from './_cache.js';

const playerCache = createCache(1800, 120);
const transactionsCache = createCache(1800, 120);
const matchupCache = createCache(3600, 60);
const leadersCache = createCache(3600, 60);
const highlightsCache = createCache(60, 30);

// --- Player ---
async function handlePlayer(req, res) {
  const { playerId } = req.query;
  if (!playerId) return res.status(400).json({ error: 'playerId required' });

  const cacheKey = `player-${playerId}`;
  const player = await playerCache.getOrFetch(cacheKey, async () => {
    const url = `https://statsapi.mlb.com/api/v1/people/${playerId}?hydrate=stats(group=[hitting,pitching],type=[season,career,gameLog,leftAndRight,homeAndAway,byMonth]),currentTeam`;
    const resp = await fetch(url);
    const data = await resp.json();
    const person = data.people?.[0];
    if (!person) return null;

    const stats = person.stats || [];
    const findStats = (group, type) => {
      const entry = stats.find(
        (s) => s.group?.displayName === group && s.type?.displayName === type
      );
      return entry?.splits?.[0]?.stat || null;
    };

    const findAllSplits = (group, type) => {
      const entry = stats.find(
        (s) => s.group?.displayName === group && s.type?.displayName === type
      );
      return entry?.splits || [];
    };

    const hittingGroup = person.primaryPosition?.code === '1' ? 'pitching' : 'hitting';
    const gameLogSplits = findAllSplits(hittingGroup, 'gameLog');
    const gameLog = gameLogSplits.slice(-15).reverse().map((g) => ({
      date: g.date,
      opponent: g.opponent?.abbreviation || g.opponent?.name,
      isHome: g.isHome,
      stat: g.stat,
    }));

    const platoonSplits = findAllSplits(hittingGroup, 'leftAndRight');
    const vsLeft = platoonSplits.find((s) => s.split?.code === 'vl')?.stat || null;
    const vsRight = platoonSplits.find((s) => s.split?.code === 'vr')?.stat || null;

    const haSplits = findAllSplits(hittingGroup, 'homeAndAway');
    const homeStat = haSplits.find((s) => s.split?.code === 'h')?.stat || null;
    const awayStat = haSplits.find((s) => s.split?.code === 'a')?.stat || null;

    const monthSplits = findAllSplits(hittingGroup, 'byMonth');
    const byMonth = monthSplits.map((s) => ({
      month: s.split?.description || '',
      stat: s.stat,
    }));

    return {
      id: person.id,
      fullName: person.fullName,
      firstName: person.firstName,
      lastName: person.lastName,
      birthDate: person.birthDate,
      age: person.currentAge,
      birthCity: person.birthCity,
      birthCountry: person.birthCountry,
      height: person.height,
      weight: person.weight,
      position: person.primaryPosition?.abbreviation,
      positionCode: person.primaryPosition?.code,
      batSide: person.batSide?.code,
      pitchHand: person.pitchHand?.code,
      number: person.primaryNumber,
      debutDate: person.mlbDebutDate,
      draftYear: person.draftYear,
      team: person.currentTeam?.name,
      seasonHitting: findStats('hitting', 'season'),
      careerHitting: findStats('hitting', 'career'),
      seasonPitching: findStats('pitching', 'season'),
      careerPitching: findStats('pitching', 'career'),
      gameLog,
      splits: {
        vsLeft,
        vsRight,
        home: homeStat,
        away: awayStat,
        byMonth,
      },
    };
  }, 1800);

  if (!player) return res.status(404).json({ error: 'Player not found' });
  res.json(player);
}

// --- Transactions ---
const TYPE_MAP = {
  Trade: 'trade',
  'Free Agent Signing': 'signing',
  'Designated for Assignment': 'dfa',
  Optioned: 'option',
  Recalled: 'recall',
  Claimed: 'claim',
  Released: 'release',
  Signed: 'signing',
};

function classifyType(typeDesc) {
  for (const [key, value] of Object.entries(TYPE_MAP)) {
    if (typeDesc?.includes(key)) return value;
  }
  return 'other';
}

async function handleTransactions(req, res) {
  const { teamId } = req.query;
  if (!teamId) return res.status(400).json({ error: 'teamId required' });

  const cacheKey = `transactions-${teamId}`;
  const transactions = await transactionsCache.getOrFetch(cacheKey, async () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    const fmt = (d) => d.toISOString().slice(0, 10);

    const url = `https://statsapi.mlb.com/api/v1/transactions?teamId=${teamId}&startDate=${fmt(start)}&endDate=${fmt(end)}`;
    const resp = await fetch(url);
    const data = await resp.json();

    return (data.transactions || [])
      .filter((t) => t.description)
      .map((t) => ({
        id: t.id,
        date: t.date,
        type: classifyType(t.typeDesc),
        typeDesc: t.typeDesc,
        description: t.description,
        player: t.person
          ? { id: t.person.id, name: t.person.fullName }
          : null,
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 30);
  }, 1800);

  res.json(transactions);
}

// --- Matchup ---
async function fetchPitcherStats(pitcherId) {
  const url = `https://statsapi.mlb.com/api/v1/people/${pitcherId}?hydrate=stats(group=[pitching],type=[season,gameLog])`;
  const resp = await fetch(url);
  const data = await resp.json();
  const person = data.people?.[0];
  if (!person) return null;

  const stats = person.stats || [];
  const seasonSplit = stats.find(
    (s) => s.group?.displayName === 'pitching' && s.type?.displayName === 'season'
  );
  const gameLogSplit = stats.find(
    (s) => s.group?.displayName === 'pitching' && s.type?.displayName === 'gameLog'
  );

  const season = seasonSplit?.splits?.[0]?.stat || null;
  const lastStarts = (gameLogSplit?.splits || []).slice(-3).reverse().map((g) => ({
    date: g.date,
    opponent: g.opponent?.name,
    result: g.isWin ? 'W' : g.isLoss ? 'L' : '-',
    ip: g.stat?.inningsPitched,
    hits: g.stat?.hits,
    er: g.stat?.earnedRuns,
    k: g.stat?.strikeOuts,
    bb: g.stat?.baseOnBalls,
    era: g.stat?.era,
  }));

  return {
    id: person.id,
    name: person.fullName,
    number: person.primaryNumber,
    pitchHand: person.pitchHand?.code,
    season: season
      ? {
          wins: season.wins,
          losses: season.losses,
          era: season.era,
          whip: season.whip,
          k: season.strikeOuts,
          ip: season.inningsPitched,
          k9: season.strikeoutsPer9Inn,
          bb9: season.walksPer9Inn,
          avg: season.avg,
        }
      : null,
    lastStarts,
  };
}

async function handleMatchup(req, res) {
  const { pitcher1, pitcher2 } = req.query;
  if (!pitcher1 && !pitcher2) {
    return res.status(400).json({ error: 'At least one pitcher ID required' });
  }

  const cacheKey = `matchup-${pitcher1 || 0}-${pitcher2 || 0}`;
  const result = await matchupCache.getOrFetch(cacheKey, async () => {
    const [p1, p2] = await Promise.all([
      pitcher1 ? fetchPitcherStats(pitcher1) : null,
      pitcher2 ? fetchPitcherStats(pitcher2) : null,
    ]);
    return { home: p1, away: p2 };
  }, 3600);

  res.json(result);
}

// --- Leaders ---
const TEAM_ABBR = {108:'LAA',109:'ARI',110:'BAL',111:'BOS',112:'CHC',113:'CIN',114:'CLE',115:'COL',116:'DET',117:'HOU',118:'KC',119:'LAD',120:'WSH',121:'NYM',133:'OAK',134:'PIT',135:'SD',136:'SEA',137:'SF',138:'STL',139:'TB',140:'TEX',141:'TOR',142:'MIN',143:'PHI',144:'ATL',145:'CWS',146:'MIA',147:'NYY',158:'MIL'};

const REVERSE_SORT_CATS = new Set(['sluggingPercentage']);
const COUNTING_STATS = new Set(['homeRuns', 'runsBattedIn', 'stolenBases', 'hits', 'runs', 'walks', 'strikeouts', 'wins', 'losses', 'saves', 'blownSaves', 'holds', 'inningsPitched']);
const MIN_PA = 3;
const MIN_IP = 1.0;
function meetsMinimum(leader, isPitching) {
  const stats = leader.person?.stats?.[0]?.splits?.[0]?.stat;
  if (!stats) return true;
  if (isPitching) return parseFloat(stats.inningsPitched || 0) >= MIN_IP;
  return (stats.plateAppearances || stats.atBats || 0) >= MIN_PA;
}
function fixLeaderOrder(category, leaders) {
  if (!REVERSE_SORT_CATS.has(category)) return leaders;
  const sorted = [...leaders].sort((a, b) => parseFloat(b.value) - parseFloat(a.value));
  return sorted.map((l, i) => ({ ...l, rank: i + 1 }));
}

const LEADER_CATS = [
  { key: 'battingAverage', label: 'AVG', group: 'hitting', type: 'traditional' },
  { key: 'homeRuns', label: 'HR', group: 'hitting', type: 'traditional' },
  { key: 'runsBattedIn', label: 'RBI', group: 'hitting', type: 'traditional' },
  { key: 'hits', label: 'H', group: 'hitting', type: 'traditional' },
  { key: 'runs', label: 'R', group: 'hitting', type: 'traditional' },
  { key: 'stolenBases', label: 'SB', group: 'hitting', type: 'traditional' },
  { key: 'walks', label: 'BB', group: 'hitting', type: 'traditional' },
  { key: 'strikeouts', label: 'SO', group: 'hitting', type: 'traditional' },
  { key: 'onBasePercentage', label: 'OBP', group: 'hitting', type: 'traditional' },
  { key: 'sluggingPercentage', label: 'SLG', group: 'hitting', type: 'traditional' },
  { key: 'onBasePlusSlugging', label: 'OPS', group: 'hitting', type: 'traditional' },
  { key: 'earnedRunAverage', label: 'ERA', group: 'pitching', type: 'traditional' },
  { key: 'walksAndHitsPerInningPitched', label: 'WHIP', group: 'pitching', type: 'traditional' },
  { key: 'wins', label: 'W', group: 'pitching', type: 'traditional' },
  { key: 'losses', label: 'L', group: 'pitching', type: 'traditional' },
  { key: 'saves', label: 'SV', group: 'pitching', type: 'traditional' },
  { key: 'blownSaves', label: 'BS', group: 'pitching', type: 'traditional' },
  { key: 'holds', label: 'HLD', group: 'pitching', type: 'traditional' },
  { key: 'strikeoutsPer9Inn', label: 'K/9', group: 'pitching', type: 'traditional' },
  { key: 'walksPer9Inn', label: 'BB/9', group: 'pitching', type: 'traditional' },
  { key: 'inningsPitched', label: 'IP', group: 'pitching', type: 'traditional' },
  { key: 'strikeoutWalkRatio', label: 'K/BB', group: 'pitching', type: 'traditional' },
  { key: 'homeRunsPer9', label: 'HR/9', group: 'pitching', type: 'traditional' },
];
const LEADER_LABEL_MAP = Object.fromEntries(LEADER_CATS.map((c) => [c.key, c]));
const LEADER_SORT_ORDER = Object.fromEntries(LEADER_CATS.map((c, i) => [c.key, i]));

async function handleLeaders(req, res) {
  const { teamId } = req.query;
  if (!teamId) return res.status(400).json({ error: 'teamId required' });

  const cacheKey = `leaders-${teamId}`;
  const leaders = await leadersCache.getOrFetch(cacheKey, async () => {
    const season = new Date().getFullYear();
    const cats = LEADER_CATS.map((c) => c.key).join(',');
    const hittingCats = LEADER_CATS.filter(c => c.group === 'hitting').map(c => c.key).join(',');
    const pitchingCats = LEADER_CATS.filter(c => c.group === 'pitching').map(c => c.key).join(',');
    let teamUrl = `https://statsapi.mlb.com/api/v1/teams/${teamId}/leaders?leaderCategories=${cats}&season=${season}&limit=5`;
    let lhUrl = `https://statsapi.mlb.com/api/v1/stats/leaders?leaderCategories=${hittingCats}&season=${season}&sportId=1&limit=50&statGroup=hitting`;
    let lpUrl = `https://statsapi.mlb.com/api/v1/stats/leaders?leaderCategories=${pitchingCats}&season=${season}&sportId=1&limit=50&statGroup=pitching`;

    let [teamResp, lhResp, lpResp] = await Promise.all([fetch(teamUrl), fetch(lhUrl), fetch(lpUrl)]);
    let [data, lhData, lpData] = await Promise.all([teamResp.json(), lhResp.json(), lpResp.json()]);

    if (!data.teamLeaders?.length) {
      const prevTeamUrl = `https://statsapi.mlb.com/api/v1/teams/${teamId}/leaders?leaderCategories=${cats}&season=${season - 1}&limit=5`;
      lhUrl = `https://statsapi.mlb.com/api/v1/stats/leaders?leaderCategories=${hittingCats}&season=${season - 1}&sportId=1&limit=50&statGroup=hitting`;
      lpUrl = `https://statsapi.mlb.com/api/v1/stats/leaders?leaderCategories=${pitchingCats}&season=${season - 1}&sportId=1&limit=50&statGroup=pitching`;
      [teamResp, lhResp, lpResp] = await Promise.all([fetch(prevTeamUrl), fetch(lhUrl), fetch(lpUrl)]);
      [data, lhData, lpData] = await Promise.all([teamResp.json(), lhResp.json(), lpResp.json()]);
    }

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
        return LEADER_LABEL_MAP[cat.leaderCategory] !== undefined;
      })
      .map((cat) => {
        const meta = LEADER_LABEL_MAP[cat.leaderCategory];
        const catRanks = leagueRankMap[cat.leaderCategory] || {};
        return {
          category: cat.leaderCategory,
          label: meta.label,
          group: meta.group,
          type: meta.type,
          leaders: fixLeaderOrder(cat.leaderCategory, (cat.leaders || []).map((l) => ({
            rank: l.rank,
            name: l.person?.fullName,
            playerId: l.person?.id,
            value: l.value,
            leagueRank: catRanks[l.person?.id] || null,
          }))),
        };
      })
      .sort((a, b) => (LEADER_SORT_ORDER[a.category] ?? 99) - (LEADER_SORT_ORDER[b.category] ?? 99));
  }, 3600);

  res.json(leaders);
}

// --- League Leaders ---
async function handleLeagueLeaders(req, res) {
  const cacheKey = 'league-leaders';
  const leaders = await leadersCache.getOrFetch(cacheKey, async () => {
    const season = new Date().getFullYear();
    const hittingCats = LEADER_CATS.filter(c => c.group === 'hitting').map(c => c.key).join(',');
    const pitchingCats = LEADER_CATS.filter(c => c.group === 'pitching').map(c => c.key).join(',');

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
        return LEADER_LABEL_MAP[cat.leaderCategory] !== undefined;
      })
      .map((cat) => {
        const meta = LEADER_LABEL_MAP[cat.leaderCategory];
        const isPitching = meta.group === 'pitching';
        const isCounting = COUNTING_STATS.has(cat.leaderCategory);
        const filtered = isCounting
          ? (cat.leaders || [])
          : (cat.leaders || []).filter((l) => meetsMinimum(l, isPitching));
        return {
          category: cat.leaderCategory,
          label: meta.label,
          group: meta.group,
          type: meta.type,
          leaders: fixLeaderOrder(cat.leaderCategory, filtered.slice(0, 10).map((l, i) => ({
            rank: i + 1,
            name: l.person?.fullName,
            playerId: l.person?.id,
            team: l.team?.name || l.person?.currentTeam?.name || l.person?.team?.name || '',
            teamAbbr: TEAM_ABBR[l.team?.id] || l.team?.abbreviation || l.person?.currentTeam?.abbreviation || '',
            value: l.value,
          }))),
        };
      })
      .sort((a, b) => (LEADER_SORT_ORDER[a.category] ?? 99) - (LEADER_SORT_ORDER[b.category] ?? 99));
  }, 3600);

  res.json(leaders);
}

// --- Highlights ---
async function handleHighlights(req, res) {
  const { gamePk } = req.query;
  if (!gamePk) return res.status(400).json({ error: 'gamePk required' });

  const cacheKey = `highlights-${gamePk}`;
  const highlights = await highlightsCache.getOrFetch(cacheKey, async () => {
    const url = `https://statsapi.mlb.com/api/v1/game/${gamePk}/content`;
    const resp = await fetch(url);
    const data = await resp.json();

    const items = data.highlights?.highlights?.items || [];
    return items
      .filter((item) => item.type === 'video')
      .slice(0, 10)
      .map((item) => {
        const mp4 = item.playbacks?.find(
          (p) => p.name === 'mp4Avc' || p.name?.includes('mp4')
        );
        const thumb =
          item.image?.cuts?.find((c) => c.width >= 300 && c.width <= 640) ||
          item.image?.cuts?.[0];

        return {
          id: item.id,
          title: item.title || item.headline || '',
          description: item.blurb || item.description || '',
          duration: item.duration,
          thumbnail: thumb?.src || null,
          videoUrl: mp4?.url || null,
        };
      })
      .filter((h) => h.videoUrl || h.thumbnail);
  }, 3600);

  res.json(highlights);
}

// --- Scoreboard ---
const scoreboardCache = createCache(30, 15);

async function handleScoreboard(req, res) {
  const dateParam = req.query.date;
  const today = dateParam || new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
  const cacheKey = `scoreboard-${today}`;
  const result = await scoreboardCache.getOrFetch(cacheKey, async () => {
    const url = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${today}&hydrate=linescore,decisions,probablePitcher,team`;
    const resp = await fetch(url);
    const data = await resp.json();

    const games = (data.dates || []).flatMap((d) => d.games || []);

    return games.map((g) => {
      const status = g.status || {};
      const ls = g.linescore || {};
      return {
        gamePk: g.gamePk,
        gameDate: g.gameDate,
        state: status.abstractGameState,
        detailedState: status.detailedState,
        inning: ls.currentInning || null,
        inningHalf: ls.inningHalf || null,
        away: {
          id: g.teams?.away?.team?.id,
          name: g.teams?.away?.team?.name,
          abbr: g.teams?.away?.team?.abbreviation,
          wins: g.teams?.away?.leagueRecord?.wins,
          losses: g.teams?.away?.leagueRecord?.losses,
          score: ls.teams?.away?.runs ?? (status.abstractGameState === 'Final' ? g.teams?.away?.score : null),
          probablePitcher: g.teams?.away?.probablePitcher
            ? { id: g.teams.away.probablePitcher.id, name: g.teams.away.probablePitcher.fullName }
            : null,
        },
        home: {
          id: g.teams?.home?.team?.id,
          name: g.teams?.home?.team?.name,
          abbr: g.teams?.home?.team?.abbreviation,
          wins: g.teams?.home?.leagueRecord?.wins,
          losses: g.teams?.home?.leagueRecord?.losses,
          score: ls.teams?.home?.runs ?? (status.abstractGameState === 'Final' ? g.teams?.home?.score : null),
          probablePitcher: g.teams?.home?.probablePitcher
            ? { id: g.teams.home.probablePitcher.id, name: g.teams.home.probablePitcher.fullName }
            : null,
        },
        decisions: g.decisions
          ? {
              winner: g.decisions.winner ? { id: g.decisions.winner.id, name: g.decisions.winner.fullName } : null,
              loser: g.decisions.loser ? { id: g.decisions.loser.id, name: g.decisions.loser.fullName } : null,
              save: g.decisions.save ? { id: g.decisions.save.id, name: g.decisions.save.fullName } : null,
            }
          : null,
        innings: (ls.innings || []).map((inn) => ({
          num: inn.num,
          away: inn.away?.runs ?? null,
          home: inn.home?.runs ?? null,
        })),
      };
    });
  }, (result) => result.some((g) => g.state === 'Live') ? 30 : 120);
  res.json(result);
}

// --- Batter vs Pitcher ---
const bvpCache = createCache(3600, 120);

async function handleBvp(req, res) {
  const { batterId, pitcherId } = req.query;
  if (!batterId || !pitcherId) {
    return res.status(400).json({ error: 'batterId and pitcherId required' });
  }

  const cacheKey = `bvp-${batterId}-${pitcherId}`;
  const result = await bvpCache.getOrFetch(cacheKey, async () => {
    const url = `https://statsapi.mlb.com/api/v1/people/${batterId}/stats?stats=vsPlayer&opposingPlayerId=${pitcherId}&group=hitting`;
    const resp = await fetch(url);
    const data = await resp.json();

    const splits = data.stats?.[0]?.splits || [];
    const career = splits[0]?.stat || null;

    if (!career) return { atBats: 0 };

    return {
      atBats: career.atBats ?? 0,
      hits: career.hits ?? 0,
      avg: career.avg ?? '-',
      hr: career.homeRuns ?? 0,
      rbi: career.rbi ?? 0,
      bb: career.baseOnBalls ?? 0,
      k: career.strikeOuts ?? 0,
    };
  }, 3600);

  res.json(result);
}

// --- Analytics ---
const analyticsCache = createCache(900, 120);
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
    result.fip = ip > 0 ? (((13 * hr) + (3 * (bb + hbp)) - (2 * k)) / ip + C_FIP).toFixed(2) : null;
    result.kPct = bf > 0 ? ((k / bf) * 100).toFixed(1) : null;
    result.bbPct = bf > 0 ? ((bb / bf) * 100).toFixed(1) : null;
    const sf = stat.sacFlies ?? 0;
    const denom = bf - k - hr + sf;
    result.babip = denom > 0 ? ((h - hr) / denom).toFixed(3) : null;
    result.hr9 = ip > 0 ? ((hr * 9) / ip).toFixed(2) : null;
    result.kBBPct = bf > 0 ? (((k - bb) / bf) * 100).toFixed(1) : null;
    result.era = stat.era ?? null;
    result.whip = stat.whip ?? null;
    result.k = k; result.bb = bb; result.ip = stat.inningsPitched;
    result.wins = stat.wins ?? 0; result.losses = stat.losses ?? 0;
  } else {
    const ab = stat.atBats ?? 0;
    const h = stat.hits ?? 0;
    const hr = stat.homeRuns ?? 0;
    const bb = stat.baseOnBalls ?? 0;
    const hbp = stat.hitByPitch ?? 0;
    const sf = stat.sacFlies ?? 0;
    const k = stat.strikeOuts ?? 0;
    const pa = stat.plateAppearances ?? (ab + bb + hbp + sf);
    const slg = parseFloat(stat.slg) || 0;
    const avg = parseFloat(stat.avg) || 0;
    result.iso = (slg - avg).toFixed(3);
    result.kPct = pa > 0 ? ((k / pa) * 100).toFixed(1) : null;
    result.bbPct = pa > 0 ? ((bb / pa) * 100).toFixed(1) : null;
    const denom = ab - k - hr + sf;
    result.babip = denom > 0 ? ((h - hr) / denom).toFixed(3) : null;
    const ubb = bb - (stat.intentionalWalks ?? 0);
    const singles = h - (stat.doubles ?? 0) - (stat.triples ?? 0) - hr;
    const woba_num = 0.69*ubb + 0.72*hbp + 0.88*singles + 1.24*(stat.doubles??0) + 1.56*(stat.triples??0) + 2.01*hr;
    const woba_denom = ab + bb - (stat.intentionalWalks??0) + sf + hbp;
    result.woba = woba_denom > 0 ? (woba_num / woba_denom).toFixed(3) : null;
    result.avg = stat.avg ?? null; result.obp = stat.obp ?? null;
    result.slg = stat.slg ?? null; result.ops = stat.ops ?? null;
    result.hr = hr; result.sb = stat.stolenBases ?? 0;
    result.rbi = stat.rbi ?? 0; result.runs = stat.runs ?? 0;
  }
  return result;
}

function abbrevNameAnalytics(fullName) {
  if (!fullName) return '';
  const parts = fullName.split(' ');
  return parts.length < 2 ? fullName : `${parts[0][0]}. ${parts.slice(1).join(' ')}`;
}

function ordinalRankAnalytics(n) {
  if (!n) return null;
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function advRankAnalytics(allAdv, teamId, field, lowerIsBetter) {
  const valid = allAdv.filter((t) => t[field] != null);
  const sorted = [...valid].sort((a, b) => {
    const va = parseFloat(a[field]) || 0;
    const vb = parseFloat(b[field]) || 0;
    return lowerIsBetter ? va - vb : vb - va;
  });
  const idx = sorted.findIndex((t) => String(t.teamId) === String(teamId));
  return idx >= 0 ? ordinalRankAnalytics(idx + 1) : null;
}

async function handleAnalytics(req, res) {
  const teamId = req.query.teamId || 147;
  const leagueId = req.query.leagueId || 103;
  const cacheKey = `analytics-${teamId}-${leagueId}`;
  const result = await analyticsCache.getOrFetch(cacheKey, async () => {
    let season = new Date().getFullYear();
    async function fetchData(s) {
      return Promise.all([
        fetch(`https://statsapi.mlb.com/api/v1/teams/${teamId}/stats?stats=season&group=hitting&season=${s}`).then(r=>r.json()),
        fetch(`https://statsapi.mlb.com/api/v1/teams/${teamId}/stats?stats=season&group=pitching&season=${s}`).then(r=>r.json()),
        fetch(`https://statsapi.mlb.com/api/v1/stats?stats=season&group=hitting&season=${s}&teamId=${teamId}&playerPool=All&sportId=1`).then(r=>r.json()),
        fetch(`https://statsapi.mlb.com/api/v1/stats?stats=season&group=pitching&season=${s}&teamId=${teamId}&playerPool=All&sportId=1`).then(r=>r.json()),
        fetch(`https://statsapi.mlb.com/api/v1/teams/stats?stats=season&group=hitting&season=${s}&leagueIds=${leagueId}&sportId=1`).then(r=>r.json()),
        fetch(`https://statsapi.mlb.com/api/v1/teams/stats?stats=season&group=pitching&season=${s}&leagueIds=${leagueId}&sportId=1`).then(r=>r.json()),
      ]);
    }
    let [hD, pD, phD, ppD, ahD, apD] = await fetchData(season);
    if (!hD.stats?.length) { season--; [hD, pD, phD, ppD, ahD, apD] = await fetchData(season); }
    const teamHitting = hD.stats?.[0]?.splits?.[0]?.stat || {};
    const teamPitching = pD.stats?.[0]?.splits?.[0]?.stat || {};

    const allHitAdv = (ahD.stats?.[0]?.splits || []).map(s => ({ teamId: s.team?.id, ...computeAdvanced(s.stat || {}, false) }));
    const allPitAdv = (apD.stats?.[0]?.splits || []).map(s => ({ teamId: s.team?.id, ...computeAdvanced(s.stat || {}, true) }));

    const hittingRanks = allHitAdv.length > 0 ? {
      woba: advRankAnalytics(allHitAdv, teamId, 'woba', false),
      iso: advRankAnalytics(allHitAdv, teamId, 'iso', false),
      babip: advRankAnalytics(allHitAdv, teamId, 'babip', false),
      kPct: advRankAnalytics(allHitAdv, teamId, 'kPct', true),
      bbPct: advRankAnalytics(allHitAdv, teamId, 'bbPct', false),
      sb: advRankAnalytics(allHitAdv, teamId, 'sb', false),
    } : null;

    const pitchingRanks = allPitAdv.length > 0 ? {
      fip: advRankAnalytics(allPitAdv, teamId, 'fip', true),
      babip: advRankAnalytics(allPitAdv, teamId, 'babip', true),
      kPct: advRankAnalytics(allPitAdv, teamId, 'kPct', false),
      bbPct: advRankAnalytics(allPitAdv, teamId, 'bbPct', true),
      kBBPct: advRankAnalytics(allPitAdv, teamId, 'kBBPct', false),
      hr9: advRankAnalytics(allPitAdv, teamId, 'hr9', true),
    } : null;

    const batters = (phD.stats?.[0]?.splits || [])
      .filter(s => (s.stat?.plateAppearances || s.stat?.atBats || 0) >= 20)
      .map(s => ({ name: abbrevNameAnalytics(s.player?.fullName), playerId: s.player?.id, ...computeAdvanced(s.stat, false) }))
      .sort((a, b) => parseFloat(b.woba || 0) - parseFloat(a.woba || 0));
    const pitchers = (ppD.stats?.[0]?.splits || [])
      .filter(s => parseFloat(s.stat?.inningsPitched || 0) >= 10)
      .map(s => ({ name: abbrevNameAnalytics(s.player?.fullName), playerId: s.player?.id, ...computeAdvanced(s.stat, true) }))
      .sort((a, b) => parseFloat(a.fip || 99) - parseFloat(b.fip || 99));
    return { teamHitting: computeAdvanced(teamHitting, false), teamPitching: computeAdvanced(teamPitching, true), hittingRanks, pitchingRanks, batters, pitchers };
  }, 900);
  res.json(result);
}

// --- Situational ---
const situationalCache = createCache(1800, 120);
const SIT_CODES = [
  { code: 'risp', label: 'RISP' },
  { code: 'r123', label: 'Bases Loaded' },
  { code: 'ron', label: 'Men On' },
  { code: 'r0', label: 'Bases Empty' },
  { code: 'vl', label: 'vs LHP' },
  { code: 'vr', label: 'vs RHP' },
];

async function handleSituational(req, res) {
  const teamId = req.query.teamId || 147;
  const cacheKey = `situational-${teamId}`;
  const result = await situationalCache.getOrFetch(cacheKey, async () => {
    const season = new Date().getFullYear();
    const fetches = SIT_CODES.map(async (sit) => {
      const url = `https://statsapi.mlb.com/api/v1/teams/${teamId}/stats?stats=statSplits&group=hitting&season=${season}&sitCodes=${sit.code}`;
      const resp = await fetch(url);
      const data = await resp.json();
      const stat = data.stats?.[0]?.splits?.[0]?.stat || null;
      return {
        code: sit.code, label: sit.label,
        stat: stat ? { avg: stat.avg??'-', obp: stat.obp??'-', slg: stat.slg??'-', ops: stat.ops??'-',
          hr: stat.homeRuns??0, rbi: stat.rbi??0, hits: stat.hits??0, ab: stat.atBats??0,
          bb: stat.baseOnBalls??0, k: stat.strikeOuts??0 } : null,
      };
    });
    return Promise.all(fetches);
  }, 1800);
  res.json(result);
}

// --- Router ---
const handlers = {
  player: handlePlayer,
  transactions: handleTransactions,
  matchup: handleMatchup,
  leaders: handleLeaders,
  'league-leaders': handleLeagueLeaders,
  highlights: handleHighlights,
  scoreboard: handleScoreboard,
  bvp: handleBvp,
  analytics: handleAnalytics,
  situational: handleSituational,
};

export default async function handler(req, res) {
  try {
    const route = req.query.route;
    const fn = handlers[route];
    if (!fn) return res.status(404).json({ error: `Unknown route: ${route}` });
    await fn(req, res);
  } catch (err) {
    console.error('Extra API error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
}
