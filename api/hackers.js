const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

let tableCreated = false;
async function ensureTable() {
  if (tableCreated) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS hackers (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  tableCreated = true;
}

module.exports = async (req, res) => {
  await ensureTable();

  if (req.method === 'GET') {
    const { rows } = await pool.query('SELECT name, created_at FROM hackers ORDER BY created_at ASC');
    return res.json(rows);
  }

  if (req.method === 'POST') {
    const name = (req.body.name || '').trim();
    if (!name) return res.status(400).json({ error: 'name required' });

    const { rows } = await pool.query(
      'INSERT INTO hackers (name) VALUES ($1) RETURNING name, created_at',
      [name]
    );
    return res.json(rows[0]);
  }

  res.status(405).json({ error: 'method not allowed' });
};
