import express from 'express';
import path from 'path';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { getSql } from './db.js';

export const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());
app.use(cookieParser());

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@fitbeat.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password123';

async function initDb() {
  try {
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
      const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
      await sql`
        INSERT INTO "AppUser" (id, name, email, password)
        VALUES (${id}, 'Admin User', ${ADMIN_EMAIL}, ${hash})
      `;
    }
  } catch (e) {
    console.error("Init DB Error", e);
  }
}

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

    const sql = getSql();
    // Test connection
    await sql`SELECT 1 as test_connection`;
    
    const users = await sql`SELECT * FROM "AppUser" WHERE email = ${email}`;
    const user = users[0];

    let validPassword = false;
    if (user) {
      // Legacy check or bcrypt check
      if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
        validPassword = await bcrypt.compare(password, user.password);
      } else {
        // Fallback for raw passwords just in case, plus rehash
        validPassword = password === user.password;
        if (validPassword) {
          const hash = await bcrypt.hash(password, 10);
          await sql`UPDATE "AppUser" SET password = ${hash} WHERE id = ${user.id}`;
        }
      }
    }
    
    if (user && validPassword) {
      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
      res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'none', maxAge: 7 * 24 * 60 * 60 * 1000 });
      res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl } });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error: any) {
    console.error('Login route error:', error);
    res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Internal server error while processing login.' : (error.message || 'Error connecting to database') });
  }
});

app.post('/api/auth/logout', (req: express.Request, res: express.Response) => {
  res.clearCookie('token', { httpOnly: true, secure: true, sameSite: 'none' });
  res.json({ success: true });
});

