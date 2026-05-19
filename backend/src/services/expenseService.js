const expenseModel = require('../models/expenseModel');
const budgetModel = require('../models/budgetModel');
const incomeModel = require('../models/incomeModel');
const { monthRange } = require('../utils/helpers');

const addEntry = async (userId, { amount, category, date, note }) => {
  return expenseModel.create({ userId, amount, category, date, note });
};

const getSummary = async (userId, monthStr) => {
  const { start, end } = monthRange(monthStr);
  const [entries, limits, incomeEntries] = await Promise.all([
    expenseModel.findByUserAndMonth(userId, start, end),
    budgetModel.getLimits(userId),
    incomeModel.getByMonth(userId, monthStr),
  ]);

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

  const incomeTotal = incomeEntries.reduce((s, e) => s + parseFloat(e.amount), 0);
  const baseLimit = limits.reduce((s, l) => s + parseFloat(l.monthly_limit), 0) || 1_000_000;
  const budget = baseLimit + incomeTotal;

  const incomeAsEntries = incomeEntries.map((e) => ({
    id: e.id,
    amount: -parseFloat(e.amount),
    category: 'Gelir',
    date: e.created_at,
    note: e.description || 'Gelir',
    isIncome: true,
  }));

  const allEntries = [...entries, ...incomeAsEntries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return {
    month: monthStr,
    total,
    budget,
    incomeTotal,
    categories,
    entries: allEntries,
  };
};

module.exports = { addEntry, getSummary };
