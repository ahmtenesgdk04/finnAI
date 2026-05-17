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

const fetchPageTitle = (url) => {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(null), 8000);
    const proto = url.startsWith('https') ? https : http;
    const options = {
      timeout: 7000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8',
      },
    };
    const req = proto.get(url, options, (res) => {
      // Yönlendirmeleri takip et
      if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
        clearTimeout(timeout);
        req.destroy();
        fetchPageTitle(res.headers.location).then(resolve);
        return;
      }
      let data = '';
      res.on('data', (chunk) => { data += chunk; if (data.length > 12000) req.destroy(); });
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
