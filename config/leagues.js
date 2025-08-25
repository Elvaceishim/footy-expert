// Football League Configuration for The Sports DB API
export const LEAGUES = {
  // Top European Leagues
  'premier-league': {
    id: '4328',
    name: 'English Premier League',
    country: 'England',
    season: '2025-2026'
  },
  'la-liga': {
    id: '4335',
    name: 'Spanish La Liga',
    country: 'Spain',
    season: '2025-2026'
  },
  'bundesliga': {
    id: '4331',
    name: 'German Bundesliga',
    country: 'Germany',
    season: '2025-2026'
  },
  'serie-a': {
    id: '4332',
    name: 'Italian Serie A',
    country: 'Italy',
    season: '2025-2026'
  },
  'ligue-1': {
    id: '4334',
    name: 'French Ligue 1',
    country: 'France',
    season: '2025-2026'
  },
  'eredivisie': {
    id: '4337',
    name: 'Dutch Eredivisie',
    country: 'Netherlands',
    season: '2025-2026'
  },
  'championship': {
    id: '4329',
    name: 'English Championship',
    country: 'England',
    season: '2025-2026'
  },
  'mls': {
    id: '4346',
    name: 'Major League Soccer',
    country: 'United States',
    season: '2025'
  },
  'champions-league': {
    id: '4480',
    name: 'UEFA Champions League',
    country: 'Europe',
    season: '2025-2026'
  },
  'europa-league': {
    id: '4481',
    name: 'UEFA Europa League',
    country: 'Europe',
    season: '2025-2026'
  }
};

// Team strength mappings by league
export const LEAGUE_TEAM_STRENGTHS = {
  'premier-league': {
    'Arsenal': { home: 1.8, away: 1.5 },
    'Chelsea': { home: 1.6, away: 1.4 },
    'Liverpool': { home: 2.0, away: 1.7 },
    'Manchester City': { home: 2.1, away: 1.8 },
    'Manchester United': { home: 1.5, away: 1.3 },
    'Tottenham': { home: 1.7, away: 1.4 },
    'Newcastle United': { home: 1.4, away: 1.2 },
    'Brighton': { home: 1.3, away: 1.1 },
    'Aston Villa': { home: 1.5, away: 1.2 },
    'West Ham': { home: 1.3, away: 1.0 }
  },
  'la-liga': {
    'Real Madrid': { home: 2.2, away: 1.9 },
    'Barcelona': { home: 2.0, away: 1.7 },
    'Atletico Madrid': { home: 1.8, away: 1.5 },
    'Sevilla': { home: 1.6, away: 1.3 },
    'Real Sociedad': { home: 1.4, away: 1.2 },
    'Villarreal': { home: 1.5, away: 1.2 },
    'Athletic Bilbao': { home: 1.4, away: 1.1 },
    'Valencia': { home: 1.3, away: 1.0 }
  },
  'bundesliga': {
    'Bayern Munich': { home: 2.3, away: 2.0 },
    'Borussia Dortmund': { home: 1.9, away: 1.6 },
    'RB Leipzig': { home: 1.7, away: 1.4 },
    'Bayer Leverkusen': { home: 1.6, away: 1.3 },
    'Eintracht Frankfurt': { home: 1.4, away: 1.2 },
    'Borussia Monchengladbach': { home: 1.3, away: 1.1 }
  },
  'serie-a': {
    'Juventus': { home: 1.9, away: 1.6 },
    'Inter Milan': { home: 1.8, away: 1.5 },
    'AC Milan': { home: 1.7, away: 1.4 },
    'Napoli': { home: 1.6, away: 1.3 },
    'Roma': { home: 1.5, away: 1.2 },
    'Lazio': { home: 1.4, away: 1.2 },
    'Atalanta': { home: 1.5, away: 1.2 }
  }
};

export default LEAGUES;
