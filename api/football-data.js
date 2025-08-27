const { fetchRecentResults, fetchCurrentStandings, fetchLiveFixtures, LEAGUES } = require('./utils.js');

module.exports = async function handler(req, res) {
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
    const league = req.query.league || 'premier-league';
    
    if (!LEAGUES[league]) {
      return res.status(400).json({ error: `League '${league}' not supported` });
    }

    const [recentResults, standings, fixtures] = await Promise.all([
      fetchRecentResults(league, 10), // Get more historical data for better context
      fetchCurrentStandings(league),
      fetchLiveFixtures(league)
    ]);

    res.status(200).json({
      league: LEAGUES[league]?.name,
      league_key: league,
      current_date: new Date().toISOString().split('T')[0],
      recent_results: recentResults.slice(0, 8), // Last 8 matches
      current_standings: standings, // All teams
      upcoming_fixtures: fixtures.slice(0, 10), // Next 10 fixtures
      last_updated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching football data:', error);
    res.status(500).json({ error: error.message });
  }
};
