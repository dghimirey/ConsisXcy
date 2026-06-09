import { getSql } from './db.js';

async function run() {
  const sql = getSql();
  console.log("Altering tables for Trash system...");
  try {
    await sql`ALTER TABLE "Section" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP DEFAULT NULL`;
    await sql`ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP DEFAULT NULL`;
    await sql`ALTER TABLE "Routine" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP DEFAULT NULL`;
    console.log("Success");
  } catch(e) {
    console.error(e);
  }
}
run();
