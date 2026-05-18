const { GoogleGenerativeAI } = require('@google/generative-ai');

let client;
const getClient = () => {
  if (!client) client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return client;
};

const generateText = async (prompt, maxOutputTokens = 8192) => {
  const model = getClient().getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: { maxOutputTokens },
  });
  const result = await model.generateContent(prompt);
  return result.response.text();
};

const parseJSON = (text) => {
  const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlock) {
    const inner = codeBlock[1].trim();
    const m = inner.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
  }
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) throw new Error('AI yaniti parse edilemedi');
  return JSON.parse(m[0]);
};

const generateLesson = async (topic, userLevel, userData = {}) => {
  const levelMap = { 1: 'baslangic', 2: 'orta', 3: 'ileri', 4: 'uzman' };
  const levelStr = levelMap[Math.min(userLevel, 4)] || 'orta';

  const prompt = `Sen bir kisisel finans kocusun. Turkce, ${levelStr} seviyede bir mikro ders hazirla.
Konu: ${topic || 'gunluk harcama kontrolu ve butce yonetimi'}
${userData.recentCategories ? `Kullanicinin son harcama kategorileri: ${userData.recentCategories.join(', ')}` : ''}

Yaniti JSON formatinda ver:
{
  "title": "Ders basligi",
  "content": "150-200 kelime, pratik ve anlasilir icerik",
  "quiz": [
    {"question": "Soru?", "options": ["A", "B", "C", "D"], "answer": 0},
    {"question": "Soru?", "options": ["A", "B", "C", "D"], "answer": 2}
  ],
  "xp": 50
}`;

  const text = await generateText(prompt);
  return parseJSON(text);
};

const analyzeBudget = async (monthlyData, inflationData) => {
  const prompt = `Bir finansal analist olarak kullanicinin bu aylik harcama verisini analiz et.

Harcama verisi (bu ay):
${JSON.stringify(monthlyData, null, 2)}

Enflasyon verisi:
${JSON.stringify(inflationData, null, 2)}

Asagidaki JSON formatinda yanit ver, baska hicbir sey yazma:
{
  "alerts": [{"type": "danger|warning|info", "message": "uyari metni"}],
  "insights": ["icgoru 1", "icgoru 2"],
  "recommendation": "tek somut oneri"
}

Kurallar: alerts limit asimi/dikkat durumlari (1-3), insights harcama dagilimi ve enflasyon gercegi (2-4), recommendation en faydali tek oneri. Turkce yaz.`;

  const text = await generateText(prompt, 2048);
  return parseJSON(text);
};

const answerFinancialQuestion = async (question, userContext = {}) => {
  const prompt = `Sen FinnAI kisisel finans kocusun. Turk kullaniciya yardim ediyorsun.
${userContext.level ? `Kullanici seviyesi: ${userContext.level}` : ''}

Soru: ${question}

Turkce, pratik ve anlasilir bir cevap ver (max 3 paragraf). Turkiye kosullarini goz onunde bulundur.`;

  const text = await generateText(prompt, 2048);
  return text.trim();
};

const analyzeShopSecurity = async (url, scrapedData = {}) => {
  const prompt = `Bir siber guvenlik uzmanisin. Asagidaki e-ticaret sitesini guvenlik acisindan degerlendir.

URL: ${url}
${scrapedData.title ? `Site basligi: ${scrapedData.title}` : ''}
${scrapedData.hasSSL !== undefined ? `SSL: ${scrapedData.hasSSL ? 'Var' : 'Yok'}` : ''}
${scrapedData.domainAge ? `Domain yasi: ${scrapedData.domainAge}` : ''}

JSON formatinda dondur:
{
  "score": 0-100,
  "level": "green|yellow|red",
  "summary": "2-3 cumle Turkce ozet",
  "layers": [
    {"name": "SSL Guvenligi", "result": "aciklama", "status": "ok|warning|danger"},
    {"name": "Domain Guvenilirligi", "result": "aciklama", "status": "ok|warning|danger"},
    {"name": "Icerik Analizi", "result": "aciklama", "status": "ok|warning|danger"},
    {"name": "Itibar Kontrolu", "result": "aciklama", "status": "ok|warning|danger"},
    {"name": "Genel Degerlendirme", "result": "aciklama", "status": "ok|warning|danger"}
  ]
}`;

  const text = await generateText(prompt);
  return parseJSON(text);
};

