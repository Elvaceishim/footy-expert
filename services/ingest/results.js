import 'dotenv/config';
import { Pool } from 'pg';
import api from './client.js';
import { subDays, formatISO } from 'date-fns';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const day = subDays(new Date(), 1);
  const params = { date: formatISO(day, { representation: 'date' }) };
  const leagues = [{ league: 39, season: 2024 }];

  for (const lg of leagues) {
    const { data } = await api.get('/fixtures', { params: { ...params, league: lg.league, season: lg.season } });
    for (const f of data.response) {
      if (f.fixture.status.short !== 'FT') continue;
      await pool.query(
        `insert into results(fixture_id, home_goals, away_goals, final_whistle_ts)
         values($1,$2,$3,$4)
         on conflict (fixture_id) do update set home_goals=excluded.home_goals, away_goals=excluded.away_goals, final_whistle_ts=excluded.final_whistle_ts`,
        [f.fixture.id, f.goals.home ?? 0, f.goals.away ?? 0, f.fixture.date]
      );
    }
  }
  console.log('✅ Results upserted');
  await pool.end();
}

run().catch(e => { console.error(e); process.exit(1); });
