import { Router } from 'express';
import { getOrFetch } from '../cache.js';

const router = Router();

router.get('/player', async (req, res) => {
  try {
    const { playerId } = req.query;
    if (!playerId) return res.status(400).json({ error: 'playerId required' });

    const cacheKey = `player-${playerId}`;
    const player = await getOrFetch(cacheKey, async () => {
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

      // Game log: last 15 games
      const hittingGroup = person.primaryPosition?.code === '1' ? 'pitching' : 'hitting';
      const gameLogSplits = findAllSplits(hittingGroup, 'gameLog');
      const gameLog = gameLogSplits.slice(-15).reverse().map((g) => ({
        date: g.date,
        opponent: g.opponent?.abbreviation || g.opponent?.name,
        isHome: g.isHome,
        stat: g.stat,
      }));

      // Platoon splits (vs LHP/RHP)
      const platoonSplits = findAllSplits(hittingGroup, 'leftAndRight');
      const vsLeft = platoonSplits.find((s) => s.split?.code === 'vl')?.stat || null;
      const vsRight = platoonSplits.find((s) => s.split?.code === 'vr')?.stat || null;

      // Home/Away splits
      const haSplits = findAllSplits(hittingGroup, 'homeAndAway');
      const homeStat = haSplits.find((s) => s.split?.code === 'h')?.stat || null;
      const awayStat = haSplits.find((s) => s.split?.code === 'a')?.stat || null;

      // Monthly splits
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
  } catch (err) {
    console.error('Player error:', err.message);
    res.status(500).json({ error: 'Failed to fetch player' });
  }
});

export default router;
