const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));  // OCR için büyük payload

const rateLimit = require('express-rate-limit');
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/cashflow', require('./routes/cashflow'));
app.use('/api/collections', require('./routes/collections'));
app.use('/api/safe-shop', require('./routes/safeShop'));
app.use('/api/budget', require('./routes/budget'));
app.use('/api/coach', require('./routes/coach'));
app.use('/api/health-score', require('./routes/healthScore'));
app.use('/api/exchange-rates', require('./routes/exchangeRates'));
app.use('/api/calendar', require('./routes/calendar'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

app.use(require('./middleware/errorHandler'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`FinnAI backend running on port ${PORT}`));
