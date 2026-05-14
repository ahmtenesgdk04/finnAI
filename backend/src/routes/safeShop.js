const router = require('express').Router();
const { verifyToken } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiter');
const { analyzeUrl } = require('../controllers/safeShopController');

router.post('/analyze', verifyToken, aiLimiter, analyzeUrl);

module.exports = router;
