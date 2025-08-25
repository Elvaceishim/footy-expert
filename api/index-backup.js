import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { predictProbs } from '../services/model/dixon_coles.js';
import { LEAGUES, LEAGUE_TEAM_STRENGTHS } from '../config/leagues.js';
import axios from 'axios';

const app = Fastify({ logger: tr  app.log.info(`🚀 Footy Prob API running at ${address}`);
  app.log.info(`⚽ Live data enabled with The Sports DB - Supporting ${Object.keys(LEAGUES).length} leagues!`);
  
  // Pre-load Premier League fixtures on startup
  fetchLiveFixtures('premier-league').then(fixtures => {
    app.log.info(`📊 Pre-loaded ${fixtures.length} Premier League fixtures`);
  });
await app.register(cors, { origin: true });

// The Sports DB API client (FREE, no auth required!)
const sportsDB = axios.create({
  baseURL: 'https://www.thesportsdb.com/api/v1/json/3',
  timeout: 10000
});

// Cache for live data (refresh every 10 minutes)
let fixturesCache = {};
let cacheTimestamp = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

async function fetchLiveFixtures(leagueKey = 'premier-league') {
  const now = Date.now();
  
  // Return cached data if still fresh (cache per league)
  const cacheKey = `${leagueKey}_fixtures`;
  if (fixturesCache[cacheKey] && (now - cacheTimestamp) < CACHE_DURATION) {
    return fixturesCache[cacheKey];
  }

  const league = LEAGUES[leagueKey];
  if (!league) {
    throw new Error(`League '${leagueKey}' not supported`);
  }

  try {
    app.log.info(`🔄 Fetching live fixtures from The Sports DB for ${league.name}...`);
    
    // Get fixtures for the specified league
    const response = await sportsDB.get(`/eventsseason.php?id=${league.id}&s=${league.season}`);

    if (!response.data.events) {
      throw new Error(`No events found for ${league.name}`);
    }

    const fixtures = response.data.events
      ?.filter(event => {
        // Only show upcoming matches
        const eventDate = new Date(event.dateEvent + 'T' + (event.strTime || '15:00:00'));
        const now = new Date();
        return eventDate > now;
      })
      .slice(0, 20) // Limit to 20 matches
      .map(event => ({
        id: event.idEvent,
        home_team: event.strHomeTeam,
        away_team: event.strAwayTeam,
        date: event.dateEvent + 'T' + (event.strTime || '15:00:00') + ':00.000Z',
        status: 'NS',
        venue: event.strVenue || 'TBD',
        league: league.name,
        country: league.country
      })) || [];

    // Initialize cache object if needed
    if (!fixturesCache) fixturesCache = {};
    fixturesCache[cacheKey] = fixtures;
    cacheTimestamp = now;
    
    app.log.info(`✅ Loaded ${fixtures.length} live fixtures from The Sports DB for ${league.name}`);
    return fixtures;
    
  } catch (error) {
    app.log.error(`❌ Failed to fetch live fixtures for ${league.name}, using enhanced mock data:`, error.message);
    
    // Enhanced realistic mock data with upcoming dates
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const dayAfter = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    const thirdDay = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const fourthDay = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);
    
    const mockFixtures = [
      { 
        id: 1001, 
        home_team: 'Arsenal', 
        away_team: 'Chelsea', 
        date: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 15, 0).toISOString(), 
        status: 'NS',
        venue: 'Emirates Stadium'
      },
      { 
        id: 1002, 
        home_team: 'Liverpool', 
        away_team: 'Manchester City', 
        date: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 17, 30).toISOString(), 
        status: 'NS',
        venue: 'Anfield'
      },
      { 
        id: 1003, 
        home_team: 'Manchester United', 
        away_team: 'Tottenham', 
        date: new Date(dayAfter.getFullYear(), dayAfter.getMonth(), dayAfter.getDate(), 14, 0).toISOString(), 
        status: 'NS',
        venue: 'Old Trafford'
      },
      { 
        id: 1004, 
        home_team: 'Newcastle', 
        away_team: 'Brighton', 
        date: new Date(dayAfter.getFullYear(), dayAfter.getMonth(), dayAfter.getDate(), 16, 30).toISOString(), 
        status: 'NS',
        venue: 'St. James Park'
      },
      { 
        id: 1005, 
        home_team: 'Aston Villa', 
        away_team: 'West Ham', 
        date: new Date(thirdDay.getFullYear(), thirdDay.getMonth(), thirdDay.getDate(), 19, 0).toISOString(), 
        status: 'NS',
        venue: 'Villa Park'
      },
      { 
        id: 1006, 
        home_team: 'Brentford', 
        away_team: 'Crystal Palace', 
        date: new Date(thirdDay.getFullYear(), thirdDay.getMonth(), thirdDay.getDate(), 20, 0).toISOString(), 
        status: 'NS',
        venue: 'Brentford Community Stadium'
      },
      { 
        id: 1007, 
        home_team: 'Everton', 
        away_team: 'Nottingham Forest', 
        date: new Date(fourthDay.getFullYear(), fourthDay.getMonth(), fourthDay.getDate(), 17, 30).toISOString(), 
        status: 'NS',
        venue: 'Goodison Park'
      },
      { 
        id: 1008, 
        home_team: 'Fulham', 
        away_team: 'Leicester City', 
        date: new Date(fourthDay.getFullYear(), fourthDay.getMonth(), fourthDay.getDate(), 15, 0).toISOString(), 
        status: 'NS',
        venue: 'Craven Cottage'
      }
    ];
    
    // Initialize cache object if needed
    if (!fixturesCache) fixturesCache = {};
    fixturesCache = mockFixtures;
    cacheTimestamp = now;
    
    app.log.info(`📊 Using enhanced mock data: ${mockFixtures.length} fixtures`);
    return mockFixtures;
  }
}

