const db = require('../config/database');

const saveQuery = async ({ userId, url, score, level, result }) => {
  const { rows } = await db.query(
    `INSERT INTO safe_shop_queries (user_id, url, score, level, result)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [userId, url, score, level, JSON.stringify(result)]
  );
  return rows[0];
};

const findByUrl = async (url) => {
  const { rows } = await db.query(
    `SELECT * FROM safe_shop_queries WHERE url = $1 ORDER BY created_at DESC LIMIT 1`,
    [url]
  );
  if (!rows[0]) return null;
  const ageHours = (Date.now() - new Date(rows[0].created_at).getTime()) / 3600000;
  return ageHours < 24 ? rows[0] : null;
};

module.exports = { saveQuery, findByUrl };
