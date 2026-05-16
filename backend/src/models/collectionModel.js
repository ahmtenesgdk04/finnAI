const db = require('../config/database');

const getAll = async (userId) => {
  const { rows } = await db.query(
    `SELECT * FROM collections WHERE user_id = $1 ORDER BY paid ASC, due_date ASC`,
    [userId]
  );
  return rows;
};

const add = async (userId, { customerName, amount, dueDate }) => {
  const { rows } = await db.query(
    `INSERT INTO collections (user_id, customer_name, amount, due_date)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [userId, customerName, amount, dueDate]
  );
  return rows[0];
};

const markPaid = async (userId, id) => {
  const { rows } = await db.query(
    `UPDATE collections SET paid = TRUE WHERE id = $1 AND user_id = $2 RETURNING *`,
    [id, userId]
  );
  return rows[0];
};

const remove = async (userId, id) => {
  await db.query(`DELETE FROM collections WHERE id = $1 AND user_id = $2`, [id, userId]);
};

module.exports = { getAll, add, markPaid, remove };
