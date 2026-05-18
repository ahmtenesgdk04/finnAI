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

const fetchPageInfo = (url, depth = 0) => {
  return new Promise((resolve) => {
    if (depth > 3) return resolve({ title: null, reachable: false });
    const timeout = setTimeout(() => resolve({ title: null, reachable: false }), 8000);
    const proto = url.startsWith('https') ? https : http;
    const options = {
      timeout: 7000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    };
    const req = proto.get(url, options, (res) => {
      // Yönlendirmeleri takip et
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        clearTimeout(timeout);
        req.destroy();
        const next = res.headers.location.startsWith('http') ? res.headers.location : new URL(res.headers.location, url).href;
        fetchPageInfo(next, depth + 1).then(resolve);
        return;
      }
      // Sunucu yanıt verdi (403 dahil) → erişilebilir
      const reachable = true;
      let data = '';
      res.on('data', (chunk) => { data += chunk; if (data.length > 12000) req.destroy(); });
      res.on('end', () => {
        clearTimeout(timeout);
        const match = data.match(/<title[^>]*>([^<]*)<\/title>/i);
        resolve({ title: match ? match[1].trim() : null, reachable });
      });
      res.on('error', () => { clearTimeout(timeout); resolve({ title: null, reachable }); });
    });
    req.on('error', () => { clearTimeout(timeout); resolve({ title: null, reachable: false }); });
  });
};

const scrapeBasicInfo = async (url) => {
  const domain = getDomainFromUrl(url);
  const hasSSL = checkSSL(url);
  const { title, reachable } = await fetchPageInfo(url).catch(() => ({ title: null, reachable: false }));

  const knownBrands = ['hepsiburada', 'trendyol', 'amazon', 'n11', 'gittigidiyor', 'morhipo', 'lcwaikiki'];
  const isKnownBrand = knownBrands.some((b) => domain.includes(b));

  return { domain, hasSSL, title, isKnownBrand, reachable };
};

module.exports = { scrapeBasicInfo, getDomainFromUrl, checkSSL };
