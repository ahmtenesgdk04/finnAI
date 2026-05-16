const router = require('express').Router();
const { verifyToken } = require('../middleware/auth');
const { forecast, summary, addExpense, addIncome } = require('../controllers/cashflowController');

router.post('/forecast', verifyToken, forecast);
router.get('/summary', verifyToken, summary);
router.post('/expense', verifyToken, addExpense);
router.post('/income', verifyToken, addIncome);

module.exports = router;
