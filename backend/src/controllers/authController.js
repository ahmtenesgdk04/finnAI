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

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Mevcut ve yeni şifre zorunludur' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Yeni şifre en az 6 karakter olmalıdır' });
    }
    await authService.changePassword(req.user.id, currentPassword, newPassword);
    res.json({ success: true, message: 'Şifre başarıyla güncellendi' });
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name } = req.body;
    const user = await authService.updateProfile(req.user.id, { name });
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

const deleteAccount = async (req, res, next) => {
  try {
    await authService.deleteAccount(req.user.id);
    res.json({ success: true, message: 'Hesap silindi' });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe, changePassword, updateProfile, deleteAccount };
