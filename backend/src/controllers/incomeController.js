const incomeModel = require('../models/incomeModel');
const { formatMonth } = require('../utils/helpers');

const addIncome = async (req, res, next) => {
  try {
    const { amount, description, month } = req.body;
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Geçerli bir tutar girin' });
    }
    const m = month || formatMonth();
    const entry = await incomeModel.add(req.user.id, {
      amount: parseFloat(amount),
      description,
      month: m,
    });
    res.status(201).json(entry);
  } catch (err) {
    next(err);
  }
};

const getIncome = async (req, res, next) => {
  try {
    const month = req.query.month || formatMonth();
    const entries = await incomeModel.getByMonth(req.user.id, month);
    const total = entries.reduce((s, e) => s + parseFloat(e.amount), 0);
    res.json({ month, entries, total });
  } catch (err) {
    next(err);
  }
};

const deleteIncome = async (req, res, next) => {
  try {
    const ok = await incomeModel.remove(req.params.id, req.user.id);
    if (!ok) return res.status(404).json({ error: 'Kayıt bulunamadı' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

module.exports = { addIncome, getIncome, deleteIncome };
