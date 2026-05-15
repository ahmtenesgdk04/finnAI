const db = require('../config/database');

// Bütçe limitleri
const setLimit = async (userId, category, monthlyLimit) => {
  const { rows } = await db.query(
    `INSERT INTO budget_limits (user_id, category, monthly_limit)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, category) DO UPDATE SET monthly_limit = EXCLUDED.monthly_limit
     RETURNING *`,
    [userId, category, monthlyLimit]
  );
  return rows[0];
};

const getLimits = async (userId) => {
  const { rows } = await db.query(
    'SELECT * FROM budget_limits WHERE user_id = $1',
    [userId]
  );
  return rows;
};

// Birikim hedefleri
const mapGoal = (row) => ({
  id: row.id,
  name: row.name,
  targetAmount: parseFloat(row.target_amount),
  currentAmount: parseFloat(row.current_amount),
  targetDate: row.target_date,
  createdAt: row.created_at,
});

const createGoal = async ({ userId, name, targetAmount, targetDate, currentAmount }) => {
  const { rows } = await db.query(
    `INSERT INTO savings_goals (user_id, name, target_amount, current_amount, target_date)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [userId, name, targetAmount, currentAmount || 0, targetDate]
  );
  return mapGoal(rows[0]);
};

const getGoals = async (userId) => {
  const { rows } = await db.query(
    'SELECT * FROM savings_goals WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return rows.map(mapGoal);
};

const updateGoal = async (id, userId, fields) => {
  const sets = [];
  const vals = [];
  let i = 1;
  if (fields.name !== undefined) { sets.push(`name = $${i++}`); vals.push(fields.name); }
  if (fields.targetAmount !== undefined) { sets.push(`target_amount = $${i++}`); vals.push(fields.targetAmount); }
  if (fields.currentAmount !== undefined) { sets.push(`current_amount = $${i++}`); vals.push(fields.currentAmount); }
  if (fields.targetDate !== undefined) { sets.push(`target_date = $${i++}`); vals.push(fields.targetDate); }
  if (!sets.length) return null;
  vals.push(id, userId);
  const { rows } = await db.query(
    `UPDATE savings_goals SET ${sets.join(', ')} WHERE id = $${i} AND user_id = $${i + 1} RETURNING *`,
    vals
  );
  return rows[0] ? mapGoal(rows[0]) : null;
};

const deleteGoal = async (id, userId) => {
  const { rowCount } = await db.query(
    'DELETE FROM savings_goals WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  return rowCount > 0;
};

module.exports = { setLimit, getLimits, createGoal, getGoals, updateGoal, deleteGoal };
