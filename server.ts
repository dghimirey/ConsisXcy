import express from 'express';
import path from 'path';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { getSql } from './db.js';

export const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());
app.use(cookieParser());

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@fitbeat.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password123';

const authenticate = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const token = req.cookies?.token;
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    (req as any).user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }
};

app.post('/api/auth/login', async (req: express.Request, res: express.Response) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    // Ping the Neon database via HTTP to verify the connection is alive
    // This query is wrapped in try/catch as requested to bubble up DB errors directly
    const sql = getSql();
    await sql`SELECT 1 as test_connection`;
    
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '7d' });
      res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'none', maxAge: 7 * 24 * 60 * 60 * 1000 });
      res.json({ success: true });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error: any) {
    console.error('Login route error:', error);
    res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Internal server error while processing login.' : (error.message || 'Error connecting to database') });
  }
});

app.post('/api/auth/logout', (req: express.Request, res: express.Response) => {
  res.clearCookie('token');
  res.json({ success: true });
});

app.get('/api/auth/me', authenticate, (req: express.Request, res: express.Response) => {
  res.json({ user: (req as any).user });
});

app.get('/api/routines', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const sql = getSql();
    const routines = await sql`SELECT * FROM "Routine" ORDER BY "createdAt" DESC`;
    res.json(routines);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/routines', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const sql = getSql();
    const id = crypto.randomUUID();
    const { name, category, description, targetValue, targetUnit, isActive = true, autoImprovement = false } = req.body;
    const routines = await sql`
      INSERT INTO "Routine" (id, name, category, description, "targetValue", "targetUnit", "isActive", "autoImprovement", "createdAt", "updatedAt")
      VALUES (${id}, ${name}, ${category}, ${description || null}, ${targetValue}, ${targetUnit}, ${isActive}, ${autoImprovement}, NOW(), NOW())
      RETURNING *
    `;
    const routine = routines[0];
    const streakId = crypto.randomUUID();
    await sql`
      INSERT INTO "Streak" (id, "routineId", "currentStreak", "longestStreak", "totalCompletedDays", "updatedAt")
      VALUES (${streakId}, ${id}, 0, 0, 0, NOW())
    `;
    res.json(routine);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/routines/:id', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const sql = getSql();
    const { name, category, description, targetValue, targetUnit, isActive, autoImprovement } = req.body;
    const routines = await sql`
      UPDATE "Routine"
      SET name = ${name}, category = ${category}, description = ${description || null},
          "targetValue" = ${targetValue}, "targetUnit" = ${targetUnit}, "isActive" = ${isActive}, "autoImprovement" = ${autoImprovement}, "updatedAt" = NOW()
      WHERE id = ${req.params.id}
      RETURNING *
    `;
    res.json(routines[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/routines/:id', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const sql = getSql();
    await sql`DELETE FROM "Routine" WHERE id = ${req.params.id}`;
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/completions', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const sql = getSql();
    const { routineId, date, status, value, targetValue } = req.body;
    const parsedDate = new Date(date).toISOString(); // Handle proper Postgres dates
    const completionId = crypto.randomUUID();
    
    // upsert completion using ON CONFLICT DO UPDATE
    const completions = await sql`
      INSERT INTO "Completion" (id, "routineId", date, status, value, "targetValue", "createdAt", "updatedAt")
      VALUES (${completionId}, ${routineId}, ${parsedDate}::timestamp, ${status}, ${value || null}, ${targetValue}, NOW(), NOW())
      ON CONFLICT ("routineId", date)
      DO UPDATE SET status = EXCLUDED.status, value = EXCLUDED.value, "targetValue" = EXCLUDED."targetValue", "updatedAt" = NOW()
      RETURNING *
    `;
    const completion = completions[0];

    if (status === 'COMPLETED') {
        const routineResult = await sql`SELECT * FROM "Routine" WHERE id = ${routineId}`;
        const routine = routineResult[0];
        
        if (routine?.autoImprovement) {
            await sql`UPDATE "Routine" SET "targetValue" = ROUND(("targetValue" * 1.01)::numeric, 2) WHERE id = ${routineId}`;
        }
        
        const streakResult = await sql`SELECT * FROM "Streak" WHERE "routineId" = ${routineId}`;
        const streak = streakResult[0];
        if (streak) {
            const today = new Date(parsedDate);
            const isNextDay = streak.lastCompletedDate ? Math.floor((today.getTime() - new Date(streak.lastCompletedDate).getTime()) / (1000 * 3600 * 24)) === 1 : true;
            
            const newCurrent = isNextDay || !streak.lastCompletedDate ? streak.currentStreak + 1 : 1;
            const updatedTotal = streak.totalCompletedDays + 1;

            await sql`
              UPDATE "Streak"
              SET "currentStreak" = ${newCurrent},
                  "longestStreak" = GREATEST("longestStreak", ${newCurrent}),
                  "totalCompletedDays" = ${updatedTotal},
                  "lastCompletedDate" = ${parsedDate}::timestamp,
                  "updatedAt" = NOW()
              WHERE "routineId" = ${routineId}
            `;
        }
    } else if (status === 'MISSED') {
        await sql`UPDATE "Streak" SET "currentStreak" = 0, "updatedAt" = NOW() WHERE "routineId" = ${routineId}`;
    }

    res.json(completion);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/completions', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const sql = getSql();
    const completions = await sql`SELECT * FROM "Completion"`;
    res.json(completions);
  } catch(e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/streaks', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const sql = getSql();
    const streaks = await sql`SELECT * FROM "Streak"`;
    res.json(streaks);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/analytics', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const sql = getSql();
    const completions = await sql`SELECT * FROM "Completion"`;
    const streaks = await sql`SELECT * FROM "Streak"`;
    const routines = await sql`SELECT * FROM "Routine"`;
    res.json({ completions, streaks, routines });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production' && process.env.VERCEL !== '1') {
    const viteModule = 'vite';
    const { createServer: createViteServer } = await import(viteModule);
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Only serve static files locally in production mode if not vercel
    if (process.env.VERCEL !== '1') {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req: express.Request, res: express.Response) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  if (process.env.VERCEL !== '1') {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

startServer();
