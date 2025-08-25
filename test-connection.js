// test-connection.js
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function testConnection() {
  // Use the correct connection format for Supabase
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // This is important for Supabase
  });

  try {
    const client = await pool.connect();
    console.log('✅ Connected successfully!');
    const res = await client.query('SELECT NOW()');
    console.log('Current time:', res.rows[0]);
    client.release();
  } catch (error) {
    console.log('❌ Connection failed:', error.message);
    console.log('Full error:', error);
  } finally {
    await pool.end();
  }
}

testConnection();