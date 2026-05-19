const budgetService = require('../services/budgetService');

const getLimits = async (req, res, next) => {
  try {
    const limits = await budgetService.getLimits(req.user.id);
    res.json({ success: true, limits });
  } catch (err) {
    next(err);
  }
};

const setLimit = async (req, res, next) => {
  try {
    const { category, monthlyLimit } = req.body;
    if (!category || monthlyLimit === undefined) {
      return res.status(400).json({ success: false, message: 'Kategori ve limit zorunludur' });
    }
    const limit = await budgetService.setLimit(req.user.id, category, monthlyLimit);
    res.json({ success: true, limit });
  } catch (err) {
    next(err);
  }
};

const analyzeBudget = async (req, res, next) => {
  try {
    const result = await budgetService.analyzeBudget(req.user.id);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const createGoal = async (req, res, next) => {
  try {
    const { name, targetAmount, targetDate, currentAmount } = req.body;
    if (!name || !targetAmount || !targetDate) {
      return res.status(400).json({ success: false, message: 'Ad, hedef tutar ve tarih zorunludur' });
    }
    const goal = await budgetService.createGoal(req.user.id, { name, targetAmount, targetDate, currentAmount });
    res.status(201).json({ success: true, goal });
  } catch (err) {
    next(err);
  }
};

const getGoals = async (req, res, next) => {
  try {
    const goals = await budgetService.getGoals(req.user.id);
    res.json(goals);
  } catch (err) {
    next(err);
  }
};

const updateGoal = async (req, res, next) => {
  try {
    const goal = await budgetService.updateGoal(req.params.id, req.user.id, req.body);
    if (!goal) return res.status(404).json({ success: false, message: 'Hedef bulunamadı' });
    res.json({ success: true, goal });
  } catch (err) {
    next(err);
  }
};

const deleteGoal = async (req, res, next) => {
  try {
    const deleted = await budgetService.deleteGoal(req.params.id, req.user.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Hedef bulunamadı' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

module.exports = { getLimits, setLimit, analyzeBudget, createGoal, getGoals, updateGoal, deleteGoal };
