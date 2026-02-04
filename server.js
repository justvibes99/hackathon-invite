const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Create table on startup
pool.query(`
  CREATE TABLE IF NOT EXISTS hackers (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )
`).then(() => console.log('DB ready'));

// Get all committed hackers
app.get('/api/hackers', async (req, res) => {
  const { rows } = await pool.query('SELECT name, created_at FROM hackers ORDER BY created_at ASC');
  res.json(rows);
});

// Add a hacker
app.post('/api/hackers', async (req, res) => {
  const name = (req.body.name || '').trim();
  if (!name) return res.status(400).json({ error: 'name required' });

  const { rows } = await pool.query(
    'INSERT INTO hackers (name) VALUES ($1) RETURNING name, created_at',
    [name]
  );
  res.json(rows[0]);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
