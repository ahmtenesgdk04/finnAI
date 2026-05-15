const budgetModel = require('../models/budgetModel');
const expenseModel = require('../models/expenseModel');
const geminiService = require('./geminiService');
const inflationService = require('./inflationService');
const { monthRange, formatMonth } = require('../utils/helpers');

const setLimit = async (userId, category, monthlyLimit) => {
  return budgetModel.setLimit(userId, category, monthlyLimit);
};

const analyzeBudget = async (userId) => {
  const months = [];
  for (let i = 2; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push(formatMonth(d));
  }

  const monthlyData = [];
  for (const month of months) {
    const { start, end } = monthRange(month);
    const entries = await expenseModel.findByUserAndMonth(userId, start, end);
    const categoryTotals = {};
    for (const e of entries) {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + parseFloat(e.amount);
    }
    monthlyData.push({ month, categories: categoryTotals });
  }

  const currentMonth = formatMonth();
  const inflationData = inflationService.getMonthlyInflation(currentMonth);
  const insight = await geminiService.analyzeBudget(monthlyData, inflationData);
  return { insight, months: monthlyData };
};

const createGoal = async (userId, goalData) => budgetModel.createGoal({ userId, ...goalData });
const getGoals = async (userId) => budgetModel.getGoals(userId);
const updateGoal = async (id, userId, fields) => budgetModel.updateGoal(id, userId, fields);
const deleteGoal = async (id, userId) => budgetModel.deleteGoal(id, userId);

module.exports = { setLimit, analyzeBudget, createGoal, getGoals, updateGoal, deleteGoal };
