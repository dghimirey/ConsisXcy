import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config();

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  await sql`DELETE FROM "Completion" WHERE extract(day from date) IN (5, 6, 7, 8, 9, 10, 11)`;
  console.log('Deleted completions');
}
main().catch(console.error);
