const https = require('https');
const http = require('http');

const checkSSL = (url) => url.startsWith('https://');

const getDomainFromUrl = (url) => {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
};

// Basit HTTP GET ile sayfa başlığını çek
const fetchPageTitle = (url) => {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(null), 5000);
    const proto = url.startsWith('https') ? https : http;
    const req = proto.get(url, { timeout: 4000 }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; if (data.length > 8000) req.destroy(); });
      res.on('end', () => {
        clearTimeout(timeout);
        const match = data.match(/<title[^>]*>([^<]*)<\/title>/i);
        resolve(match ? match[1].trim() : null);
      });
    });
    req.on('error', () => { clearTimeout(timeout); resolve(null); });
  });
};

const scrapeBasicInfo = async (url) => {
  const domain = getDomainFromUrl(url);
  const hasSSL = checkSSL(url);
  const title = await fetchPageTitle(url).catch(() => null);

  // Domain yaşı heuristik: tanınan markalar + basit kontrol
  const knownBrands = ['hepsiburada', 'trendyol', 'amazon', 'n11', 'gittigidiyor', 'morhipo', 'lcwaikiki'];
  const isKnownBrand = knownBrands.some((b) => domain.includes(b));

  return { domain, hasSSL, title, isKnownBrand };
};

module.exports = { scrapeBasicInfo, getDomainFromUrl, checkSSL };
