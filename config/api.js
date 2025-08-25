// API Provider Configuration
export const API_CONFIG = {
  // Current provider: 'mock', 'sportradar', 'football-data', 'api-football'
  provider: process.env.API_PROVIDER || 'mock',
  
  sportradar: {
    baseURL: process.env.SPORTRADAR_BASE_URL || 'https://api.sportradar.us/soccer/trial/v4/en',
    apiKey: process.env.API_FOOTBALL_KEY, // Using existing variable for now
    timeout: 10000
  },
  
  footballData: {
    baseURL: 'https://api.football-data.org/v4',
    apiKey: process.env.FOOTBALL_DATA_TOKEN,
    timeout: 10000
  },
  
  apiFootball: {
    baseURL: 'https://v3.football.api-sports.io',
    apiKey: process.env.API_FOOTBALL_KEY,
    timeout: 10000
  }
};

// Provider-specific endpoint mappings
export const ENDPOINTS = {
  sportradar: {
    competitions: '/competitions.json',
    fixtures: (competitionId) => `/competitions/${competitionId}/fixtures.json`,
    info: '/info.json'
  },
  
  footballData: {
    competitions: '/competitions',
    fixtures: '/competitions/PL/matches',
    info: '/competitions'
  },
  
  apiFootball: {
    competitions: '/leagues',
    fixtures: '/fixtures',
    info: '/status'
  }
};

export default API_CONFIG;
