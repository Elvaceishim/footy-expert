import { LEAGUES } from './utils.js';

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
    const leagues = Object.entries(LEAGUES).map(([key, league]) => ({
      key,
      name: league.name,
      country: league.country
    }));
    
    res.status(200).json({ leagues });
  } catch (error) {
    console.error('Error fetching leagues:', error);
    res.status(500).json({ error: error.message });
  }
}
