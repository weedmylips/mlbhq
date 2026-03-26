import { Router } from 'express';
import { getOrFetch } from '../cache.js';

const router = Router();

router.get('/highlights', async (req, res) => {
  try {
    const { gamePk } = req.query;
    if (!gamePk) return res.status(400).json({ error: 'gamePk required' });

    const cacheKey = `highlights-${gamePk}`;
    const highlights = await getOrFetch(cacheKey, async () => {
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
    }, 60);

    res.json(highlights);
  } catch (err) {
    console.error('Highlights error:', err.message);
    res.status(500).json({ error: 'Failed to fetch highlights' });
  }
});

export default router;
