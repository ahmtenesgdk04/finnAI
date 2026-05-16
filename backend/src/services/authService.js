const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');

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

module.exports = { register, login, getMe, changePassword, updateProfile, deleteAccount };
