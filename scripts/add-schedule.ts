import "dotenv/config";
import { neon } from "@neondatabase/serverless";

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  
  try {
    await sql`ALTER TABLE "RestrictedTask" ADD COLUMN IF NOT EXISTS schedule JSONB DEFAULT '[0,1,2,3,4,5,6]'::jsonb`;
    console.log("Successfully added schedule column to RestrictedTask");
  } catch (err) {
    console.error(err);
  }
}

main();
