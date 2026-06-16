import { getSql } from './db.js';

async function addDeadline() {
  const sql = getSql();
  console.log("Adding deadline to Routine...");
  try {
    await sql`
      ALTER TABLE "Routine" ADD COLUMN IF NOT EXISTS "deadline" TEXT NULL;
    `;
    console.log("deadline column added.");
  } catch (e) {
    console.error("Error:", e);
  }
  process.exit(0);
}

addDeadline();
