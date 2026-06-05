import { getSql } from './db.js';

async function alterTable() {
  const sql = getSql();
  console.log("Altering DB for Sections and Hierarchy...");
  try {
    // Create Section
    await sql`
      CREATE TABLE IF NOT EXISTS "Section" (
        id UUID PRIMARY KEY,
        name TEXT UNIQUE,
        "createdAt" TIMESTAMP DEFAULT NOW()
      )
    `;

    // Add schedule and sectionId to Category
    await sql`ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "sectionId" UUID REFERENCES "Section"(id) ON DELETE SET NULL`;
    await sql`ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "schedule" JSONB DEFAULT '[0, 1, 2, 3, 4, 5, 6]'`;

    // Create a default Section 'General'
    await sql`
      INSERT INTO "Section" (id, name, "createdAt") 
      VALUES (gen_random_uuid(), 'General', NOW())
      ON CONFLICT (name) DO NOTHING
    `;

    const generalSection = await sql`SELECT id FROM "Section" WHERE name = 'General' LIMIT 1`;
    const genId = generalSection[0].id;

    // Set sectionId for existing categories to General
    await sql`UPDATE "Category" SET "sectionId" = ${genId} WHERE "sectionId" IS NULL`;

    // Add categoryId to Routine
    await sql`ALTER TABLE "Routine" ADD COLUMN IF NOT EXISTS "categoryId" UUID REFERENCES "Category"(id) ON DELETE SET NULL`;

    // Map existing category text to categoryId
    const routines = await sql`SELECT id, category FROM "Routine"`;
    for (const r of routines) {
        if (r.category) {
            const cat = await sql`SELECT id FROM "Category" WHERE name = ${r.category} LIMIT 1`;
            if (cat.length > 0) {
                await sql`UPDATE "Routine" SET "categoryId" = ${cat[0].id} WHERE id = ${r.id}`;
            }
        }
    }

    console.log("Hierarchy tables added and populated.");
  } catch (e) {
    console.error("Error:", e);
  } finally {
    process.exit(0);
  }
}

alterTable();
