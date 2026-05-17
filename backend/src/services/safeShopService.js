const safeShopModel = require('../models/safeShopModel');
const scrapingService = require('./scrapingService');
const geminiService = require('./geminiService');

const heuristicAnalysis = (url, siteData) => {
  const { hasSSL, isKnownBrand, domain, title } = siteData;

  let score = 40;
  const layers = [];

  // SSL kontrolü
  if (hasSSL) {
    score += 20;
    layers.push({ name: 'SSL Güvenliği', result: 'Site HTTPS ile şifreli bağlantı kullanıyor.', status: 'ok' });
  } else {
    score -= 15;
    layers.push({ name: 'SSL Güvenliği', result: 'Site HTTP kullanıyor, bağlantı şifrelenmemiş.', status: 'danger' });
  }

  // Bilinen marka kontrolü
  if (isKnownBrand) {
    score += 30;
    layers.push({ name: 'Domain Güvenilirliği', result: `${domain} tanınan bir Türk e-ticaret markasıdır.`, status: 'ok' });
  } else {
    layers.push({ name: 'Domain Güvenilirliği', result: 'Tanınmış markalar listesinde bulunamadı.', status: 'warning' });
  }

  // Domain uzunluğu / karmaşıklık
  const suspicious = /(\d{4,}|-{2,}|\.ru|\.cn|phish|fake|login-|secure-)/.test(domain);
  if (suspicious) {
    score -= 20;
    layers.push({ name: 'İçerik Analizi', result: 'Domain adında şüpheli desenler tespit edildi.', status: 'danger' });
  } else {
    layers.push({ name: 'İçerik Analizi', result: 'Domain adında belirgin şüpheli unsur bulunamadı.', status: 'ok' });
  }

  // Sayfa başlığı
  if (title) {
    layers.push({ name: 'İtibar Kontrolü', result: `Site başlığı alındı: "${title.substring(0, 60)}".`, status: 'ok' });
  } else {
    score -= 5;
    layers.push({ name: 'İtibar Kontrolü', result: 'Sayfa başlığı alınamadı veya site yanıt vermedi.', status: 'warning' });
  }

  score = Math.max(0, Math.min(100, score));
  const level = score >= 70 ? 'green' : score >= 40 ? 'yellow' : 'red';

  const summaryMap = {
    green: `${domain} güvenli görünüyor. SSL sertifikası mevcut${isKnownBrand ? ' ve tanınmış bir marka' : ''}.`,
    yellow: `${domain} için bazı belirsizlikler var. Kişisel bilgilerinizi paylaşmadan önce dikkatli olun.`,
    red: `${domain} güvenlik açıkları içeriyor. Bu siteden alışveriş yapmamanızı öneririz.`,
  };

  layers.push({ name: 'Genel Değerlendirme', result: summaryMap[level], status: level === 'green' ? 'ok' : level === 'yellow' ? 'warning' : 'danger' });

  return { score, level, summary: summaryMap[level], layers };
};

const analyzeUrl = async (userId, url) => {
  const cached = await safeShopModel.findByUrl(url);
  if (cached) return cached.result;

  const siteData = await scrapingService.scrapeBasicInfo(url);

  let result;
  try {
    result = await geminiService.analyzeShopSecurity(url, siteData);
  } catch {
    result = heuristicAnalysis(url, siteData);
  }

  if (siteData.isKnownBrand && result.score < 85) {
    result.score = Math.min(result.score + 15, 95);
    result.level = result.score >= 70 ? 'green' : result.score >= 40 ? 'yellow' : 'red';
  }

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
