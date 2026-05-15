const router = require('express').Router();
const { verifyToken } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiter');
const expCtrl = require('../controllers/expenseController');
const budgetCtrl = require('../controllers/budgetController');

// Harcama girişi
router.post('/entry', verifyToken, expCtrl.addEntry);
router.get('/summary', verifyToken, expCtrl.getSummary);

// Bütçe limiti
router.post('/limit', verifyToken, budgetCtrl.setLimit);

// AI analiz
router.post('/analyze', verifyToken, aiLimiter, budgetCtrl.analyzeBudget);

// Birikim hedefleri
router.post('/goals', verifyToken, budgetCtrl.createGoal);
router.get('/goals', verifyToken, budgetCtrl.getGoals);
router.patch('/goals/:id', verifyToken, budgetCtrl.updateGoal);
router.delete('/goals/:id', verifyToken, budgetCtrl.deleteGoal);

module.exports = router;
