const router = require('express').Router();
const { verifyToken } = require('../middleware/auth');
const { addEntry, getSummary } = require('../controllers/expenseController');

router.post('/', verifyToken, addEntry);
router.get('/summary', verifyToken, getSummary);

module.exports = router;
