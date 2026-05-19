const db = require('../config/database');

exports.create = async (req, res) => {
  try {
    const userId = req.user.id;
    const { role, otherPartyName, productName, quantity, unit, unitPrice, currency, note } = req.body;

    if (!role || !otherPartyName || !productName || !quantity || !unitPrice) {
      return res.status(400).json({ message: 'Zorunlu alanlar eksik.' });
    }
    if (!['buyer', 'seller'].includes(role)) {
      return res.status(400).json({ message: 'Geçersiz rol.' });
    }

    const totalPrice = Number(quantity) * Number(unitPrice);

    const { rows } = await db.query(
      `INSERT INTO orders (user_id, role, other_party_name, product_name, quantity, unit, unit_price, currency, total_price, note)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [userId, role, otherPartyName, productName, quantity, unit || null, unitPrice, currency || 'TRY', totalPrice, note || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const { role } = req.query;

    const params = [userId];
    let query = 'SELECT * FROM orders WHERE user_id = $1';
    if (role) {
      params.push(role);
      query += ` AND role = $${params.length}`;
    }
    query += ' ORDER BY created_at DESC';

    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { status } = req.body;

    const valid = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!valid.includes(status)) {
      return res.status(400).json({ message: 'Geçersiz durum.' });
    }

    const { rows } = await db.query(
      'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING *',
      [status, id, userId]
    );
    if (!rows[0]) return res.status(404).json({ message: 'Sipariş bulunamadı.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { rows } = await db.query(
      'DELETE FROM orders WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );
    if (!rows[0]) return res.status(404).json({ message: 'Sipariş bulunamadı.' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
