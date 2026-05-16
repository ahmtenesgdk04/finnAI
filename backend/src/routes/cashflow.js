const router = require('express').Router();
const { verifyToken } = require('../middleware/auth');
const { forecast, summary, addExpense, addIncome, analyzeExpenses } = require('../controllers/cashflowController');

router.post('/forecast', verifyToken, forecast);
router.get('/summary', verifyToken, summary);
router.post('/expense', verifyToken, addExpense);
router.post('/income', verifyToken, addIncome);
router.post('/analyze-expenses', verifyToken, analyzeExpenses);

module.exports = router;
