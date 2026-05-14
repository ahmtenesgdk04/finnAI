const authService = require('../services/authService');

const register = async (req, res, next) => {
  try {
    const { name, email, password, mode } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Ad, e-posta ve şifre zorunludur' });
    }
    const result = await authService.register({ name, email, password, mode: mode || 'personal' });
    res.status(201).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'E-posta ve şifre zorunludur' });
    }
    const result = await authService.login({ email, password });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user.id);
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe };
