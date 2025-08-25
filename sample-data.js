import pkg from 'pg';
const { Pool } = pkg;
import 'dotenv/config';

console.log('🔄 Starting sample data insertion...');
console.log('📡 Database URL:', process.env.DATABASE_URL ? 'Found' : 'Missing');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000
});

async function addSampleData() {
  try {
    console.log('🔄 Adding sample teams...');
    
    // Add sample teams
    await pool.query(`
      INSERT INTO teams (id, name, logo, founded, country) VALUES 
      (1, 'Manchester United', 'https://example.com/mu.png', 1878, 'England'),
      (2, 'Liverpool', 'https://example.com/lfc.png', 1892, 'England'),
      (3, 'Chelsea', 'https://example.com/chelsea.png', 1905, 'England'),
      (4, 'Arsenal', 'https://example.com/arsenal.png', 1886, 'England')
      ON CONFLICT (id) DO NOTHING
    `);

    console.log('🔄 Adding sample fixtures...');
    
    // Add sample fixtures
    await pool.query(`
      INSERT INTO fixtures (id, date, status, home_team_id, away_team_id, home_goals, away_goals, league_id, season) VALUES 
      (1, '2024-08-25 15:00:00', 'NS', 1, 2, null, null, 39, 2024),
      (2, '2024-08-25 17:30:00', 'NS', 3, 4, null, null, 39, 2024),
      (3, '2024-08-26 14:00:00', 'NS', 1, 3, null, null, 39, 2024)
      ON CONFLICT (id) DO NOTHING
    `);

    console.log('🔄 Adding sample predictions...');
    
    // Add sample predictions
    await pool.query(`
      INSERT INTO predictions (fixture_id, model_version, p_home, p_draw, p_away) VALUES 
      (1, 'v1', 0.45, 0.25, 0.30),
      (2, 'v1', 0.55, 0.20, 0.25),
      (3, 'v1', 0.40, 0.30, 0.30)
      ON CONFLICT (fixture_id, model_version) DO NOTHING
    `);

    console.log('✅ Sample data added successfully');

    // Check results
    const teamsCount = await pool.query('SELECT COUNT(*) FROM teams');
    const fixturesCount = await pool.query('SELECT COUNT(*) FROM fixtures');
    const predictionsCount = await pool.query('SELECT COUNT(*) FROM predictions');
    
    console.log(`\n📊 Final counts:`);
    console.log(`   Teams: ${teamsCount.rows[0].count}`);
    console.log(`   Fixtures: ${fixturesCount.rows[0].count}`);
    console.log(`   Predictions: ${predictionsCount.rows[0].count}`);

  } catch (error) {
    console.error('❌ Error adding sample data:', error.message);
  } finally {
    await pool.end();
  }
}

addSampleData();