import express from 'express';
import path from 'path';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { PrismaClient } from '@prisma/client';
import { createServer as createViteServer } from 'vite';
import jwt from 'jsonwebtoken';

export const app = express();
const prisma = new PrismaClient();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());
app.use(cookieParser());

import { sql } from './db';

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
    res.status(500).json({ error: error.message || 'Internal server error connecting to neon database' });
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
    const routines = await prisma.routine.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(routines);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/routines', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const routine = await prisma.routine.create({ data: req.body });
    await prisma.streak.create({ data: { routineId: routine.id } });
    res.json(routine);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/routines/:id', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const routine = await prisma.routine.update({ where: { id: req.params.id }, data: req.body });
    res.json(routine);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/routines/:id', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    await prisma.routine.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/completions', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const { routineId, date, status, value, targetValue } = req.body;
    const parsedDate = new Date(date).toISOString(); // Handle proper Postgres dates
    
    const completion = await prisma.completion.upsert({
      where: { routineId_date: { routineId, date: parsedDate } },
      update: { status, value, targetValue },
      create: { routineId, date: parsedDate, status, value, targetValue }
    });

    if (status === 'COMPLETED') {
        const routine = await prisma.routine.findUnique({ where: { id: routineId } });
        if (routine?.autoImprovement) {
            await prisma.routine.update({
                where: { id: routineId },
                data: { targetValue: Math.round(routine.targetValue * 1.01 * 100) / 100 }
            });
        }
        
        const streak = await prisma.streak.findUnique({ where: { routineId } });
        if (streak) {
            const today = new Date(parsedDate);
            const isNextDay = streak.lastCompletedDate ? Math.floor((today.getTime() - new Date(streak.lastCompletedDate).getTime()) / (1000 * 3600 * 24)) === 1 : true;
            
            const newCurrent = isNextDay || !streak.lastCompletedDate ? streak.currentStreak + 1 : 1;
            const updatedTotal = streak.totalCompletedDays + 1;

            await prisma.streak.update({
                where: { routineId },
                data: {
                    currentStreak: newCurrent,
                    longestStreak: Math.max(streak.longestStreak, newCurrent),
                    totalCompletedDays: updatedTotal,
                    lastCompletedDate: parsedDate,
                }
            });
        }
    } else if (status === 'MISSED') {
        await prisma.streak.update({
            where: { routineId },
            data: { currentStreak: 0 }
        });
    }

    res.json(completion);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/completions', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const completions = await prisma.completion.findMany();
    res.json(completions);
  } catch(e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/streaks', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const streaks = await prisma.streak.findMany();
    res.json(streaks);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/analytics', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const completions = await prisma.completion.findMany();
    const streaks = await prisma.streak.findMany();
    const routines = await prisma.routine.findMany();
    res.json({ completions, streaks, routines });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production' && process.env.VERCEL !== '1') {
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
