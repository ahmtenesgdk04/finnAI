const userModel = require('../models/userModel');
const { hashPassword, comparePassword, generateToken } = require('../utils/helpers');

const register = async ({ name, email, password }) => {
  const existing = await userModel.findByEmail(email);
  if (existing) {
    const err = new Error('Bu e-posta zaten kayıtlı');
    err.status = 409;
    throw err;
  }
  const passwordHash = await hashPassword(password);
  const user = await userModel.create({ name, email, passwordHash });
  const token = generateToken(user.id);
  return { user, token };
};

const login = async ({ email, password }) => {
  const user = await userModel.findByEmail(email);
  if (!user) {
    const err = new Error('E-posta veya şifre hatalı');
    err.status = 401;
    throw err;
  }
  const valid = await comparePassword(password, user.password_hash);
  if (!valid) {
    const err = new Error('E-posta veya şifre hatalı');
    err.status = 401;
    throw err;
  }
  const { password_hash, ...safeUser } = user;
  const token = generateToken(user.id);
  return { user: safeUser, token };
};

const getMe = async (userId) => userModel.findById(userId);

const updateMode = async (userId, mode) => userModel.updateMode(userId, mode);

module.exports = { register, login, getMe, updateMode };
