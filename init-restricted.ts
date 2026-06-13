import { getSql } from './db.js';

async function init() {
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS "RestrictedTask" (
      id UUID PRIMARY KEY,
      name TEXT,
      icon TEXT,
      "isActive" BOOLEAN DEFAULT true,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS "RestrictedCompletion" (
      id UUID PRIMARY KEY,
      "taskId" UUID,
      date TIMESTAMP,
      status TEXT,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW(),
      UNIQUE("taskId", date)
    )
  `;
  console.log("Restricted tables created.");
  process.exit(0);
}

init().catch(console.error);
