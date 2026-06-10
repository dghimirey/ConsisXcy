import { getSql } from './db.js';

async function addIcon() {
  const sql = getSql();
  console.log("Adding icon column to Routine table...");
  try {
    await sql`
      ALTER TABLE "Routine" ADD COLUMN IF NOT EXISTS "icon" TEXT NULL;
    `;
    console.log("icon column added.");
  } catch (e) {
    console.error("Error:", e);
  }
  process.exit(0);
}

addIcon();
