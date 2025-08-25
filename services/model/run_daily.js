import 'dotenv/config';
import { Pool } from 'pg';
import { predictProbs } from './dixon_coles.js';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// TODO: replace with real ratings fetching
function fakeLambdasForFixture(){ return { lambdaHome: 1.4, lambdaAway: 1.1 }; }

async function run(){
  const { rows } = await pool.query(
    `select id from fixtures where utc_date >= now() and utc_date < now() + interval '7 days'`
  );
  for (const r of rows){
    const { lambdaHome, lambdaAway } = fakeLambdasForFixture();
    const probs = predictProbs({ lambdaHome, lambdaAway });
    await pool.query(
      `insert into predictions(fixture_id, model_version, p_home, p_draw, p_away)
       values($1,'v1',$2,$3,$4)
       on conflict (fixture_id, model_version) do update
       set p_home=excluded.p_home, p_draw=excluded.p_draw, p_away=excluded.p_away`,
      [r.id, probs.p_home, probs.p_draw, probs.p_away]
    );
  }
  console.log('✅ Predictions updated');
  await pool.end();
}
run().catch(e => { console.error(e); process.exit(1); });
