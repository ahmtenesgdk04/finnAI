const healthScoreService = require('../services/healthScoreService');

const getHealthScore = async (req, res, next) => {
  try {
    const result = await healthScoreService.calculatePersonalScore(req.user.id);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

module.exports = { getHealthScore };
