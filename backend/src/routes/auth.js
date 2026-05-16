const router = require('express').Router();
const { register, login, getMe, changePassword, updateProfile, deleteAccount } = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/me', verifyToken, getMe);
router.patch('/password', verifyToken, changePassword);
router.patch('/profile', verifyToken, updateProfile);
router.delete('/account', verifyToken, deleteAccount);

module.exports = router;
