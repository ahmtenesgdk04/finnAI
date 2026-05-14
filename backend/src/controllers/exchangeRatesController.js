const https = require('https');

// TCMB XML feed'inden kur çek
const fetchRatesFromTCMB = () => {
  return new Promise((resolve) => {
    const url = 'https://www.tcmb.gov.tr/kurlar/today.xml';
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const usd = data.match(/Kod="USD"[^>]*>[\s\S]*?<BanknoteSelling>([\d,.]+)/)?.[1];
          const eur = data.match(/Kod="EUR"[^>]*>[\s\S]*?<BanknoteSelling>([\d,.]+)/)?.[1];
          const gbp = data.match(/Kod="GBP"[^>]*>[\s\S]*?<BanknoteSelling>([\d,.]+)/)?.[1];
          resolve({
            USD: parseFloat((usd || '32.5').replace(',', '.')),
            EUR: parseFloat((eur || '35.1').replace(',', '.')),
            GBP: parseFloat((gbp || '41.2').replace(',', '.')),
            GOLD: 2850, // gram altın sabit fallback
          });
        } catch {
          resolve({ USD: 32.5, EUR: 35.1, GBP: 41.2, GOLD: 2850 });
        }
      });
    }).on('error', () => {
      resolve({ USD: 32.5, EUR: 35.1, GBP: 41.2, GOLD: 2850 });
    });
  });
};

const getRates = async (req, res, next) => {
  try {
    const rates = await fetchRatesFromTCMB();
    res.json(rates);
  } catch (err) {
    next(err);
  }
};

module.exports = { getRates };
