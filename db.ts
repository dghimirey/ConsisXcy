import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

// Ensure the connection string explicitly allows SSL connections
let dbUrl = process.env.DATABASE_URL || '';

if (dbUrl && !dbUrl.includes('sslmode=require')) {
  dbUrl += (dbUrl.includes('?') ? '&' : '?') + 'sslmode=require';
}

// Use neon's over-HTTP routing
export const sql = neon(dbUrl);
