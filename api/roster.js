import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

export default async function handler(req, res) {
  try {
    const teamId = req.query.teamId || 147;
    const cacheKey = `roster-${teamId}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const url = `https://statsapi.mlb.com/api/v1/teams/${teamId}/roster?rosterType=active&hydrate=person(stats(type=season,group=[hitting,pitching]))`;
    const resp = await fetch(url);
    const data = await resp.json();

    const roster = (data.roster || []).map((entry) => {
      const person = entry.person || {};
      const stats = person.stats || [];
      const hittingStats = stats.find((s) => s.group?.displayName === 'hitting');
      const pitchingStats = stats.find((s) => s.group?.displayName === 'pitching');

      return {
        id: person.id,
        name: person.fullName,
        number: entry.jerseyNumber,
        position: entry.position?.abbreviation,
        positionType: entry.position?.type,
        status: entry.status?.description,
        hitting: hittingStats?.splits?.[0]?.stat || null,
        pitching: pitchingStats?.splits?.[0]?.stat || null,
      };
    });

    const batters = roster.filter(
      (p) => p.positionType !== 'Pitcher' || (p.hitting && !p.pitching)
    );
    const pitchers = roster.filter((p) => p.positionType === 'Pitcher');

    const result = { batters, pitchers, full: roster };
    cache.set(cacheKey, result, 300);
    res.json(result);
  } catch (err) {
    console.error('Roster error:', err.message);
    res.status(500).json({ error: 'Failed to fetch roster' });
  }
}