app.get('/health', async () => ({ ok: true }));

// Get available leagues
app.get('/leagues', async (req, reply) => {
  try {
    const leagues = Object.entries(LEAGUES).map(([key, league]) => ({
      key,
      id: league.id,
      name: league.name,
      country: league.country,
      season: league.season
    }));
    
    return {
      leagues,
      total: leagues.length,
      message: 'Available football leagues for predictions'
    };
  } catch (error) {
    app.log.error('Error fetching leagues:', error);
    return reply.code(500).send({ error: 'Failed to fetch leagues' });
  }
});

// Get fixtures for a specific league
app.get('/fixtures/:league?', async (req, reply) => {
  try {
    const leagueKey = req.params.league || 'premier-league';
    const fixtures = await fetchLiveFixtures(leagueKey);
    
    return {
      league: LEAGUES[leagueKey]?.name || 'Premier League',
      fixtures,
      total: fixtures.length
    };
  } catch (error) {
    app.log.error('Error fetching fixtures:', error);
    return reply.code(500).send({ error: 'Failed to fetch fixtures' });
  }
});

app.get('/test-api', async (req, reply) => {
  try {
    app.log.info('🧪 Testing The Sports DB connection...');
    
    // Test with Premier League info endpoint
    const response = await sportsDB.get('/lookupleague.php?id=4328');
    
    return {
      status: 'success',
      api_response: {
        league_name: response.data.leagues?.[0]?.strLeague || 'Unknown',
        country: response.data.leagues?.[0]?.strCountry || 'Unknown',
        current_season: response.data.leagues?.[0]?.strCurrentSeason || 'Unknown'
      },
      api_key_working: true,
      message: 'The Sports DB API - No authentication required!'
    };
  } catch (error) {
    app.log.error('The Sports DB API test failed:', error.response?.data || error.message);
    
    return reply.code(500).send({
      status: 'failed',
      error: error.response?.data || error.message,
      api_key_working: false
    });
  }
});

app.get('/predict', async (req, reply) => {
  const { fixture_id, model = 'v1', league = 'premier-league' } = req.query;
  
  if (!fixture_id) {
    return reply.code(400).send({ error: 'fixture_id required' });
  }
  
  try {
    // Generate live prediction using Dixon-Coles model with league-specific team strengths
    const fixtures = await fetchLiveFixtures(league);
    const fixture = fixtures.find(f => f.id == fixture_id);
    
    if (!fixture) {
      return reply.code(404).send({ error: 'Fixture not found' });
    }
    
    // Get team strengths for the specific league
    const teamStrengths = LEAGUE_TEAM_STRENGTHS[league] || LEAGUE_TEAM_STRENGTHS['premier-league'];
    
    const homeStrength = teamStrengths[fixture.home_team]?.home || 1.4;
    const awayStrength = teamStrengths[fixture.away_team]?.away || 1.1;
    
    const prediction = predictProbs({ 
      lambdaHome: homeStrength, 
      lambdaAway: awayStrength 
    });
    
    return {
      fixture_id: fixture.id,
      home_team: fixture.home_team,
      away_team: fixture.away_team,
      league: fixture.league,
      venue: fixture.venue,
      ...prediction,
      model_used: model,
      generated_at: new Date().toISOString()
    };
    
  } catch (error) {
    app.log.error('Error generating prediction:', error);
    return reply.code(500).send({ error: 'Prediction generation failed' });
  }
});

// Legacy endpoint - redirects to Premier League
app.get('/fixtures', async (req, reply) => {
  return reply.redirect('/fixtures/premier-league');
});

const port = process.env.PORT || 3001;

app.listen({ port, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  app.log.info(`🚀 Footy Prob API running at ${address}`);
  app.log.info(`� Live data enabled with API-Football integration`);
  
  // Pre-load fixtures on startup
  fetchLiveFixtures().then(fixtures => {
    app.log.info(`📊 Pre-loaded ${fixtures.length} fixtures`);
  });
});