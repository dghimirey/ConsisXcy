import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config();
const sql = neon(process.env.DATABASE_URL!);
async function main() {
  await sql`UPDATE "Routine" SET "createdAt" = '2026-06-12 00:00:00Z' WHERE extract(day from "createdAt") IN (5,6,7,8,9,10,11) AND extract(month from "createdAt") = 6`;
  console.log("Updated!");
}
main().catch(console.error);
