const router = require('express').Router();
const {
  register, login, getMe, changePassword, updateProfile, deleteAccount,
  forgotPassword, verifyOtp, resetPassword,
} = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/verify-otp', authLimiter, verifyOtp);
router.post('/reset-password', authLimiter, resetPassword);
router.get('/me', verifyToken, getMe);
router.patch('/password', verifyToken, changePassword);
router.patch('/profile', verifyToken, updateProfile);
router.delete('/account', verifyToken, deleteAccount);

module.exports = router;
