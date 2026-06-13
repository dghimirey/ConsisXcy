import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config();
const sql = neon(process.env.DATABASE_URL!);
async function main() {
  const rs = await sql`SELECT id, name, "createdAt" FROM "Routine"`;
  console.log(rs);
}
main().catch(console.error);
