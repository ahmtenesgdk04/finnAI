const db = require('../config/database');

const create = async (userId, data) => {
  const {
    title, category, description, unitPrice, currency,
    minOrderQty, unit, totalStock, deliveryTime,
    deliveryMethod, paymentTerms, contactPreference, city,
  } = data;

  const { rows } = await db.query(
    `INSERT INTO marketplace_listings
      (user_id, title, category, description, unit_price, currency,
       min_order_qty, unit, total_stock, delivery_time, delivery_method,
       payment_terms, contact_preference, city)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
     RETURNING *`,
    [
      userId, title, category, description || null, unitPrice, currency,
      minOrderQty, unit, totalStock || null, deliveryTime || null,
      deliveryMethod || null, paymentTerms || null,
      contactPreference, city,
    ]
  );
  return rows[0];
};

const getAll = async ({ category, city, search } = {}) => {
  let query = `
    SELECT l.*, u.name AS seller_name
    FROM marketplace_listings l
    JOIN users u ON u.id = l.user_id
    WHERE l.status = 'active'
  `;
  const params = [];

  if (category) {
    params.push(category);
    query += ` AND l.category = $${params.length}`;
  }
  if (city) {
    params.push(`%${city}%`);
    query += ` AND l.city ILIKE $${params.length}`;
  }
  if (search) {
    params.push(`%${search}%`);
    query += ` AND (l.title ILIKE $${params.length} OR l.description ILIKE $${params.length})`;
  }

  query += ` ORDER BY l.created_at DESC`;
  const { rows } = await db.query(query, params);
  return rows;
};

const getMine = async (userId) => {
  const { rows } = await db.query(
    `SELECT * FROM marketplace_listings WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return rows;
};

const getById = async (id) => {
  const { rows } = await db.query(
    `SELECT l.*, u.name AS seller_name
     FROM marketplace_listings l
     JOIN users u ON u.id = l.user_id
     WHERE l.id = $1`,
    [id]
  );
  return rows[0] || null;
};

const updateStatus = async (userId, id, status) => {
  const { rows } = await db.query(
    `UPDATE marketplace_listings
     SET status = $1, updated_at = NOW()
     WHERE id = $2 AND user_id = $3
     RETURNING *`,
    [status, id, userId]
  );
  return rows[0] || null;
};

const remove = async (userId, id) => {
  await db.query(
    `DELETE FROM marketplace_listings WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
};

module.exports = { create, getAll, getMine, getById, updateStatus, remove };
