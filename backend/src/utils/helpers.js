const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const hashPassword = (password) => bcrypt.hash(password, 12);

const comparePassword = (password, hash) => bcrypt.compare(password, hash);

const formatCurrency = (amount) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);

const calculateDaysOverdue = (dueDate) => {
  const diff = Math.floor((Date.now() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
};

const monthRange = (monthStr) => {
  const [year, month] = monthStr.split('-').map(Number);
  const start = new Date(year, month - 1, 1).toISOString().split('T')[0];
  const end = new Date(year, month, 0).toISOString().split('T')[0];
  return { start, end };
};

const formatMonth = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};

const successResponse = (res, data, statusCode = 200) =>
  res.status(statusCode).json({ success: true, ...data });

const errorResponse = (res, message, statusCode = 400) =>
  res.status(statusCode).json({ success: false, message });

module.exports = {
  generateToken, hashPassword, comparePassword, formatCurrency, calculateDaysOverdue,
  monthRange, formatMonth, successResponse, errorResponse,
};
