const cashflowModel = require('../models/cashflowModel');
const aiService = require('./aiService');

const getEmptyForecast = (period = 'short') => {
  const zero = { expectedIncome: 0, expectedExpense: 0, netCashflow: 0, confidence: 0 };
  const forecast =
    period === 'medium'
      ? { month6: zero, month9: zero, month12: zero }
      : period === 'long'
      ? { year1: zero, year2: zero, year3: zero }
      : { day30: zero, day60: zero, day90: zero };
  return {
    forecast,
    alerts: [{ type: 'info', message: 'Tahmin icin yeterli veri yok. Gelir ve gider girisi yaparak baslayin.' }],
    insights: [],
    recommendation: 'Duzenli gelir ve gider girisi yaparak daha dogru tahminler alabilirsiniz.',
  };
};

const getForecast = async (userId, period = 'short') => {
  const months = period === 'long' ? 24 : period === 'medium' ? 12 : 6;
  const history = await cashflowModel.getMonthlyHistory(userId, months);
  if (history.length === 0) return getEmptyForecast(period);
  return aiService.forecastCashflow(history, period);
};

const getSummary = async (userId) => {
  const [history, recentEntries, currentMonth] = await Promise.all([
    cashflowModel.getMonthlyHistory(userId, 3),
    cashflowModel.getRecentEntries(userId, 10),
    cashflowModel.getCurrentMonthTotals(userId),
  ]);
  return { history, recentEntries, currentMonth };
};

const addExpense = async (userId, data) => cashflowModel.addExpense(userId, data);
const addIncome = async (userId, data) => cashflowModel.addIncome(userId, data);

const analyzeExpenses = async (userId) => {
  const history = await cashflowModel.getMonthlyHistory(userId, 3);
  if (history.length === 0) {
    return {
      score: 0,
      summary: 'Henüz gider verisi bulunmuyor.',
      savings: [],
      anomalies: [],
      topExpenseCategories: [],
      recommendation: 'Önce gider ve gelir kayıtları ekleyerek analiz yapabilirsiniz.',
    };
  }
  return aiService.analyzeExpenses(history);
};

module.exports = { getForecast, getSummary, addExpense, addIncome, analyzeExpenses };

