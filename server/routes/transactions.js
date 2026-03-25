import { Router } from 'express';
import { getOrFetch } from '../cache.js';

const router = Router();

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

router.get('/transactions', async (req, res) => {
  try {
    const { teamId } = req.query;
    if (!teamId) return res.status(400).json({ error: 'teamId required' });

    const cacheKey = `transactions-${teamId}`;
    const transactions = await getOrFetch(cacheKey, async () => {
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
        .slice(0, 30);
    }, 1800);

    res.json(transactions);
  } catch (err) {
    console.error('Transactions error:', err.message);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

export default router;
