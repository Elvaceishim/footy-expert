import { fetchLiveFixtures, LEAGUES } from './utils.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract league from URL path
    const league = req.query.league || 'premier-league';
    
    if (!LEAGUES[league]) {
      return res.status(400).json({ error: `League '${league}' not supported` });
    }

    const fixtures = await fetchLiveFixtures(league);
    
    res.status(200).json({
      league: LEAGUES[league]?.name,
      league_key: league,
      fixtures,
      total: fixtures.length
    });
  } catch (error) {
    console.error('Error fetching fixtures:', error);
    res.status(500).json({ error: error.message });
  }
}