const generateHealthInsights = async (scoreData) => {
  const prompt = `Kullanicinin finansal saglik verisi:
${JSON.stringify(scoreData, null, 2)}

Turkce olarak:
1. 2-3 kisa oneri (insights dizisi)
2. Varsa kritik uyarilar (warnings dizisi)

JSON formatinda dondur:
{
  "insights": ["oneri1", "oneri2"],
  "warnings": ["uyari1"]
}`;

  const text = await generateText(prompt, 2048);
  try {
    return parseJSON(text);
  } catch {
    return { insights: [], warnings: [] };
  }
};

const forecastCashflow = async (monthlyHistory, period = 'short') => {
  let periodLabel, forecastShape, extraContext;

  if (period === 'medium') {
    periodLabel = '6-9-12 aylik orta vadeli';
    forecastShape = `"month6": { "expectedIncome": 0, "expectedExpense": 0, "netCashflow": 0, "confidence": 55 },
    "month9": { "expectedIncome": 0, "expectedExpense": 0, "netCashflow": 0, "confidence": 40 },
    "month12": { "expectedIncome": 0, "expectedExpense": 0, "netCashflow": 0, "confidence": 30 }`;
    extraContext = 'Mevsimsel etkiler, yillik enflasyon ve sektor trendlerini goz onune al.';
  } else if (period === 'long') {
    periodLabel = '1-2-3 yillik uzun vadeli';
    forecastShape = `"year1": { "expectedIncome": 0, "expectedExpense": 0, "netCashflow": 0, "confidence": 40 },
    "year2": { "expectedIncome": 0, "expectedExpense": 0, "netCashflow": 0, "confidence": 25 },
    "year3": { "expectedIncome": 0, "expectedExpense": 0, "netCashflow": 0, "confidence": 15 }`;
    extraContext = 'Turkiye uzun vadeli enflasyon trendi, ekonomik buyume ve sektor dinamiklerini dikkate al. Belirsizlik yuksek oldugundan confidence skorlari dusuk olsun.';
  } else {
    periodLabel = '30-60-90 gunluk kisa vadeli';
    forecastShape = `"day30": { "expectedIncome": 0, "expectedExpense": 0, "netCashflow": 0, "confidence": 75 },
    "day60": { "expectedIncome": 0, "expectedExpense": 0, "netCashflow": 0, "confidence": 60 },
    "day90": { "expectedIncome": 0, "expectedExpense": 0, "netCashflow": 0, "confidence": 45 }`;
    extraContext = 'Turkiye ekonomik kosullarini (yuksek enflasyon, kur dalgalanmasi) goz onunde bulundur.';
  }

  const prompt = `Sen FinnAI'in NakitRadar modulusun. Bir KOBİ sahibinin gecmis nakit akisi verisini analiz ederek ${periodLabel} tahmin yap.

Aylik gecmis veri (gelir, gider, net nakit akisi):
${JSON.stringify(monthlyHistory, null, 2)}

${extraContext}

Su JSON formatinda yanit ver:
{
  "forecast": {
    ${forecastShape}
  },
  "alerts": [
    { "type": "warning|danger|info", "message": "Turkce uyari mesaji" }
  ],
  "insights": ["Turkce icgoru 1", "Turkce icgoru 2"],
  "recommendation": "2-3 cumle Turkce oneri"
}

Tum parasal degerler TL cinsinden olsun.`;

  const text = await generateText(prompt);
  return parseJSON(text);
};

