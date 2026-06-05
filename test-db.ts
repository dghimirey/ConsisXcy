import crypto from 'crypto';
import { getSql } from './db.js';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@fitbeat.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password123';

async function test() {
  const sql = getSql();
  await sql`
      CREATE TABLE IF NOT EXISTS "AppUser" (
        id UUID PRIMARY KEY,
        name TEXT,
        email TEXT UNIQUE,
        password TEXT,
        "avatarUrl" TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `;
    const users = await sql`SELECT * FROM "AppUser" WHERE email = ${ADMIN_EMAIL}`;
    if (users.length === 0) {
      const id = crypto.randomUUID();
      await sql`
        INSERT INTO "AppUser" (id, name, email, password)
        VALUES (${id}, 'Admin User', ${ADMIN_EMAIL}, ${ADMIN_PASSWORD})
      `;
      console.log('Inserted admin user');
    } else {
      console.log('Admin user exists');
    }
    const all = await sql`SELECT * FROM "AppUser"`;
    console.log(all);
    process.exit(0);
}
test().catch(e => { console.error(e); process.exit(1); });
