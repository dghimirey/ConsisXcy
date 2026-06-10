import { getSql } from './db.js';

async function addSets() {
  const sql = getSql();
  console.log("Adding sets column to Routine table...");
  try {
    await sql`
      ALTER TABLE "Routine" ADD COLUMN IF NOT EXISTS "sets" INTEGER NOT NULL DEFAULT 1;
    `;
    console.log("sets column added.");
  } catch (e) {
    console.error("Error:", e);
  }
  process.exit(0);
}

addSets();
