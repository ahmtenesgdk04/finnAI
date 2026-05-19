const https = require('https');

// 5 dakika cache
let cache = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000;

// 1 saat history cache (kod → {data, time})
const historyCache = {};
const HISTORY_TTL = 60 * 60 * 1000;

const FOREX_CODES = ['USD', 'EUR', 'GBP', 'CHF', 'JPY', 'CAD', 'AUD', 'SAR', 'CNY', 'NOK'];
const COINGECKO_IDS = { BTC: 'bitcoin', ETH: 'ethereum', GOLD: 'pax-gold' };

const fetchUrl = (opts) =>
  new Promise((resolve) => {
    const req = https.get(opts, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve(data));
    });
    req.on('error', () => resolve(null));
    req.setTimeout(8000, () => { req.destroy(); resolve(null); });
  });

const fetchForexHistory = async (code, days = 30) => {
  const base = code.toLowerCase();
  const dates = Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    return d.toISOString().split('T')[0];
  });

  const results = await Promise.all(
    dates.map(async (date) => {
      const raw = await fetchUrl(
        `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${date}/v1/currencies/${base}.min.json`
      );
      if (!raw) return null;
      try {
        const d = JSON.parse(raw);
        const val = d[base]?.try;
        if (!val) return null;
        const unit = code === 'JPY' ? 100 : 1;
        return { date, value: parseFloat((val * unit).toFixed(4)) };
      } catch { return null; }
    })
  );
  return results.filter(Boolean);
};

const fetchCryptoHistory = async (code, days = 30) => {
  const id = COINGECKO_IDS[code];
  if (!id) return [];
  const raw = await fetchUrl({
    hostname: 'api.coingecko.com',
    path: `/api/v3/coins/${id}/market_chart?vs_currency=try&days=${days}&interval=daily`,
    headers: { 'User-Agent': 'FinnAI/1.0' },
  });
  if (!raw) return [];
  try {
    const d = JSON.parse(raw);
    const seen = new Set();
    return (d.prices || [])
      .map(([ts, price]) => ({
        date: new Date(ts).toISOString().split('T')[0],
        value: code === 'GOLD' ? Math.round(price / 31.1035) : Math.round(price),
      }))
      .filter(({ date }) => !seen.has(date) && seen.add(date));
  } catch { return []; }
};

const TCMB_CURRENCIES = [
  { code: 'USD', name: 'Amerikan Doları', unit: 1 },
  { code: 'EUR', name: 'Euro', unit: 1 },
  { code: 'GBP', name: 'İngiliz Sterlini', unit: 1 },
  { code: 'CHF', name: 'İsviçre Frangı', unit: 1 },
  { code: 'JPY', name: 'Japon Yeni', unit: 100 },
  { code: 'CAD', name: 'Kanada Doları', unit: 1 },
  { code: 'AUD', name: 'Avustralya Doları', unit: 1 },
  { code: 'SAR', name: 'Suudi Riyali', unit: 1 },
  { code: 'CNY', name: 'Çin Yuanı', unit: 1 },
  { code: 'NOK', name: 'Norveç Kronu', unit: 1 },
];

const fetchTCMB = () => new Promise((resolve) => {
  https.get('https://www.tcmb.gov.tr/kurlar/today.xml', (res) => {
    let data = '';
    res.on('data', (c) => (data += c));
    res.on('end', () => {
      const results = {};
      for (const { code, name, unit } of TCMB_CURRENCIES) {
        const block = data.match(new RegExp(`Kod="${code}"[\\s\\S]*?</Currency>`))?.[0];
        if (!block) continue;
        const banknote = block.match(/<BanknoteSelling>([\d,.]+)<\/BanknoteSelling>/)?.[1];
        const forex = block.match(/<ForexSelling>([\d,.]+)<\/ForexSelling>/)?.[1];
        const raw = banknote || forex;
        if (raw) results[code] = { name, value: parseFloat((parseFloat(raw.replace(',', '.')) / unit).toFixed(4)) };
      }
      resolve(results);
    });
  }).on('error', () => resolve({}));
});

const fetchCoinGecko = () => new Promise((resolve) => {
  const path = '/api/v3/simple/price?ids=bitcoin,ethereum,pax-gold&vs_currencies=try';
  https.get({ hostname: 'api.coingecko.com', path, headers: { 'User-Agent': 'FinnAI/1.0' } }, (res) => {
    let data = '';
    res.on('data', (c) => (data += c));
    res.on('end', () => {
      try {
        const d = JSON.parse(data);
        resolve({
          BTC: { name: 'Bitcoin', value: d.bitcoin?.try ?? null },
          ETH: { name: 'Ethereum', value: d.ethereum?.try ?? null },
          GOLD: { name: 'Gram Altın', value: d['pax-gold']?.try ? Math.round(d['pax-gold'].try / 31.1035) : null },
        });
      } catch { resolve({}); }
    });
  }).on('error', () => resolve({}));
});

const getRates = async (req, res, next) => {
  try {
    if (cache && Date.now() - cacheTime < CACHE_TTL) {
      return res.json(cache);
    }

    const [tcmb, crypto] = await Promise.all([fetchTCMB(), fetchCoinGecko()]);

    const response = {
      sections: [
        {
          title: 'Döviz',
          items: TCMB_CURRENCIES
            .filter(({ code }) => tcmb[code])
            .map(({ code }) => ({ code, name: tcmb[code].name, value: tcmb[code].value })),
        },
        {
          title: 'Emtia',
          items: [
            crypto.GOLD?.value ? { code: 'GOLD', name: 'Gram Altın', value: crypto.GOLD.value } : null,
          ].filter(Boolean),
        },
        {
          title: 'Kripto',
          items: [
            crypto.BTC?.value ? { code: 'BTC', name: 'Bitcoin', value: crypto.BTC.value } : null,
            crypto.ETH?.value ? { code: 'ETH', name: 'Ethereum', value: crypto.ETH.value } : null,
          ].filter(Boolean),
        },
      ].filter((s) => s.items.length > 0),
      updatedAt: new Date().toISOString(),
    };

    cache = response;
    cacheTime = Date.now();

    res.json(response);
  } catch (err) {
    next(err);
  }
};

const getHistory = async (req, res, next) => {
  try {
    const code = req.params.code.toUpperCase();
    const cached = historyCache[code];
    if (cached && Date.now() - cached.time < HISTORY_TTL) {
      return res.json(cached.data);
    }

    let history;
    if (COINGECKO_IDS[code]) {
      history = await fetchCryptoHistory(code);
    } else if (FOREX_CODES.includes(code)) {
      history = await fetchForexHistory(code);
    } else {
      return res.status(400).json({ error: 'Desteklenmeyen kod' });
    }

    if (!history.length) return res.status(503).json({ error: 'Veri alınamadı' });

    historyCache[code] = { data: history, time: Date.now() };
    res.json(history);
  } catch (err) {
    next(err);
  }
};

module.exports = { getRates, getHistory };
