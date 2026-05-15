const router = require('express').Router();
const { verifyToken } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiter');
const { addEntry, getSummary, suggestCategory, analyzeExpenses } = require('../controllers/expenseController');

router.post('/', verifyToken, addEntry);
router.get('/summary', verifyToken, getSummary);
router.post('/suggest-category', verifyToken, aiLimiter, suggestCategory);
router.get('/analyze', verifyToken, aiLimiter, analyzeExpenses);

module.exports = router;
