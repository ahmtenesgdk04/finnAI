const { GoogleGenerativeAI } = require('@google/generative-ai');

const CATEGORIES = ['Market', 'Kira', 'Fatura', 'Sağlık', 'Eğlence', 'Ulaşım', 'Giyim', 'Diğer'];

let genAI;
const getClient = () => {
  if (!genAI) genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return genAI;
};

const getModel = () => getClient().getGenerativeModel({ model: 'gemini-2.0-flash-lite' });

const analyzeBudget = async (monthlyData, inflationData) => {
  const prompt = `Sen bir Türk kişisel finans uzmanısın. Kullanıcının son 3 aylık harcama verisini analiz et.

Harcama verisi:
${JSON.stringify(monthlyData, null, 2)}

Enflasyon verisi:
${JSON.stringify(inflationData, null, 2)}

Türkçe, 3-4 cümle pratik bir analiz yaz. Şunlara değin:
- Hangi kategoride en fazla artış/azalış var
- Enflasyona göre reel durum (tasarruf mu, kayıp mı)
- Bir somut öneri

Sadece analiz metnini döndür, JSON veya başlık kullanma.`;

  const result = await getModel().generateContent(prompt);
  return result.response.text().trim();
};

const suggestCategory = async (note, amount) => {
  const prompt = `Aşağıdaki harcama notuna göre en uygun kategoriyi seç.
Sadece kategori adını döndür, başka hiçbir şey yazma.

Harcama notu: "${note}"
Tutar: ${amount} TL
Kategoriler: ${CATEGORIES.join(', ')}`;

  const result = await getModel().generateContent(prompt);
  const suggested = result.response.text().trim();
  return CATEGORIES.includes(suggested) ? suggested : 'Diğer';
};

const analyzeExpenses = async (entries, total, budget) => {
  const categoryTotals = {};
  for (const e of entries) {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + parseFloat(e.amount);
  }

  const prompt = `Kullanıcının bu ayki harcamalarını analiz et.

Toplam harcama: ${total} TL
Bütçe: ${budget} TL
Kategorilere göre: ${JSON.stringify(categoryTotals)}

Türkçe, 2-3 cümle kısa ve pratik yorum yap. Varsa dikkat edilmesi gereken kategoriyi belirt.
Sadece metin döndür.`;

  const result = await getModel().generateContent(prompt);
  return result.response.text().trim();
};

const analyzeShopSecurity = async (url, scrapedData = {}) => {
  const prompt = `Bir siber güvenlik uzmanısın. Aşağıdaki e-ticaret sitesini güvenlik açısından değerlendir.

URL: ${url}
${scrapedData.title ? `Site başlığı: ${scrapedData.title}` : ''}
${scrapedData.hasSSL !== undefined ? `SSL: ${scrapedData.hasSSL ? 'Var' : 'Yok'}` : ''}
Alan adı: ${scrapedData.domain || ''}

Sadece JSON döndür, başka hiçbir şey yazma:
{
  "score": 0-100,
  "level": "green|yellow|red",
  "summary": "2-3 cümle Türkçe özet",
  "layers": [
    {"name": "SSL Güvenliği", "result": "açıklama", "status": "ok|warning|danger"},
    {"name": "Domain Güvenilirliği", "result": "açıklama", "status": "ok|warning|danger"},
    {"name": "İçerik Analizi", "result": "açıklama", "status": "ok|warning|danger"},
    {"name": "Sayfa Erişilebilirliği", "result": "açıklama", "status": "ok|warning|danger"},
    {"name": "Genel Değerlendirme", "result": "açıklama", "status": "ok|warning|danger"}
  ]
}`;

  const result = await getModel().generateContent(prompt);
  const text = result.response.text().trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('AI yanıtı parse edilemedi');
  return JSON.parse(jsonMatch[0]);
};

module.exports = { analyzeBudget, suggestCategory, analyzeExpenses, analyzeShopSecurity };
