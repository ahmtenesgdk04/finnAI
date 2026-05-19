const budgetModel = require('../models/budgetModel');
const expenseModel = require('../models/expenseModel');
const geminiService = require('./geminiService');
const inflationService = require('./inflationService');
const { monthRange, formatMonth } = require('../utils/helpers');

const getLimits = async (userId) => budgetModel.getLimits(userId);

const setLimit = async (userId, category, monthlyLimit) => {
  return budgetModel.setLimit(userId, category, monthlyLimit);
};

const analyzeBudget = async (userId) => {
  const currentMonth = formatMonth();
  const { start, end } = monthRange(currentMonth);
  const entries = await expenseModel.findByUserAndMonth(userId, start, end);
  const categoryTotals = {};
  for (const e of entries) {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + parseFloat(e.amount);
  }
  const monthlyData = [{ month: currentMonth, categories: categoryTotals }];

  const inflationData = inflationService.getMonthlyInflation(currentMonth);
  const analysis = await geminiService.analyzeBudget(monthlyData, inflationData);
  return { ...analysis, months: monthlyData };
};

const createGoal = async (userId, goalData) => budgetModel.createGoal({ userId, ...goalData });
const getGoals = async (userId) => budgetModel.getGoals(userId);
const updateGoal = async (id, userId, fields) => budgetModel.updateGoal(id, userId, fields);
const deleteGoal = async (id, userId) => budgetModel.deleteGoal(id, userId);

module.exports = { getLimits, setLimit, analyzeBudget, createGoal, getGoals, updateGoal, deleteGoal };
