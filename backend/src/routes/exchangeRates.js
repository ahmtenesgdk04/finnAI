const router = require('express').Router();
const { verifyToken } = require('../middleware/auth');
const { getRates, getHistory } = require('../controllers/exchangeRatesController');

router.get('/', verifyToken, getRates);
router.get('/:code/history', verifyToken, getHistory);

module.exports = router;
