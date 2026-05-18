const expenseModel = require('../models/expenseModel');
const budgetModel = require('../models/budgetModel');
const { monthRange } = require('../utils/helpers');

const addEntry = async (userId, { amount, category, date, note }) => {
  return expenseModel.create({ userId, amount, category, date, note });
};

const getSummary = async (userId, monthStr) => {
  const { start, end } = monthRange(monthStr);
  const entries = await expenseModel.findByUserAndMonth(userId, start, end);
  const limits = await budgetModel.getLimits(userId);

  const limitsMap = Object.fromEntries(limits.map((l) => [l.category, parseFloat(l.monthly_limit)]));

  const categoryTotals = {};
  for (const e of entries) {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + parseFloat(e.amount);
  }

  const categories = Object.entries(categoryTotals).map(([category, amount]) => ({
    category,
    amount,
    limit: limitsMap[category] || null,
  }));

  const total = entries.reduce((sum, e) => sum + parseFloat(e.amount), 0);

  return {
    month: monthStr,
    total,
    budget: limits.reduce((s, l) => s + parseFloat(l.monthly_limit), 0) || 1000000,
    categories,
    entries,
  };
};

module.exports = { addEntry, getSummary };
