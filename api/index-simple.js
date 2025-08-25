import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { predictProbs } from '../services/model/dixon_coles.js';
import axios from 'axios';

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });

// The Sports DB API client (FREE, no auth required!)
const sportsDB = axios.create({
  baseURL: 'https://www.thesportsdb.com/api/v1/json/3',
  timeout: 10000
});

// Simple leagues configuration  
const LEAGUES = {
  'premier-league': { id: '4328', name: 'English Premier League', country: 'England', season: '2025-2026' },
  'la-liga': { id: '4335', name: 'Spanish La Liga', country: 'Spain', season: '2025-2026' },
  'bundesliga': { id: '4331', name: 'German Bundesliga', country: 'Germany', season: '2025-2026' },
  'serie-a': { id: '4332', name: 'Italian Serie A', country: 'Italy', season: '2025-2026' },
  'ligue-1': { id: '4334', name: 'French Ligue 1', country: 'France', season: '2025-2026' }
};

// Cache for live data
let fixturesCache = {};
let cacheTimestamp = 0;
const CACHE_DURATION = 10 * 60 * 1000;

async function fetchLiveFixtures(leagueKey = 'premier-league') {
  const league = LEAGUES[leagueKey];
  if (!league) throw new Error(`League '${leagueKey}' not supported`);

  try {
    app.log.info(`🔄 Fetching ${league.name} fixtures...`);
    const response = await sportsDB.get(`/eventsseason.php?id=${league.id}&s=${league.season}`);
    
    const fixtures = response.data.events
      ?.filter(event => new Date(event.dateEvent + 'T' + (event.strTime || '15:00:00')) > new Date())
      .slice(0, 20)
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

    app.log.info(`✅ Loaded ${fixtures.length} fixtures for ${league.name}`);
    return fixtures;
  } catch (error) {
    app.log.error(`❌ Failed to fetch ${league.name} fixtures:`, error.message);
    return [];
  }
}

app.get('/health', async () => ({ ok: true }));

// Get available leagues
app.get('/leagues', async () => {
  const leagues = Object.entries(LEAGUES).map(([key, league]) => ({
    key, ...league
  }));
  return { leagues, total: leagues.length };
});

// Get fixtures - supports both /fixtures and /fixtures/league-name
app.get('/fixtures/:league', async (req, reply) => {
  const leagueKey = req.params.league;
  const fixtures = await fetchLiveFixtures(leagueKey);
  return {
    league: LEAGUES[leagueKey]?.name,
    league_key: leagueKey,
    fixtures,
    total: fixtures.length
  };
});

// Default to Premier League
app.get('/fixtures', async () => {
  const fixtures = await fetchLiveFixtures('premier-league');
  return fixtures;
});

// Test API
app.get('/test-api', async () => {
  try {
    const response = await sportsDB.get('/lookupleague.php?id=4328');
    return {
      status: 'success',
      api_response: response.data.leagues?.[0],
      message: 'The Sports DB API working!'
    };
  } catch (error) {
    return { status: 'failed', error: error.message };
  }
});

// Predictions
app.get('/predict', async (req, reply) => {
  const { fixture_id, league = 'premier-league' } = req.query;
  if (!fixture_id) return reply.code(400).send({ error: 'fixture_id required' });
  
  const fixtures = await fetchLiveFixtures(league);
  const fixture = fixtures.find(f => f.id == fixture_id);
  if (!fixture) return reply.code(404).send({ error: 'Fixture not found' });
  
  const prediction = predictProbs({ lambdaHome: 1.5, lambdaAway: 1.2 });
  return { fixture_id, ...fixture, ...prediction, generated_at: new Date().toISOString() };
});

const port = process.env.PORT || 3001;

app.listen({ port, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  app.log.info(`🚀 Multi-League Football API running at ${address}`);
  app.log.info(`⚽ Supporting ${Object.keys(LEAGUES).length} leagues with The Sports DB`);
  
  fetchLiveFixtures('premier-league').then(fixtures => {
    app.log.info(`📊 Pre-loaded ${fixtures.length} Premier League fixtures`);
  });
});
