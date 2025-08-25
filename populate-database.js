import pkg from 'pg';
const { Pool } = pkg;
import 'dotenv/config';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const API_KEY = process.env.API_FOOTBALL_KEY;
const API_BASE = 'https://v3.football.api-sports.io';

async function fetchFromAPI(endpoint) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'X-RapidAPI-Key': API_KEY,
      'X-RapidAPI-Host': 'v3.football.api-sports.io'
    }
  });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }
  
  const data = await response.json();
  return data.response;
}

async function populateTeams() {
  console.log('🔄 Fetching teams from Premier League...');
  
  try {
    // Get Premier League teams (league ID 39, season 2024)
    const teams = await fetchFromAPI('/teams?league=39&season=2024');
    
    console.log(`📥 Found ${teams.length} teams`);
    
    for (const teamData of teams) {
      const team = teamData.team;
      await pool.query(
        'INSERT INTO teams (id, name, logo, founded, country) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING',
        [team.id, team.name, team.logo, team.founded, team.country]
      );
    }
    
    console.log('✅ Teams populated successfully');
  } catch (error) {
    console.error('❌ Error populating teams:', error.message);
  }
}

async function populateFixtures() {
  console.log('🔄 Fetching fixtures from Premier League...');
  
  try {
    // Get current season fixtures
    const fixtures = await fetchFromAPI('/fixtures?league=39&season=2024&next=20');
    
    console.log(`📥 Found ${fixtures.length} fixtures`);
    
    for (const fixture of fixtures) {
      await pool.query(`
        INSERT INTO fixtures (id, date, status, home_team_id, away_team_id, home_goals, away_goals, league_id, season) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
        ON CONFLICT (id) DO NOTHING
      `, [
        fixture.fixture.id,
        fixture.fixture.date,
        fixture.fixture.status.short,
        fixture.teams.home.id,
        fixture.teams.away.id,
        fixture.goals.home,
        fixture.goals.away,
        fixture.league.id,
        fixture.league.season
      ]);
    }
    
    console.log('✅ Fixtures populated successfully');
  } catch (error) {
    console.error('❌ Error populating fixtures:', error.message);
  }
}

async function main() {
  try {
    await populateTeams();
    await populateFixtures();
    
    // Check results
    const teamsCount = await pool.query('SELECT COUNT(*) FROM teams');
    const fixturesCount = await pool.query('SELECT COUNT(*) FROM fixtures');
    
    console.log(`\n📊 Final counts:`);
    console.log(`   Teams: ${teamsCount.rows[0].count}`);
    console.log(`   Fixtures: ${fixturesCount.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

main();