app.get('/api/auth/me', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const sql = getSql();
    const email = (req as any).user.email;
    const users = await sql`SELECT id, name, email, "avatarUrl" FROM "AppUser" WHERE email = ${email}`;
    if (users.length > 0) {
      res.json({ user: users[0] });
    } else {
      res.status(401).json({ error: 'User not found' });
    }
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/sections', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const sql = getSql();
    const sections = await sql`SELECT * FROM "Section" ORDER BY name ASC`;
    res.json(sections);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/sections', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const sql = getSql();
    const { name } = req.body;
    if (!name) {
      res.status(400).json({ error: "Name required" });
      return;
    }
    const id = crypto.randomUUID();
    const sections = await sql`
      INSERT INTO "Section" (id, name, "createdAt")
      VALUES (${id}, ${name}, NOW())
      RETURNING *
    `;
    res.json(sections[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/sections/:id', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const sql = getSql();
    const { name } = req.body;
    const sections = await sql`
      UPDATE "Section" SET name = ${name} WHERE id = ${req.params.id} RETURNING *
    `;
    res.json(sections[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/sections/:id', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const sql = getSql();
    const sectionId = req.params.id;
    
    const cats = await sql`SELECT id FROM "Category" WHERE "sectionId" = ${sectionId}`;
    for(const c of cats) {
        const routines = await sql`SELECT id FROM "Routine" WHERE "categoryId" = ${c.id}`;
        for(const r of routines) {
            await sql`DELETE FROM "Completion" WHERE "routineId" = ${r.id}`;
            await sql`DELETE FROM "Streak" WHERE "routineId" = ${r.id}`;
        }
        await sql`DELETE FROM "Routine" WHERE "categoryId" = ${c.id}`;
    }
    await sql`DELETE FROM "Category" WHERE "sectionId" = ${sectionId}`;
    await sql`DELETE FROM "Section" WHERE id = ${sectionId}`;
    
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
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
    const { name, category, categoryId, description, targetValue, targetUnit, sets = 1, icon = null, isActive = true, autoImprovement = false } = req.body;
    
    if (!name || (!category && !categoryId) || targetValue === undefined || !targetUnit) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }
    
    const routines = await sql`
      INSERT INTO "Routine" (id, name, category, "categoryId", description, "targetValue", "targetUnit", "sets", "icon", "isActive", "autoImprovement", "createdAt", "updatedAt")
      VALUES (${id}, ${name}, ${category || 'Uncategorized'}, ${categoryId || null}, ${description || null}, ${targetValue}, ${targetUnit}, ${sets}, ${icon}, ${isActive}, ${autoImprovement}, NOW(), NOW())
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
    if (e.message?.includes('duplicate key') || e.message?.includes('unique constraint')) {
      res.status(409).json({ error: "Routine already exists" });
    } else {
      res.status(500).json({ error: e.message });
    }
  }
});

app.put('/api/routines/:id', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const sql = getSql();
    const { name, category, categoryId, description, targetValue, targetUnit, sets = 1, icon = null, isActive, autoImprovement } = req.body;
    
    if (!name || (!category && !categoryId) || targetValue === undefined || !targetUnit) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const routines = await sql`
      UPDATE "Routine"
      SET name = ${name}, category = ${category || 'Uncategorized'}, "categoryId" = ${categoryId || null}, description = ${description || null},
          "targetValue" = ${targetValue}, "targetUnit" = ${targetUnit}, "sets" = ${sets}, "icon" = ${icon}, "isActive" = ${isActive}, "autoImprovement" = ${autoImprovement}, "updatedAt" = NOW()
      WHERE id = ${req.params.id}
      RETURNING *
    `;
    if (routines.length === 0) {
      res.status(404).json({ error: "Routine not found" });
      return;
    }
    res.json(routines[0]);
  } catch (e: any) {
    if (e.message?.includes('duplicate key') || e.message?.includes('unique constraint')) {
      res.status(409).json({ error: "Routine name already exists" });
    } else {
      res.status(500).json({ error: e.message });
    }
  }
});

app.delete('/api/routines/:id', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const sql = getSql();
    await sql`DELETE FROM "Completion" WHERE "routineId" = ${req.params.id}`;
    await sql`DELETE FROM "Streak" WHERE "routineId" = ${req.params.id}`;
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

app.get('/api/categories', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const sql = getSql();
    const categories = await sql`SELECT * FROM "Category" ORDER BY name ASC`;
    res.json(categories);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/categories', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const sql = getSql();
    const { name, sectionId, schedule } = req.body;
    if (!name || !sectionId) {
      res.status(400).json({ error: "Name and sectionId required" });
      return;
    }
    const id = crypto.randomUUID();
    const scheduleJson = schedule ? JSON.stringify(schedule) : '[0,1,2,3,4,5,6]';
    const categories = await sql`
      INSERT INTO "Category" (id, "sectionId", name, schedule, "createdAt")
      VALUES (${id}, ${sectionId}, ${name}, ${scheduleJson}::jsonb, NOW())
      RETURNING *
    `;
    res.json(categories[0]);
  } catch (e: any) {
    if (e.message?.includes('duplicate key') || e.message?.includes('unique constraint')) {
      res.status(409).json({ error: "Category name already exists" });
    } else {
      res.status(500).json({ error: e.message });
    }
  }
});

app.put('/api/categories/:id', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const sql = getSql();
    const { name, sectionId, schedule } = req.body;
    const oldCat = await sql`SELECT name FROM "Category" WHERE id = ${req.params.id}`;
    if (oldCat.length > 0 && oldCat[0].name) {
      await sql`UPDATE "Routine" SET category = ${name} WHERE category = ${oldCat[0].name}`;
    }
    const scheduleJson = schedule ? JSON.stringify(schedule) : '[0,1,2,3,4,5,6]';
    const categories = await sql`
      UPDATE "Category" SET name = ${name}, "sectionId" = ${sectionId}, schedule = ${scheduleJson}::jsonb WHERE id = ${req.params.id} RETURNING *
    `;
    res.json(categories[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/categories/:id', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const sql = getSql();
    const categoryId = req.params.id;
    const routines = await sql`SELECT id FROM "Routine" WHERE "categoryId" = ${categoryId}`;
    for(const r of routines) {
        await sql`DELETE FROM "Completion" WHERE "routineId" = ${r.id}`;
        await sql`DELETE FROM "Streak" WHERE "routineId" = ${r.id}`;
    }
    await sql`DELETE FROM "Routine" WHERE "categoryId" = ${categoryId}`;
    await sql`DELETE FROM "Category" WHERE id = ${categoryId}`;
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// --- RESTRICTED TASKS ---
app.get('/api/restricted-tasks', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const sql = getSql();
    const tasks = await sql`SELECT * FROM "RestrictedTask" ORDER BY "createdAt" DESC`;
    res.json(tasks);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/restricted-tasks', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const sql = getSql();
    const id = crypto.randomUUID();
    const { name, icon = null, isActive = true } = req.body;
    if (!name) {
      res.status(400).json({ error: "Missing name" });
      return;
    }
    const tasks = await sql`
      INSERT INTO "RestrictedTask" (id, name, icon, "isActive", "createdAt", "updatedAt")
      VALUES (${id}, ${name}, ${icon}, ${isActive}, NOW(), NOW())
      RETURNING *
    `;
    res.json(tasks[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/restricted-tasks/:id', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const sql = getSql();
    const { name, icon = null, isActive = true } = req.body;
    const tasks = await sql`
      UPDATE "RestrictedTask"
      SET name = ${name}, icon = ${icon}, "isActive" = ${isActive}, "updatedAt" = NOW()
      WHERE id = ${req.params.id}
      RETURNING *
    `;
    if (tasks.length === 0) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    res.json(tasks[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/restricted-tasks/:id', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const sql = getSql();
    await sql`DELETE FROM "RestrictedCompletion" WHERE "taskId" = ${req.params.id}`;
    await sql`DELETE FROM "RestrictedTask" WHERE id = ${req.params.id}`;
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/restricted-completions', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const sql = getSql();
    const completions = await sql`SELECT * FROM "RestrictedCompletion"`;
    res.json(completions);
  } catch(e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/restricted-completions', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const sql = getSql();
    const { taskId, date, status } = req.body;
    const parsedDate = new Date(date).toISOString();
    const id = crypto.randomUUID();
    
    const completions = await sql`
      INSERT INTO "RestrictedCompletion" (id, "taskId", date, status, "createdAt", "updatedAt")
      VALUES (${id}, ${taskId}, ${parsedDate}::timestamp, ${status}, NOW(), NOW())
      ON CONFLICT ("taskId", date)
      DO UPDATE SET status = EXCLUDED.status, "updatedAt" = NOW()
      RETURNING *
    `;
    res.json(completions[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

async function startServer() {
  await initDb();
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
