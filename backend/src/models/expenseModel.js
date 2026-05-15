const db = require('../config/database');

const create = async ({ userId, amount, category, date, note }) => {
  const { rows } = await db.query(
    `INSERT INTO personal_expenses (user_id, amount, category, date, note)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [userId, amount, category, date, note || null]
  );
  return rows[0];
};

const findByUserAndMonth = async (userId, start, end) => {
  const { rows } = await db.query(
    `SELECT * FROM personal_expenses
     WHERE user_id = $1 AND date BETWEEN $2 AND $3
     ORDER BY date DESC, created_at DESC`,
    [userId, start, end]
  );
  return rows;
};

const findByUserId = async (userId, limit = 50) => {
  const { rows } = await db.query(
    `SELECT * FROM personal_expenses WHERE user_id = $1 ORDER BY date DESC LIMIT $2`,
    [userId, limit]
  );
  return rows;
};

const deleteById = async (id, userId) => {
  const { rowCount } = await db.query(
    'DELETE FROM personal_expenses WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  return rowCount > 0;
};

module.exports = { create, findByUserAndMonth, findByUserId, deleteById };