const analyzeExpenses = async (monthlyHistory) => {
  const prompt = `Sen FinnAI'in Akilli Gider Analizi modulusun. Bir KOBİ'nin aylik gider verilerini analiz et.

Gider gecmisi (son aylar):
${JSON.stringify(monthlyHistory, null, 2)}

Su JSON formatinda yanit ver:
{
  "score": 0-100,
  "summary": "2-3 cumle Turkce gider durumu ozeti",
  "savings": [
    { "category": "kategori adi", "suggestion": "tasarruf onerisi", "estimatedSaving": 1000, "priority": "high|medium|low" }
  ],
  "anomalies": [
    { "description": "anormal gider aciklamasi", "severity": "warning|danger" }
  ],
  "topExpenseCategories": ["en cok harcanan kategori 1", "2", "3"],
  "recommendation": "Ana optimizasyon onerisi (2-3 cumle Turkce)"
}

Turkiye piyasa kosullarini ve enflasyonu goz onune al.`;

  const text = await generateText(prompt);
  return parseJSON(text);
};

const scoreCollections = async (collections) => {
  const now = new Date();
  const enriched = collections.map((c) => ({
    id: c.id,
    customerName: c.customer_name,
    amount: parseFloat(c.amount),
    dueDate: c.due_date,
    daysOverdue: Math.max(0, Math.floor((now - new Date(c.due_date)) / 86400000)),
    isDue: new Date(c.due_date) < now,
  }));

  const prompt = `Sen FinnAI'in TahsilatAI modulusun. Asagidaki alacaklari analiz et ve her biri icin tahsilat olasilik skoru ver.

Alacak listesi:
${JSON.stringify(enriched, null, 2)}

Su JSON formatinda yanit ver:
{
  "scores": [
    {
      "id": "uuid buraya",
      "paymentProbability": 0-100,
      "urgency": "critical|high|medium|low",
      "recommendation": "Kisa Turkce aksiyon onerisi",
      "followUpScript": "Musteriyle iletisim taslagi (1-2 cumle)"
    }
  ],
  "totalAtRisk": toplam_riskli_tutar,
  "summary": "Genel tahsilat durumu ozeti (2 cumle Turkce)"
}`;

  const text = await generateText(prompt);
  return parseJSON(text);
};

const analyzeSupplier = async (supplierName, productType, estimatedAmount) => {
  const prompt = `Sen FinnAI'in GuvenlIAlis modulusun. Asagidaki tedarikcıyi 5 katmanli risk analyziyle degerlendir.

Tedarikci/Satici: ${supplierName}
Alinacak urun/hizmet: ${productType || 'Belirtilmedi'}
Tahmini tutar: ${estimatedAmount ? estimatedAmount + ' TL' : 'Belirtilmedi'}

Turkiye piyasasini goz onunde bulundur (e-fatura, KDV, ticaret sicil, IBAN dogrulama vb.)

Su JSON formatinda yanit ver:
{
  "score": 0-100,
  "level": "green|yellow|red",
  "summary": "2-3 cumle Turkce genel degerlendirme",
  "layers": [
    {"name": "Piyasa Itibari", "result": "aciklama", "status": "ok|warning|danger"},
    {"name": "Fiyat Analizi", "result": "aciklama", "status": "ok|warning|danger"},
    {"name": "Odeme Kosullari Riski", "result": "aciklama", "status": "ok|warning|danger"},
    {"name": "Yasal Uyumluluk", "result": "aciklama", "status": "ok|warning|danger"},
    {"name": "Alternatif Tedarikciler", "result": "alternatif oneri", "status": "ok|warning|danger"}
  ],
  "recommendation": "2-3 cumle alim tavsiyesi"
}`;

  const text = await generateText(prompt);
  return parseJSON(text);
};

module.exports = {
  generateLesson,
  analyzeBudget,
  answerFinancialQuestion,
  analyzeShopSecurity,
  generateHealthInsights,
  forecastCashflow,
  analyzeExpenses,
  scoreCollections,
  analyzeSupplier,
};
