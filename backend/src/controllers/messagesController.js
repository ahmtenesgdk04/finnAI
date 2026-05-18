const db = require('../config/database');

exports.startOrGetConversation = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { listingId, sellerId } = req.body;

    if (!listingId || !sellerId) {
      return res.status(400).json({ message: 'listingId ve sellerId gerekli' });
    }
    if (buyerId === sellerId) {
      return res.status(400).json({ message: 'Kendi ilanınıza mesaj gönderemezsiniz' });
    }

    const { rows } = await db.query(
      'SELECT * FROM conversations WHERE listing_id = $1 AND buyer_id = $2',
      [listingId.toString(), buyerId]
    );
    if (rows[0]) return res.json(rows[0]);

    const result = await db.query(
      'INSERT INTO conversations (listing_id, buyer_id, seller_id) VALUES ($1, $2, $3) RETURNING *',
      [listingId.toString(), buyerId, sellerId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const { rows } = await db.query(`
      SELECT
        c.id, c.listing_id, c.buyer_id, c.seller_id, c.created_at,
        ml.title AS listing_title,
        CASE WHEN c.buyer_id::text = $1 THEN su.name ELSE bu.name END AS other_name,
        lm.content AS last_message,
        lm.created_at AS last_message_at,
        (SELECT COUNT(*) FROM messages
         WHERE conversation_id = c.id
           AND sender_id::text != $1
           AND read_at IS NULL) AS unread_count
      FROM conversations c
      LEFT JOIN marketplace_listings ml ON ml.id::text = c.listing_id
      LEFT JOIN users su ON su.id::text = c.seller_id::text
      LEFT JOIN users bu ON bu.id::text = c.buyer_id::text
      LEFT JOIN LATERAL (
        SELECT content, created_at FROM messages
        WHERE conversation_id = c.id
        ORDER BY created_at DESC LIMIT 1
      ) lm ON true
      WHERE (c.buyer_id::text = $1 OR c.seller_id::text = $1)
        AND EXISTS (SELECT 1 FROM messages WHERE conversation_id = c.id)
      ORDER BY COALESCE(lm.created_at, c.created_at) DESC
    `, [userId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;
    const { after } = req.query;

    const { rows: conv } = await db.query(
      'SELECT * FROM conversations WHERE id = $1 AND (buyer_id::text = $2 OR seller_id::text = $2)',
      [conversationId, userId]
    );
    if (!conv[0]) return res.status(403).json({ message: 'Erişim reddedildi' });

    const params = [conversationId];
    let query = 'SELECT * FROM messages WHERE conversation_id = $1';
    if (after) {
      params.push(after);
      query += ' AND id > $2';
    }
    query += ' ORDER BY created_at ASC';

    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;
    const { content } = req.body;

    if (!content?.trim()) return res.status(400).json({ message: 'Mesaj boş olamaz' });

    const { rows: conv } = await db.query(
      'SELECT * FROM conversations WHERE id = $1 AND (buyer_id::text = $2 OR seller_id::text = $2)',
      [conversationId, userId]
    );
    if (!conv[0]) return res.status(403).json({ message: 'Erişim reddedildi' });

    const { rows } = await db.query(
      'INSERT INTO messages (conversation_id, sender_id, content) VALUES ($1, $2, $3) RETURNING *',
      [conversationId, userId, content.trim()]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;

    const { rows } = await db.query(
      'SELECT * FROM conversations WHERE id = $1 AND (buyer_id::text = $2 OR seller_id::text = $2)',
      [conversationId, userId]
    );
    if (!rows[0]) return res.status(403).json({ message: 'Erişim reddedildi' });

    await db.query('DELETE FROM messages WHERE conversation_id = $1', [conversationId]);
    await db.query('DELETE FROM conversations WHERE id = $1', [conversationId]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.markRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;
    await db.query(
      'UPDATE messages SET read_at = NOW() WHERE conversation_id = $1 AND sender_id::text != $2 AND read_at IS NULL',
      [conversationId, userId]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
