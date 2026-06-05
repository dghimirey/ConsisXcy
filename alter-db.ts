import { getSql } from './db.js';

async function alterTable() {
  const sql = getSql();
  console.log("Altering DB for Categories...");
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS "Category" (
        id UUID PRIMARY KEY,
        name TEXT UNIQUE,
        "createdAt" TIMESTAMP DEFAULT NOW()
      )
    `;
    
    const existing = await sql`SELECT DISTINCT category FROM "Routine" WHERE category IS NOT NULL`;
    for (const row of existing) {
        if (row.category) {
            await sql`
                INSERT INTO "Category" (id, name, "createdAt") 
                VALUES (gen_random_uuid(), ${row.category}, NOW())
                ON CONFLICT (name) DO NOTHING
            `;
        }
    }
    console.log("Category table added and populated.");
  } catch (e) {
    console.error("Error:", e);
  }
  process.exit(0);
}

alterTable();
