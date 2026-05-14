const jwt = require('jsonwebtoken');
const { errorResponse } = require('../utils/helpers');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(res, 'Token gerekli', 401);
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return errorResponse(res, 'Geçersiz veya süresi dolmuş token', 401);
  }
};

module.exports = { verifyToken };
