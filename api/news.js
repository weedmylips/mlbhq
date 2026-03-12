import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 900, checkperiod: 120 });

export default async function handler(req, res) {
  try {
    const teamId = req.query.teamId || 147;
    const cacheKey = `news-${teamId}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const url = `https://dapi.cms.mlbinfra.com/v2/content/en-us/sel-t${teamId}-news-list`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`CMS fetch failed: ${resp.status}`);
    const data = await resp.json();

    const articles = (data.items || []).slice(0, 8).map((item) => ({
      title: item.headline || '',
      summary: item.summary || '',
      link: `https://www.mlb.com/news/${item.slug}`,
      pubDate: item.contentDate || null,
      thumbnail: item.thumbnail?.thumbnailUrl || null,
    })).filter((a) => a.title && a.link);

    const result = { articles };
    cache.set(cacheKey, result, 900);
    res.json(result);
  } catch (err) {
    console.error('News error:', err.message);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
}
