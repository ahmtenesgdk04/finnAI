const expenseService = require('../services/expenseService');
const { formatMonth } = require('../utils/helpers');

const addEntry = async (req, res, next) => {
  try {
    const { amount, category, date, note } = req.body;
    if (!amount || !category || !date) {
      return res.status(400).json({ success: false, message: 'Tutar, kategori ve tarih zorunludur' });
    }
    const entry = await expenseService.addEntry(req.user.id, { amount, category, date, note });
    res.status(201).json({ success: true, entry });
  } catch (err) {
    next(err);
  }
};

const getSummary = async (req, res, next) => {
  try {
    const month = req.query.month || formatMonth();
    const summary = await expenseService.getSummary(req.user.id, month);
    res.json({ success: true, ...summary });
  } catch (err) {
    next(err);
  }
};

module.exports = { addEntry, getSummary };
