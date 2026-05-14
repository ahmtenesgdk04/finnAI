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

module.exports = { generateToken, hashPassword, comparePassword, formatCurrency, calculateDaysOverdue };
