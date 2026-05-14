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

module.exports = { monthRange, formatMonth, successResponse, errorResponse };
