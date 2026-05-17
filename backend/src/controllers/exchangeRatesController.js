const https = require('https');

// 5 dakika cache
let cache = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000;

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

module.exports = { getRates };
