const expenseService = require('../services/expenseService');
const geminiService = require('../services/geminiService');
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

const suggestCategory = async (req, res, next) => {
  try {
    const { note, amount } = req.body;
    if (!note) return res.status(400).json({ success: false, message: 'Not zorunludur' });
    const category = await geminiService.suggestCategory(note, amount || 0);
    res.json({ success: true, category });
  } catch (err) {
    next(err);
  }
};

const analyzeExpenses = async (req, res, next) => {
  try {
    const month = req.query.month || formatMonth();
    const summary = await expenseService.getSummary(req.user.id, month);
    const insight = await geminiService.analyzeExpenses(
      summary.entries || [],
      summary.total || 0,
      summary.budget || 10000
    );
    res.json({ success: true, insight });
  } catch (err) {
    next(err);
  }
};

module.exports = { addEntry, getSummary, suggestCategory, analyzeExpenses };
