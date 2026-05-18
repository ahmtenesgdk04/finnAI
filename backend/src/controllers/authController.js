const authService = require('../services/authService');

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'E-posta zorunludur' });
    }
    await authService.forgotPassword(email.toLowerCase().trim());
    // Always 200 to prevent email enumeration
    res.json({ success: true, message: 'Kod gönderildi' });
  } catch (err) {
    next(err);
  }
};

const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'E-posta ve kod zorunludur' });
    }
    const result = await authService.verifyOtp(email.toLowerCase().trim(), otp.trim());
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { resetToken, newPassword } = req.body;
    if (!resetToken || !newPassword) {
      return res.status(400).json({ success: false, message: 'Token ve yeni şifre zorunludur' });
    }
    await authService.resetPassword(resetToken, newPassword);
    res.json({ success: true, message: 'Şifre başarıyla sıfırlandı' });
  } catch (err) {
    next(err);
  }
};

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

module.exports = {
  register, login, getMe, changePassword, updateProfile, deleteAccount,
  forgotPassword, verifyOtp, resetPassword,
};
