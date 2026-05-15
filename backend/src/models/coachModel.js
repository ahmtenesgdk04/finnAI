const db = require('../config/database');

const getProgress = async (userId) => {
  const { rows } = await db.query(
    'SELECT * FROM coach_progress WHERE user_id = $1',
    [userId]
  );
  if (rows[0]) return rows[0];
  // İlk kez erişim → sıfırdan başlat
  const { rows: newRows } = await db.query(
    `INSERT INTO coach_progress (user_id, xp, level, badges)
     VALUES ($1, 0, 1, '{}') RETURNING *`,
    [userId]
  );
  return newRows[0];
};

const addXP = async (userId, xpToAdd) => {
  const progress = await getProgress(userId);
  const newXp = progress.xp + xpToAdd;
  const newLevel = Math.floor(newXp / 200) + 1;

  const { rows } = await db.query(
    `UPDATE coach_progress
     SET xp = $1, level = $2, updated_at = NOW()
     WHERE user_id = $3 RETURNING *`,
    [newXp, newLevel, userId]
  );
  return rows[0];
};

const addBadge = async (userId, badge) => {
  const { rows } = await db.query(
    `UPDATE coach_progress
     SET badges = array_append(badges, $1), updated_at = NOW()
     WHERE user_id = $2 AND NOT ($1 = ANY(badges)) RETURNING *`,
    [badge, userId]
  );
  return rows[0];
};

module.exports = { getProgress, addXP, addBadge };
