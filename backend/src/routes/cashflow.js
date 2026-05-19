const router = require('express').Router();
const { verifyToken } = require('../middleware/auth');
const { forecast, summary, addExpense, addIncome, analyzeExpenses, summaryByRange, deleteEntry } = require('../controllers/cashflowController');

router.post('/forecast', verifyToken, forecast);
router.get('/summary', verifyToken, summary);
router.post('/expense', verifyToken, addExpense);
router.post('/income', verifyToken, addIncome);
router.post('/analyze-expenses', verifyToken, analyzeExpenses);
router.get('/summary-by-range', verifyToken, summaryByRange);
router.delete('/entry/:type/:id', verifyToken, deleteEntry);

module.exports = router;
