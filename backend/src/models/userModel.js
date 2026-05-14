const db = require('../config/database');

const create = async ({ name, email, passwordHash, mode }) => {
  const { rows } = await db.query(
    `INSERT INTO users (name, email, password, mode) VALUES ($1, $2, $3, $4) RETURNING id, name, email, mode, created_at`,
    [name, email, passwordHash, mode]
  );
  return rows[0];
};

const findByEmail = async (email) => {
  const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  return rows[0] || null;
};

const findById = async (id) => {
  const { rows } = await db.query(
    'SELECT id, name, email, mode, created_at FROM users WHERE id = $1',
    [id]
  );
  return rows[0] || null;
};

module.exports = { create, findByEmail, findById };
