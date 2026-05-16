const cashflowModel = require('../models/cashflowModel');
const aiService = require('./aiService');

const EMPTY_FORECAST = {
  forecast: {
    day30: { expectedIncome: 0, expectedExpense: 0, netCashflow: 0, confidence: 0 },
    day60: { expectedIncome: 0, expectedExpense: 0, netCashflow: 0, confidence: 0 },
    day90: { expectedIncome: 0, expectedExpense: 0, netCashflow: 0, confidence: 0 },
  },
  alerts: [{ type: 'info', message: 'Tahmin için yeterli veri yok. Gelir ve gider girişi yaparak başlayın.' }],
  insights: [],
  recommendation: 'Düzenli gelir ve gider girişi yaparak daha doğru tahminler alabilirsiniz.',
};

const getForecast = async (userId) => {
  const history = await cashflowModel.getMonthlyHistory(userId, 6);
  if (history.length === 0) return EMPTY_FORECAST;
  return aiService.forecastCashflow(history);
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

module.exports = { getForecast, getSummary, addExpense, addIncome };
