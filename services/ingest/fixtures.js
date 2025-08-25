import 'dotenv/config';
import { Pool } from 'pg';
import api from './client.js';
import { addDays, formatISO } from 'date-fns';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function upsertTeam(id, name, league, country) {
  await pool.query(
    `insert into teams(id,name,league,country)
     values($1,$2,$3,$4)
     on conflict (id) do update set name=excluded.name, league=excluded.league, country=excluded.country`,
    [id, name, league, country]
  );
}

async function upsertFixture(row) {
  await pool.query(
    `insert into fixtures(id,league,season,utc_date,status,home_team_id,away_team_id)
     values($1,$2,$3,$4,$5,$6,$7)
     on conflict (id) do update set league=excluded.league, season=excluded.season,
       utc_date=excluded.utc_date, status=excluded.status, home_team_id=excluded.home_team_id, away_team_id=excluded.away_team_id`,
    [row.id, row.league, row.season, row.utc_date, row.status, row.home_team_id, row.away_team_id]
  );
}

async function run() {
  const from = new Date();
  const to = addDays(from, 7);
  const params = { from: formatISO(from, { representation: 'date' }), to: formatISO(to, { representation: 'date' }) };

  // Example: EPL league=39 season=2024; add more later
  const leagues = [{ league: 39, season: 2024 }];

  for (const lg of leagues) {
    const { data } = await api.get('/fixtures', { params: { ...params, league: lg.league, season: lg.season } });
    for (const f of data.response) {
      const home = f.teams.home;
      const away = f.teams.away;
      await upsertTeam(home.id, home.name, String(lg.league), f.league.country);
      await upsertTeam(away.id, away.name, String(lg.league), f.league.country);
      await upsertFixture({
        id: f.fixture.id,
        league: String(lg.league),
        season: lg.season,
        utc_date: f.fixture.date,
        status: f.fixture.status.short,
        home_team_id: home.id,
        away_team_id: away.id
      });
    }
  }
  console.log('✅ Fixtures upserted');
  await pool.end();
}

run().catch(e => { console.error(e); process.exit(1); });
