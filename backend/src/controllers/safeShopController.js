const safeShopService = require('../services/safeShopService');

const analyzeUrl = async (req, res, next) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ success: false, message: 'URL zorunludur' });
    const result = await safeShopService.analyzeUrl(req.user.id, url);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

module.exports = { analyzeUrl };
