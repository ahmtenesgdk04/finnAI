const router = require('express').Router();
const { verifyToken } = require('../middleware/auth');
const { getHealthScore } = require('../controllers/healthScoreController');

router.get('/', verifyToken, getHealthScore);

module.exports = router;
