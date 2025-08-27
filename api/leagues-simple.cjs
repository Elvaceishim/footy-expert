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
    // Simple hardcoded leagues data for testing
    const leagues = [
      { key: 'premier-league', name: 'English Premier League', country: 'England' },
      { key: 'la-liga', name: 'Spanish La Liga', country: 'Spain' },
      { key: 'bundesliga', name: 'German Bundesliga', country: 'Germany' },
      { key: 'serie-a', name: 'Italian Serie A', country: 'Italy' },
      { key: 'ligue-1', name: 'French Ligue 1', country: 'France' }
    ];

    res.status(200).json({ 
      leagues,
      total: leagues.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching leagues:', error);
    res.status(500).json({ error: error.message });
  }
};
