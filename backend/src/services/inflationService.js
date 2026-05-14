// TÜİK bazlı sabit enflasyon tablosu (gerçek API entegrasyonuna hazır)
const INFLATION_TABLE = {
  '2024-01': { general: 64.86, market: 68.5, kira: 72.1, fatura: 60.2, saglik: 55.3 },
  '2024-02': { general: 67.07, market: 70.2, kira: 73.8, fatura: 62.1, saglik: 57.0 },
  '2024-03': { general: 68.50, market: 71.0, kira: 74.5, fatura: 63.5, saglik: 58.2 },
  '2024-04': { general: 69.80, market: 72.3, kira: 75.0, fatura: 64.0, saglik: 59.1 },
  '2024-05': { general: 75.45, market: 78.1, kira: 76.2, fatura: 65.8, saglik: 61.0 },
  '2024-06': { general: 71.60, market: 74.0, kira: 73.5, fatura: 67.2, saglik: 62.3 },
  '2024-07': { general: 61.78, market: 65.2, kira: 70.1, fatura: 63.0, saglik: 60.5 },
  '2024-08': { general: 51.97, market: 55.4, kira: 66.3, fatura: 58.1, saglik: 56.7 },
  '2024-09': { general: 49.38, market: 52.1, kira: 63.5, fatura: 54.3, saglik: 53.2 },
  '2024-10': { general: 48.58, market: 51.0, kira: 61.2, fatura: 52.5, saglik: 51.8 },
  '2024-11': { general: 47.09, market: 49.8, kira: 59.0, fatura: 50.1, saglik: 50.3 },
  '2024-12': { general: 44.38, market: 47.2, kira: 57.1, fatura: 48.5, saglik: 48.9 },
  '2025-01': { general: 42.12, market: 44.8, kira: 55.0, fatura: 46.2, saglik: 47.5 },
  '2025-02': { general: 39.05, market: 41.5, kira: 53.2, fatura: 44.0, saglik: 46.1 },
  '2025-03': { general: 38.10, market: 40.2, kira: 52.0, fatura: 43.1, saglik: 45.5 },
};

const CATEGORY_MAP = {
  market: 'market',
  kira: 'kira',
  fatura: 'fatura',
  sağlık: 'saglik',
  saglik: 'saglik',
};

const getMonthlyInflation = (monthStr) => {
  return INFLATION_TABLE[monthStr] || INFLATION_TABLE['2025-03'];
};

const getCategoryInflation = (category, monthStr) => {
  const data = getMonthlyInflation(monthStr);
  const key = CATEGORY_MAP[category?.toLowerCase()] || 'general';
  return data[key] ?? data.general;
};

const calculateRealChange = (nominalChange, inflationRate) => {
  return ((1 + nominalChange / 100) / (1 + inflationRate / 100) - 1) * 100;
};

module.exports = { getMonthlyInflation, getCategoryInflation, calculateRealChange };
