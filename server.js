import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import session from 'express-session'
import bcrypt from 'bcrypt'
import { DatabaseSync } from 'node:sqlite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 3000

// ── Database ──────────────────────────────────────────────────
const db = new DatabaseSync(process.env.DB_PATH || './fitquest.db')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at    INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS user_xp (
    user_id       INTEGER PRIMARY KEY,
    strength_xp   INTEGER DEFAULT 0,
    cardio_xp     INTEGER DEFAULT 0,
    sports_xp     INTEGER DEFAULT 0,
    activities_xp INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS user_completed (
    user_id    INTEGER,
    workout_id TEXT,
    date       TEXT,
    PRIMARY KEY (user_id, workout_id, date)
  );

  CREATE TABLE IF NOT EXISTS user_workouts (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER,
    category   TEXT,
    name       TEXT,
    desc       TEXT,
    created_at INTEGER DEFAULT (unixepoch())
  );
`)

// ── App ───────────────────────────────────────────────────────
const app = express()

app.use(express.json())
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-prod',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 },
}))

// ── Middleware ────────────────────────────────────────────────
function requireLogin(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' })
  next()
}

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

// ── Auth Endpoints ────────────────────────────────────────────
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' })
  if (username.length > 24) return res.status(400).json({ error: 'Username too long' })
  if (password.length < 4) return res.status(400).json({ error: 'Password too short' })

  try {
    const hash = await bcrypt.hash(password, 10)
    const stmt = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)')
    const result = stmt.run(username.trim(), hash)
    const userId = result.lastInsertRowid

    db.prepare('INSERT INTO user_xp (user_id) VALUES (?)').run(userId)

    req.session.userId = userId
    req.session.username = username.trim()
    res.json({ username: username.trim(), isNew: true })
  } catch (err) {
    console.error('register error:', err)
    if (err?.message?.includes('UNIQUE')) return res.status(409).json({ error: 'Username already taken' })
    res.status(500).json({ error: 'Server error' })
  }
})

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' })

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username.trim())
  if (!user) return res.status(401).json({ error: 'Invalid username or password' })

  const match = await bcrypt.compare(password, user.password_hash)
  if (!match) return res.status(401).json({ error: 'Invalid username or password' })

  req.session.userId = user.id
  req.session.username = user.username
  res.json({ username: user.username })
})

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }))
})

app.get('/api/me', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' })
  res.json({ username: req.session.username })
})

// ── Data Endpoints ────────────────────────────────────────────
app.get('/api/state', requireLogin, (req, res) => {
  const userId = req.session.userId

  const xpRow = db.prepare('SELECT * FROM user_xp WHERE user_id = ?').get(userId)
  const categoryXP = {
    Strength:   xpRow?.strength_xp   || 0,
    Cardio:     xpRow?.cardio_xp     || 0,
    Sports:     xpRow?.sports_xp     || 0,
    Activities: xpRow?.activities_xp || 0,
  }

  const completedRows = db.prepare(
    'SELECT workout_id FROM user_completed WHERE user_id = ? AND date = ?'
  ).all(userId, todayKey())
  const completed = completedRows.map(r => r.workout_id)

  const customRows = db.prepare(
    'SELECT id, category, name, desc FROM user_workouts WHERE user_id = ? ORDER BY created_at ASC'
  ).all(userId)

  const workouts = { Strength: [], Cardio: [], Sports: [], Activities: [] }
  for (const row of customRows) {
    if (workouts[row.category]) {
      workouts[row.category].push({ id: row.id, name: row.name, desc: row.desc })
    }
  }

  res.json({ categoryXP, completed, workouts })
})

app.post('/api/complete', requireLogin, (req, res) => {
  const userId = req.session.userId
  const { workoutId, category } = req.body
  if (!workoutId || !category) return res.status(400).json({ error: 'workoutId and category required' })

  const XP_PER_WORKOUT = 400
  const catColumn = {
    Strength:   'strength_xp',
    Cardio:     'cardio_xp',
    Sports:     'sports_xp',
    Activities: 'activities_xp',
  }[category]
  if (!catColumn) return res.status(400).json({ error: 'Invalid category' })

  try {
    db.prepare(
      'INSERT OR IGNORE INTO user_completed (user_id, workout_id, date) VALUES (?, ?, ?)'
    ).run(userId, String(workoutId), todayKey())

    db.prepare(
      `UPDATE user_xp SET ${catColumn} = ${catColumn} + ? WHERE user_id = ?`
    ).run(XP_PER_WORKOUT, userId)

    const xpRow = db.prepare('SELECT * FROM user_xp WHERE user_id = ?').get(userId)
    res.json({
      categoryXP: {
        Strength:   xpRow.strength_xp,
        Cardio:     xpRow.cardio_xp,
        Sports:     xpRow.sports_xp,
        Activities: xpRow.activities_xp,
      }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

app.post('/api/workouts', requireLogin, (req, res) => {
  const userId = req.session.userId
  const { category, name, desc } = req.body
  if (!category || !name) return res.status(400).json({ error: 'category and name required' })

  const result = db.prepare(
    'INSERT INTO user_workouts (user_id, category, name, desc) VALUES (?, ?, ?, ?)'
  ).run(userId, category, name.trim(), (desc || '').trim())

  res.json({ id: result.lastInsertRowid, category, name: name.trim(), desc: (desc || '').trim() })
})

app.put('/api/workouts/:id', requireLogin, (req, res) => {
  const userId = req.session.userId
  const { id } = req.params
  const { name, desc } = req.body
  if (!name) return res.status(400).json({ error: 'name required' })

  const result = db.prepare(
    'UPDATE user_workouts SET name = ?, desc = ? WHERE id = ? AND user_id = ?'
  ).run(name.trim(), (desc || '').trim(), Number(id), userId)

  if (result.changes === 0) return res.status(404).json({ error: 'Workout not found' })
  res.json({ ok: true })
})

app.delete('/api/workouts/:id', requireLogin, (req, res) => {
  const userId = req.session.userId
  const { id } = req.params

  const result = db.prepare(
    'DELETE FROM user_workouts WHERE id = ? AND user_id = ?'
  ).run(Number(id), userId)

  if (result.changes === 0) return res.status(404).json({ error: 'Workout not found' })
  res.json({ ok: true })
})

app.get('/api/community', requireLogin, (req, res) => {
  const rows = db.prepare(`
    SELECT u.username, x.strength_xp, x.cardio_xp, x.sports_xp, x.activities_xp
    FROM users u
    JOIN user_xp x ON x.user_id = u.id
    ORDER BY (x.strength_xp + x.cardio_xp + x.sports_xp + x.activities_xp) DESC
  `).all()

  const players = rows.map(r => ({
    username: r.username,
    categoryXP: {
      Strength:   r.strength_xp,
      Cardio:     r.cardio_xp,
      Sports:     r.sports_xp,
      Activities: r.activities_xp,
    },
    totalXP: r.strength_xp + r.cardio_xp + r.sports_xp + r.activities_xp,
  }))

  res.json(players)
})

// ── Static Files ──────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'dist')))
app.get('/{*any}', (req, res) => res.sendFile(path.join(__dirname, 'dist/index.html')))

app.listen(PORT, () => console.log(`FitQuest running on http://localhost:${PORT}`))
