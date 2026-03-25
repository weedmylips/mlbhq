import { Router } from 'express';
import { getOrFetch } from '../cache.js';

const router = Router();

router.get('/player', async (req, res) => {
  try {
    const { playerId } = req.query;
    if (!playerId) return res.status(400).json({ error: 'playerId required' });

    const cacheKey = `player-${playerId}`;
    const player = await getOrFetch(cacheKey, async () => {
      const url = `https://statsapi.mlb.com/api/v1/people/${playerId}?hydrate=stats(group=[hitting,pitching],type=[season,career]),currentTeam`;
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
