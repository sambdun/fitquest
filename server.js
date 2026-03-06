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
    avatar_data   TEXT DEFAULT NULL,
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

  CREATE TABLE IF NOT EXISTS user_journal (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL,
    date       TEXT NOT NULL,
    entry      TEXT NOT NULL,
    xp_awarded INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (unixepoch()),
    UNIQUE(user_id, date)
  );

  CREATE TABLE IF NOT EXISTS user_runs (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL,
    date       TEXT NOT NULL,
    miles      REAL NOT NULL,
    xp_awarded INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (unixepoch()),
    UNIQUE(user_id, date)
  );

  CREATE TABLE IF NOT EXISTS boss_events (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    max_hp      INTEGER NOT NULL,
    current_hp  INTEGER NOT NULL,
    started_at  INTEGER DEFAULT (unixepoch()),
    defeated_at INTEGER DEFAULT NULL
  );

  CREATE TABLE IF NOT EXISTS boss_damage (
    boss_id  INTEGER,
    user_id  INTEGER,
    damage   INTEGER DEFAULT 0,
    PRIMARY KEY (boss_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS boss_activity (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    boss_id     INTEGER NOT NULL,
    user_id     INTEGER NOT NULL,
    description TEXT NOT NULL,
    damage      INTEGER NOT NULL,
    created_at  INTEGER DEFAULT (unixepoch())
  );
`)

// ── Boss System ───────────────────────────────────────────────
const BOSS_MAX_HP = 50000
const BOSS_NAME   = 'Weekly Dragon'

// Ensure active boss exists with current config
const activeBoss = db.prepare('SELECT id FROM boss_events WHERE defeated_at IS NULL').get()
if (!activeBoss) {
  db.prepare('INSERT INTO boss_events (name, max_hp, current_hp) VALUES (?, ?, ?)')
    .run(BOSS_NAME, BOSS_MAX_HP, BOSS_MAX_HP)
} else {
  // Update name/max_hp if config changed (preserve current_hp ratio)
  const existing = db.prepare('SELECT * FROM boss_events WHERE defeated_at IS NULL ORDER BY id DESC LIMIT 1').get()
  if (existing.name !== BOSS_NAME || existing.max_hp !== BOSS_MAX_HP) {
    const ratio = existing.current_hp / existing.max_hp
    const newHp = Math.round(BOSS_MAX_HP * ratio)
    db.prepare('UPDATE boss_events SET name = ?, max_hp = ?, current_hp = ? WHERE id = ?')
      .run(BOSS_NAME, BOSS_MAX_HP, newHp, existing.id)
  }
}

function damageBoss(userId, amount, desc) {
  const boss = db.prepare('SELECT * FROM boss_events WHERE defeated_at IS NULL ORDER BY id DESC LIMIT 1').get()
  if (!boss) return
  const newHp = Math.max(0, boss.current_hp - amount)
  db.prepare('UPDATE boss_events SET current_hp = ? WHERE id = ?').run(newHp, boss.id)
  db.prepare(`
    INSERT INTO boss_damage (boss_id, user_id, damage) VALUES (?, ?, ?)
    ON CONFLICT(boss_id, user_id) DO UPDATE SET damage = damage + ?
  `).run(boss.id, userId, amount, amount)
  db.prepare('INSERT INTO boss_activity (boss_id, user_id, description, damage) VALUES (?, ?, ?, ?)')
    .run(boss.id, userId, desc || 'Workout', amount)
  if (newHp <= 0) {
    db.prepare('UPDATE boss_events SET defeated_at = unixepoch() WHERE id = ?').run(boss.id)
    db.prepare('INSERT INTO boss_events (name, max_hp, current_hp) VALUES (?, ?, ?)')
      .run(BOSS_NAME, BOSS_MAX_HP, BOSS_MAX_HP)
  }
}

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

app.get('/api/profile', requireLogin, (req, res) => {
  const userId = req.session.userId
  const user = db.prepare('SELECT avatar_data FROM users WHERE id = ?').get(userId)
  const xp   = db.prepare('SELECT * FROM user_xp WHERE user_id = ?').get(userId)
  const workoutCount = db.prepare('SELECT COUNT(*) as n FROM user_completed WHERE user_id = ?').get(userId).n
  const runCount     = db.prepare('SELECT COUNT(*) as n FROM user_runs WHERE user_id = ?').get(userId).n
  const journalCount = db.prepare('SELECT COUNT(*) as n FROM user_journal WHERE user_id = ?').get(userId).n
  res.json({
    username: req.session.username,
    avatarData: user.avatar_data,
    categoryXP: {
      Strength:   xp.strength_xp,
      Cardio:     xp.cardio_xp,
      Sports:     xp.sports_xp,
      Activities: xp.activities_xp,
    },
    stats: { workouts: workoutCount, runs: runCount, journal: journalCount },
  })
})

app.post('/api/profile/avatar', requireLogin, (req, res) => {
  const { avatarData } = req.body
  if (!avatarData || !avatarData.startsWith('data:image/')) {
    return res.status(400).json({ error: 'Invalid image data' })
  }
  if (avatarData.length > 500000) return res.status(400).json({ error: 'Image too large (max ~375KB)' })
  db.prepare('UPDATE users SET avatar_data = ? WHERE id = ?').run(avatarData, req.session.userId)
  res.json({ ok: true })
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

  const todayRun = db.prepare(
    'SELECT miles, xp_awarded FROM user_runs WHERE user_id = ? AND date = ?'
  ).get(userId, todayKey()) || null

  res.json({ categoryXP, completed, workouts, todayRun })
})

app.get('/api/completed', requireLogin, (req, res) => {
  const { date } = req.query
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ error: 'Invalid date' })
  const rows = db.prepare(
    'SELECT workout_id FROM user_completed WHERE user_id = ? AND date = ?'
  ).all(req.session.userId, date)
  res.json(rows.map(r => r.workout_id))
})

app.post('/api/complete', requireLogin, (req, res) => {
  const userId = req.session.userId
  const { workoutId, category, date: reqDate } = req.body
  if (!workoutId || !category) return res.status(400).json({ error: 'workoutId and category required' })

  const date = reqDate && /^\d{4}-\d{2}-\d{2}$/.test(reqDate) ? reqDate : todayKey()
  if (date > todayKey()) return res.status(400).json({ error: 'Cannot complete future workouts' })

  const XP_PER_WORKOUT = 400
  const catColumn = {
    Strength:   'strength_xp',
    Cardio:     'cardio_xp',
    Sports:     'sports_xp',
    Activities: 'activities_xp',
  }[category]
  if (!catColumn) return res.status(400).json({ error: 'Invalid category' })

  try {
    const result = db.prepare(
      'INSERT OR IGNORE INTO user_completed (user_id, workout_id, date) VALUES (?, ?, ?)'
    ).run(userId, String(workoutId), date)

    // Only award XP if this is a new completion (not a duplicate)
    if (result.changes > 0) {
      db.prepare(
        `UPDATE user_xp SET ${catColumn} = ${catColumn} + ? WHERE user_id = ?`
      ).run(XP_PER_WORKOUT, userId)
      damageBoss(userId, XP_PER_WORKOUT, category + ' Workout')
    }

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

app.post('/api/runs', requireLogin, (req, res) => {
  const userId = req.session.userId
  const miles  = parseFloat(req.body.miles)
  if (!miles || miles <= 0) return res.status(400).json({ error: 'Invalid miles' })

  const existing = db.prepare('SELECT * FROM user_runs WHERE user_id = ? AND date = ?').get(userId, todayKey())
  if (existing) return res.status(409).json({ error: 'Already logged a run today' })

  const xp = Math.round(miles * 100)
  db.prepare('INSERT INTO user_runs (user_id, date, miles, xp_awarded) VALUES (?, ?, ?, ?)')
    .run(userId, todayKey(), miles, xp)
  db.prepare('INSERT OR IGNORE INTO user_completed (user_id, workout_id, date) VALUES (?, ?, ?)')
    .run(userId, 'cardio-run', todayKey())
  db.prepare('UPDATE user_xp SET cardio_xp = cardio_xp + ? WHERE user_id = ?').run(xp, userId)
  damageBoss(userId, xp, miles + 'mi Run')

  const xpRow = db.prepare('SELECT * FROM user_xp WHERE user_id = ?').get(userId)
  res.json({
    miles,
    xpAwarded: xp,
    categoryXP: {
      Strength:   xpRow.strength_xp,
      Cardio:     xpRow.cardio_xp,
      Sports:     xpRow.sports_xp,
      Activities: xpRow.activities_xp,
    }
  })
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

const JOURNAL_XP = 200

app.get('/api/journal', requireLogin, (req, res) => {
  const entries = db.prepare(
    'SELECT date, entry, xp_awarded FROM user_journal WHERE user_id = ? ORDER BY date DESC'
  ).all(req.session.userId)
  res.json(entries)
})

app.post('/api/journal', requireLogin, (req, res) => {
  const { entry } = req.body
  if (!entry || !entry.trim()) return res.status(400).json({ error: 'Entry required' })

  const userId = req.session.userId
  const date   = todayKey()

  const existing = db.prepare(
    'SELECT * FROM user_journal WHERE user_id = ? AND date = ?'
  ).get(userId, date)

  if (existing) {
    db.prepare('UPDATE user_journal SET entry = ? WHERE user_id = ? AND date = ?')
      .run(entry.trim(), userId, date)
    return res.json({ xpAwarded: 0, updated: true })
  }

  // Award XP to dominant category
  const xpRow = db.prepare('SELECT * FROM user_xp WHERE user_id = ?').get(userId)
  const cols  = ['strength_xp', 'cardio_xp', 'sports_xp', 'activities_xp']
  const vals  = [xpRow.strength_xp, xpRow.cardio_xp, xpRow.sports_xp, xpRow.activities_xp]
  const col   = cols[vals.indexOf(Math.max(...vals))]

  db.prepare('INSERT INTO user_journal (user_id, date, entry, xp_awarded) VALUES (?, ?, ?, ?)')
    .run(userId, date, entry.trim(), JOURNAL_XP)
  db.prepare(`UPDATE user_xp SET ${col} = ${col} + ? WHERE user_id = ?`)
    .run(JOURNAL_XP, userId)
  damageBoss(userId, JOURNAL_XP, 'Journal Entry')

  const updated = db.prepare('SELECT * FROM user_xp WHERE user_id = ?').get(userId)
  res.json({
    xpAwarded: JOURNAL_XP,
    categoryXP: {
      Strength:   updated.strength_xp,
      Cardio:     updated.cardio_xp,
      Sports:     updated.sports_xp,
      Activities: updated.activities_xp,
    }
  })
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

app.get('/api/boss', requireLogin, (req, res) => {
  const boss = db.prepare(
    'SELECT * FROM boss_events WHERE defeated_at IS NULL ORDER BY id DESC LIMIT 1'
  ).get()
  if (!boss) return res.json({ boss: null, contributors: [], activity: [] })

  const contributors = db.prepare(`
    SELECT u.username, bd.damage
    FROM boss_damage bd
    JOIN users u ON u.id = bd.user_id
    WHERE bd.boss_id = ?
    ORDER BY bd.damage DESC
  `).all(boss.id)

  const activity = db.prepare(`
    SELECT u.username, ba.description, ba.damage, ba.created_at
    FROM boss_activity ba
    JOIN users u ON u.id = ba.user_id
    WHERE ba.boss_id = ?
    ORDER BY ba.created_at DESC
    LIMIT 20
  `).all(boss.id)

  res.json({ boss, contributors, activity })
})

// ── Daily Goblin ──────────────────────────────────────────────
const GOBLIN_MAX_HP = 1500

app.get('/api/goblin', requireLogin, (req, res) => {
  const userId = req.session.userId
  const today  = todayKey()

  const workoutsToday = db.prepare(
    'SELECT COUNT(*) as n FROM user_completed WHERE user_id = ? AND date = ?'
  ).get(userId, today).n

  const runToday     = db.prepare('SELECT xp_awarded FROM user_runs    WHERE user_id = ? AND date = ?').get(userId, today)
  const journalToday = db.prepare('SELECT xp_awarded FROM user_journal WHERE user_id = ? AND date = ?').get(userId, today)

  const workoutDmg = workoutsToday * 400
  const runDmg     = runToday?.xp_awarded     || 0
  const journalDmg = journalToday?.xp_awarded || 0
  const totalDmg   = workoutDmg + runDmg + journalDmg
  const currentHp  = Math.max(0, GOBLIN_MAX_HP - totalDmg)

  const activity = []
  if (workoutDmg > 0) activity.push({ icon: '⚔️', desc: `${workoutsToday} workout${workoutsToday > 1 ? 's' : ''}`, dmg: workoutDmg })
  if (runDmg     > 0) activity.push({ icon: '🏃', desc: "Today's run",    dmg: runDmg })
  if (journalDmg > 0) activity.push({ icon: '📓', desc: 'Journal entry',  dmg: journalDmg })

  res.json({ maxHp: GOBLIN_MAX_HP, currentHp, totalDmg, defeated: currentHp === 0, activity })
})

// ── Static Files ──────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'dist')))
app.get('/{*any}', (req, res) => res.sendFile(path.join(__dirname, 'dist/index.html')))

app.listen(PORT, () => console.log(`FitQuest running on http://localhost:${PORT}`))
