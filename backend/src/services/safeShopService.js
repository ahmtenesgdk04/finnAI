const safeShopModel = require('../models/safeShopModel');
const scrapingService = require('./scrapingService');
const aiService = require('./aiService');

const analyzeUrl = async (userId, url) => {
  // Önbellekte var mı?
  const cached = await safeShopModel.findByUrl(url);
  if (cached) return cached.result;

  // Temel site bilgilerini topla
  const siteData = await scrapingService.scrapeBasicInfo(url);

  // AI analizi
  const result = await aiService.analyzeShopSecurity(url, siteData);

  // Bilinen markalara bonus puan
  if (siteData.isKnownBrand && result.score < 85) {
    result.score = Math.min(result.score + 15, 95);
    result.level = result.score >= 70 ? 'green' : result.score >= 40 ? 'yellow' : 'red';
  }

  // Kaydet
  await safeShopModel.saveQuery({
    userId,
    url,
    score: result.score,
    level: result.level,
    result,
  });

  return result;
};

module.exports = { analyzeUrl };
