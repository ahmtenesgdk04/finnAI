const aiService = require('../services/aiService');

exports.analyze = async (req, res, next) => {
  try {
    const { supplierName, productType, estimatedAmount } = req.body;
    const result = await aiService.analyzeSupplier(supplierName, productType, estimatedAmount);
    res.json(result);
  } catch (err) {
    next(err);
  }
};
