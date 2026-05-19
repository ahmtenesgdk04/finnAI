const db = require('../config/database');

const add = async (userId, { amount, description, month }) => {
  const { rows } = await db.query(
    `INSERT INTO user_income (user_id, amount, description, month)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [userId, amount, description || null, month]
  );
  return rows[0];
};

const getByMonth = async (userId, month) => {
  const { rows } = await db.query(
    'SELECT * FROM user_income WHERE user_id = $1 AND month = $2 ORDER BY created_at DESC',
    [userId, month]
  );
  return rows;
};

const remove = async (id, userId) => {
  const { rowCount } = await db.query(
    'DELETE FROM user_income WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  return rowCount > 0;
};

module.exports = { add, getByMonth, remove };
