import { Router } from 'express';
import { getCached, setCached } from '../cache.js';

const router = Router();

const IL_STATUSES = ['Injured', 'IL', '10-Day', '60-Day', 'Paternity', 'Bereavement', 'Restricted'];

function isInjured(status) {
  if (!status) return false;
  return IL_STATUSES.some((s) => status.includes(s));
}

router.get('/roster', async (req, res) => {
  try {
    const teamId = req.query.teamId || 147;
    const cacheKey = `roster-${teamId}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    const [activeResp, fullResp] = await Promise.all([
      fetch(`https://statsapi.mlb.com/api/v1/teams/${teamId}/roster?rosterType=active&hydrate=person(stats(type=season,group=[hitting,pitching]))`),
      fetch(`https://statsapi.mlb.com/api/v1/teams/${teamId}/roster?rosterType=fullRoster`),
    ]);

    const activeData = await activeResp.json();
    const fullData = await fullResp.json();

    const roster = (activeData.roster || []).map((entry) => {
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

    const injured = (fullData.roster || [])
      .filter((entry) => isInjured(entry.status?.description))
      .map((entry) => ({
        id: entry.person?.id,
        name: entry.person?.fullName,
        number: entry.jerseyNumber,
        position: entry.position?.abbreviation,
        status: entry.status?.description,
      }));

    const batters = roster.filter(
      (p) => p.positionType !== 'Pitcher' || (p.hitting && !p.pitching)
    );
    const pitchers = roster.filter((p) => p.positionType === 'Pitcher');

    const result = { batters, pitchers, full: roster, injured };
    setCached(cacheKey, result, 300);
    res.json(result);
  } catch (err) {
    console.error('Roster error:', err.message);
    res.status(500).json({ error: 'Failed to fetch roster' });
  }
});

export default router;
