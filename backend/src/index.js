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

app.get('/health', (req, res) => res.json({ status: 'ok', env: process.env.NODE_ENV }));

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`FinnAI backend çalışıyor: http://localhost:${PORT}`);
});

module.exports = app;
