const collectionModel = require('../models/collectionModel');
const aiService = require('../services/aiService');

exports.getAll = async (req, res, next) => {
  try {
    const data = await collectionModel.getAll(req.user.id);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

exports.add = async (req, res, next) => {
  try {
    const { customerName, amount, dueDate } = req.body;
    const data = await collectionModel.add(req.user.id, { customerName, amount, dueDate });
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
};

exports.markPaid = async (req, res, next) => {
  try {
    const data = await collectionModel.markPaid(req.user.id, req.params.id);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await collectionModel.remove(req.user.id, req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

exports.analyze = async (req, res, next) => {
  try {
    const all = await collectionModel.getAll(req.user.id);
    const unpaid = all.filter((c) => !c.paid);
    if (unpaid.length === 0) {
      return res.json({ scores: [], totalAtRisk: 0, summary: 'Bekleyen alacak bulunmuyor.' });
    }
    const result = await aiService.scoreCollections(unpaid);
    res.json(result);
  } catch (err) {
    next(err);
  }
};
