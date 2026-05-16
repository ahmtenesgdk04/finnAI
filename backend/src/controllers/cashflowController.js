const cashflowService = require('../services/cashflowService');

const forecast = async (req, res, next) => {
  try {
    const result = await cashflowService.getForecast(req.user.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const summary = async (req, res, next) => {
  try {
    const result = await cashflowService.getSummary(req.user.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const addExpense = async (req, res, next) => {
  try {
    const entry = await cashflowService.addExpense(req.user.id, req.body);
    res.status(201).json(entry);
  } catch (err) {
    next(err);
  }
};

const addIncome = async (req, res, next) => {
  try {
    const entry = await cashflowService.addIncome(req.user.id, req.body);
    res.status(201).json(entry);
  } catch (err) {
    next(err);
  }
};

module.exports = { forecast, summary, addExpense, addIncome };
