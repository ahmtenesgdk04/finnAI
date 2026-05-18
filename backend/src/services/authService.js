const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/database');
const userModel = require('../models/userModel');
const emailService = require('./emailService');

const register = async ({ name, email, password, mode }) => {
  const existing = await userModel.findByEmail(email);
  if (existing) {
    const err = new Error('Bu e-posta adresi zaten kayıtlı');
    err.status = 409;
    throw err;
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await userModel.create({ name, email, passwordHash, mode });
  const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
  return { user, token };
};

const login = async ({ email, password }) => {
  const user = await userModel.findByEmail(email);
  if (!user) {
    const err = new Error('E-posta veya şifre hatalı');
    err.status = 401;
    throw err;
  }
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    const err = new Error('E-posta veya şifre hatalı');
    err.status = 401;
    throw err;
  }
  const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
  const { password: _, ...safeUser } = user;
  return { user: safeUser, token };
};

const getMe = async (userId) => {
  const user = await userModel.findById(userId);
  if (!user) {
    const err = new Error('Kullanıcı bulunamadı');
    err.status = 404;
    throw err;
  }
  return user;
};

const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await userModel.findByIdRaw(userId);
  if (!user) {
    const err = new Error('Kullanıcı bulunamadı');
    err.status = 404;
    throw err;
  }
  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) {
    const err = new Error('Mevcut şifre hatalı');
    err.status = 401;
    throw err;
  }
  const newHash = await bcrypt.hash(newPassword, 12);
  await userModel.updatePassword(userId, newHash);
};

const updateProfile = async (userId, { name }) => {
  if (!name || !name.trim()) {
    const err = new Error('Ad boş olamaz');
    err.status = 400;
    throw err;
  }
  return await userModel.updateName(userId, name.trim());
};

const deleteAccount = async (userId) => {
  await userModel.deleteById(userId);
};

const forgotPassword = async (email) => {
  const user = await userModel.findByEmail(email);
  // Always return silently to prevent email enumeration
  if (!user) return;

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await db.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [user.id]);
  await db.query(
    'INSERT INTO password_reset_tokens (user_id, otp_hash, expires_at) VALUES ($1, $2, $3)',
    [user.id, otpHash, expiresAt]
  );

  await emailService.sendOtp(email, otp);
};

const verifyOtp = async (email, otp) => {
  const user = await userModel.findByEmail(email);
  if (!user) {
    const err = new Error('Kod hatalı veya süresi dolmuş');
    err.status = 400;
    throw err;
  }

  const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
  const { rows } = await db.query(
    'SELECT * FROM password_reset_tokens WHERE user_id = $1 AND otp_hash = $2 AND expires_at > NOW()',
    [user.id, otpHash]
  );

  if (!rows[0]) {
    const err = new Error('Kod hatalı veya süresi dolmuş');
    err.status = 400;
    throw err;
  }

  // One-time use: delete token immediately after verification
  await db.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [user.id]);

  // Short-lived reset token (15 min), purpose field prevents misuse
  const resetToken = jwt.sign(
    { id: user.id, purpose: 'password_reset' },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
  return { resetToken };
};

const resetPassword = async (resetToken, newPassword) => {
  let payload;
  try {
    payload = jwt.verify(resetToken, process.env.JWT_SECRET);
  } catch {
    const err = new Error('Geçersiz veya süresi dolmuş oturum. Lütfen tekrar deneyin.');
    err.status = 400;
    throw err;
  }

  if (payload.purpose !== 'password_reset') {
    const err = new Error('Geçersiz token');
    err.status = 400;
    throw err;
  }

  if (!newPassword || newPassword.length < 6) {
    const err = new Error('Şifre en az 6 karakter olmalıdır');
    err.status = 400;
    throw err;
  }

  const newHash = await bcrypt.hash(newPassword, 12);
  await userModel.updatePassword(payload.id, newHash);
};

module.exports = {
  register, login, getMe, changePassword, updateProfile, deleteAccount,
  forgotPassword, verifyOtp, resetPassword,
};
