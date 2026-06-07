import { getSql } from './db.js';

async function run() {
  const sql = getSql();
  try {
     const sections = await sql`SELECT id FROM "Section"`;
     const sectionId = sections[0].id;
     console.log("Section", sectionId);
     const name = "Test Category";
     const scheduleJson = JSON.stringify([0,1]);
     const insert = await sql`
      INSERT INTO "Category" (id, "sectionId", name, schedule, "createdAt")
      VALUES (gen_random_uuid(), ${sectionId}, ${name}, ${scheduleJson}::jsonb, NOW())
      RETURNING *
     `;
     console.log("Insert success", insert);
  } catch(e) {
     console.error("SQL Error", e);
  }
}

run();
