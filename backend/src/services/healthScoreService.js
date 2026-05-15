const expenseModel = require('../models/expenseModel');
const budgetModel = require('../models/budgetModel');
const coachModel = require('../models/coachModel');
const aiService = require('./aiService');
const { monthRange, formatMonth } = require('../utils/helpers');

const calculatePersonalScore = async (userId) => {
  const month = formatMonth();
  const { start, end } = monthRange(month);
  const entries = await expenseModel.findByUserAndMonth(userId, start, end);
  const limits = await budgetModel.getLimits(userId);
  const goals = await budgetModel.getGoals(userId);
  const progress = await coachModel.getProgress(userId);

  const total = entries.reduce((s, e) => s + parseFloat(e.amount), 0);
  const totalLimit = limits.reduce((s, l) => s + parseFloat(l.monthly_limit), 0) || 10000;

  // Skorlama kriterleri (her biri 25 puan max)
  const budgetScore = Math.min(25, Math.max(0, 25 * (1 - total / totalLimit)));

  const overLimitCount = limits.filter((l) => {
    const spent = entries
      .filter((e) => e.category === l.category)
      .reduce((s, e) => s + parseFloat(e.amount), 0);
    return spent > parseFloat(l.monthly_limit);
  }).length;
  const limitsScore = Math.max(0, 25 - overLimitCount * 8);

  const activeGoals = goals.filter((g) => parseFloat(g.current_amount) < parseFloat(g.target_amount));
  const goalsScore = activeGoals.length > 0 ? Math.min(25, activeGoals.length * 12) : 5;

  const educationScore = Math.min(25, Math.floor(progress.xp / 20));

  const total_score = Math.round(budgetScore + limitsScore + goalsScore + educationScore);

  const scoreData = {
    total_score,
    budgetScore,
    limitsScore,
    goalsScore,
    educationScore,
    totalSpent: total,
    totalLimit,
    activeGoalsCount: activeGoals.length,
    xp: progress.xp,
  };

  const aiResult = await aiService.generateHealthInsights(scoreData).catch(() => ({
    insights: [],
    warnings: [],
  }));

  return {
    personal: total_score,
    breakdown: { budget: budgetScore, limits: limitsScore, goals: goalsScore, education: educationScore },
    insights: aiResult.insights,
    warnings: aiResult.warnings,
  };
};

module.exports = { calculatePersonalScore };
