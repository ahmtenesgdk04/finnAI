const db = require('../config/database');

const getMonthlyHistory = async (userId, months = 6) => {
  const [expenseResult, incomeResult] = await Promise.all([
    db.query(
      `SELECT TO_CHAR(date, 'YYYY-MM') AS month, SUM(amount) AS total, category
       FROM business_expenses
       WHERE user_id = $1 AND date >= NOW() - ($2 || ' months')::INTERVAL
       GROUP BY month, category
       ORDER BY month ASC`,
      [userId, months]
    ),
    db.query(
      `SELECT TO_CHAR(date, 'YYYY-MM') AS month, SUM(amount) AS total
       FROM business_incomes
       WHERE user_id = $1 AND date >= NOW() - ($2 || ' months')::INTERVAL
       GROUP BY month
       ORDER BY month ASC`,
      [userId, months]
    ),
  ]);

  const monthMap = {};

  for (const row of expenseResult.rows) {
    if (!monthMap[row.month]) {
      monthMap[row.month] = { month: row.month, totalIncome: 0, totalExpense: 0, expenseByCategory: {} };
    }
    monthMap[row.month].totalExpense += parseFloat(row.total);
    monthMap[row.month].expenseByCategory[row.category] = parseFloat(row.total);
  }

  for (const row of incomeResult.rows) {
    if (!monthMap[row.month]) {
      monthMap[row.month] = { month: row.month, totalIncome: 0, totalExpense: 0, expenseByCategory: {} };
    }
    monthMap[row.month].totalIncome += parseFloat(row.total);
  }

  return Object.values(monthMap)
    .map((m) => ({ ...m, netCashflow: m.totalIncome - m.totalExpense }))
    .sort((a, b) => a.month.localeCompare(b.month));
};

const getCurrentMonthTotals = async (userId) => {
  const monthStart = new Date();
  monthStart.setDate(1);
  const monthStr = monthStart.toISOString().split('T')[0];

  const [expenseResult, incomeResult] = await Promise.all([
    db.query(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM business_expenses WHERE user_id = $1 AND date >= $2`,
      [userId, monthStr]
    ),
    db.query(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM business_incomes WHERE user_id = $1 AND date >= $2`,
      [userId, monthStr]
    ),
  ]);

  return {
    totalExpense: parseFloat(expenseResult.rows[0].total),
    totalIncome: parseFloat(incomeResult.rows[0].total),
  };
};

const getRecentEntries = async (userId, limit = 10) => {
  const { rows } = await db.query(
    `(SELECT 'expense' AS type, id, amount, category AS label, date, description AS note, created_at
      FROM business_expenses WHERE user_id = $1)
     UNION ALL
     (SELECT 'income' AS type, id, amount, source AS label, date, description AS note, created_at
      FROM business_incomes WHERE user_id = $1)
     ORDER BY date DESC, created_at DESC
     LIMIT $2`,
    [userId, limit]
  );
  return rows;
};

const addExpense = async (userId, { amount, category, date, description }) => {
  const { rows } = await db.query(
    `INSERT INTO business_expenses (user_id, amount, category, date, description)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [userId, amount, category, date, description || null]
  );
  return rows[0];
};

const addIncome = async (userId, { amount, source, date, description }) => {
  const { rows } = await db.query(
    `INSERT INTO business_incomes (user_id, amount, source, date, description)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [userId, amount, source || null, date, description || null]
  );
  return rows[0];
};

const getSummaryByRange = async (userId, startDate, endDate) => {
  const [expenseResult, incomeResult, entriesResult] = await Promise.all([
    db.query(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM business_expenses
       WHERE user_id = $1 AND date >= $2 AND date <= $3`,
      [userId, startDate, endDate]
    ),
    db.query(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM business_incomes
       WHERE user_id = $1 AND date >= $2 AND date <= $3`,
      [userId, startDate, endDate]
    ),
    db.query(
      `(SELECT 'expense' AS type, id, amount, category AS label, date, description AS note, created_at
        FROM business_expenses WHERE user_id = $1 AND date >= $2 AND date <= $3)
       UNION ALL
       (SELECT 'income' AS type, id, amount, source AS label, date, description AS note, created_at
        FROM business_incomes WHERE user_id = $1 AND date >= $2 AND date <= $3)
       ORDER BY date DESC, created_at DESC
       LIMIT 50`,
      [userId, startDate, endDate]
    ),
  ]);

  return {
    totalExpense: parseFloat(expenseResult.rows[0].total),
    totalIncome:  parseFloat(incomeResult.rows[0].total),
    entries:      entriesResult.rows,
  };
};

const deleteExpense = async (userId, id) => {
  const { rowCount } = await db.query(
    `DELETE FROM business_expenses WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
  return rowCount > 0;
};

const deleteIncome = async (userId, id) => {
  const { rowCount } = await db.query(
    `DELETE FROM business_incomes WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
  return rowCount > 0;
};

module.exports = { getMonthlyHistory, getCurrentMonthTotals, getRecentEntries, addExpense, addIncome, getSummaryByRange, deleteExpense, deleteIncome };
