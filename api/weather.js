import { createCache } from './_cache.js';

const { getOrFetch } = createCache(1800, 60);

export default async function handler(req, res) {
  try {
    const { lat, lng, venue } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' });

    const cacheKey = `weather-${lat}-${lng}`;
    const result = await getOrFetch(cacheKey, async () => {
      const apiKey = process.env.OPENWEATHER_API_KEY;
      if (!apiKey || apiKey === 'your_key_here') {
        return {
          temp: null,
          feelsLike: null,
          condition: 'No API key configured',
          icon: '01d',
          wind: null,
          humidity: null,
          venue: venue || 'Unknown',
          unavailable: true,
        };
      }

      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=imperial`;
      const resp = await fetch(url);
      const data = await resp.json();

      return {
        temp: Math.round(data.main?.temp),
        feelsLike: Math.round(data.main?.feels_like),
        condition: data.weather?.[0]?.main || 'Unknown',
        description: data.weather?.[0]?.description || '',
        icon: data.weather?.[0]?.icon || '01d',
        wind: Math.round(data.wind?.speed),
        humidity: data.main?.humidity,
        venue: venue || 'Unknown',
      };
    }, 1800);
    res.json(result);
  } catch (err) {
    console.error('Weather error:', err.message);
    res.status(500).json({ error: 'Failed to fetch weather' });
  }
}
