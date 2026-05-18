const router = require('express').Router();
const { verifyToken } = require('../middleware/auth');
const { analyze } = require('../controllers/supplierController');

router.post('/analyze', verifyToken, analyze);

module.exports = router;
