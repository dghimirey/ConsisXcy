import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

export const getSql = () => {
    let dbUrl = process.env.DATABASE_URL || '';
    if (!dbUrl) {
        throw new Error("DATABASE_URL environment variable is not configured.");
    }
    if (!dbUrl.includes('sslmode=require')) {
      dbUrl += (dbUrl.includes('?') ? '&' : '?') + 'sslmode=require';
    }
    return neon(dbUrl);
};
