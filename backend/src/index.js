require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');

const app = express();

app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(generalLimiter);

app.use('/api/auth', require('./routes/auth'));
app.use('/api/budget', require('./routes/budget'));
app.use('/api/coach', require('./routes/coach'));
app.use('/api/safe-shop', require('./routes/safeShop'));
app.use('/api/health-score', require('./routes/healthScore'));
app.use('/api/exchange-rates', require('./routes/exchangeRates'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/calendar', require('./routes/calendar'));
app.use('/api/cashflow', require('./routes/cashflow'));
app.use('/api/collection', require('./routes/collections'));
app.use('/api/supplier', require('./routes/supplier'));
app.use('/api/marketplace', require('./routes/marketplace'));
app.use('/api/messages', require('./routes/messages'));

app.get('/health', (req, res) => res.json({ status: 'ok', env: process.env.NODE_ENV }));

app.use(notFound);
app.use(errorHandler);

const seedBusiness = require('./scripts/seedBusiness');
const db = require('./config/database');

const initDB = async () => {
  await db.query(`
    DROP TABLE IF EXISTS password_reset_tokens;
    CREATE TABLE password_reset_tokens (
      id SERIAL PRIMARY KEY,
      user_id UUID NOT NULL,
      otp_hash VARCHAR(64) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS conversations (
      id SERIAL PRIMARY KEY,
      listing_id TEXT NOT NULL,
      buyer_id UUID NOT NULL,
      seller_id UUID NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(listing_id, buyer_id)
    );
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      conversation_id INTEGER NOT NULL,
      sender_id UUID NOT NULL,
      content TEXT NOT NULL,
      read_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
};

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`FinnAI backend çalışıyor: http://localhost:${PORT}`);
  try {
    await initDB();
    await seedBusiness();
  } catch (e) {
    console.error('[init] Hata:', e.message);
  }
});

module.exports = app;
