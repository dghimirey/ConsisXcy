import { getSql } from './db.js';
async function run() {
  try {
    const sql = getSql();
    const res = await sql`
      SELECT column_name, is_nullable, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Routine';
    `;
    console.log(res);
  } catch(e) { console.error(e); }
}
run();
