const router = require('express').Router();
const { verifyToken } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiter');
const { getLevel, getLesson, submitQuizResult, askCoach } = require('../controllers/coachController');

router.get('/level', verifyToken, getLevel);
router.post('/lesson', verifyToken, aiLimiter, getLesson);
router.post('/quiz-result', verifyToken, submitQuizResult);
router.post('/ask', verifyToken, aiLimiter, askCoach);

module.exports = router;
