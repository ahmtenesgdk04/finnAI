const router = require('express').Router();
const { verifyToken } = require('../middleware/auth');
const { getRates } = require('../controllers/exchangeRatesController');

router.get('/', verifyToken, getRates);

module.exports = router;
