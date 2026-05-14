const Anthropic = require('@anthropic-ai/sdk');

let client;
const getClient = () => {
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
};

const generateLesson = async (topic, userLevel, userData = {}) => {
  const levelMap = { 1: 'başlangıç', 2: 'orta', 3: 'ileri', 4: 'uzman' };
  const levelStr = levelMap[Math.min(userLevel, 4)] || 'orta';

  const prompt = `Sen bir kişisel finans koçusun. Türkçe, ${levelStr} seviyede bir mikro ders hazırla.
Konu: ${topic || 'günlük harcama kontrolü ve bütçe yönetimi'}
${userData.recentCategories ? `Kullanıcının son harcama kategorileri: ${userData.recentCategories.join(', ')}` : ''}

Yanıtı JSON formatında ver:
{
  "title": "Ders başlığı",
  "content": "150-200 kelime, pratik ve anlaşılır içerik",
  "quiz": [
    {"question": "Soru?", "options": ["A", "B", "C", "D"], "answer": 0},
    {"question": "Soru?", "options": ["A", "B", "C", "D"], "answer": 2}
  ],
  "xp": 50
}`;

  const msg = await getClient().messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = msg.content[0].text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('AI yanıtı parse edilemedi');
  return JSON.parse(jsonMatch[0]);
};

const analyzeBudget = async (monthlyData, inflationData) => {
  const prompt = `Bir finansal analist olarak kullanıcının harcama verisini analiz et.

Harcama verisi (son 3 ay):
${JSON.stringify(monthlyData, null, 2)}

Enflasyon verisi:
${JSON.stringify(inflationData, null, 2)}

Türkçe, kısa ve pratik bir analiz yaz (2-3 cümle). Reel tasarruf/kayıp vurgula.
Örnek format: "Market harcamanız %12 arttı, gıda enflasyonu %15 olduğundan reel olarak tasarruf etmişsiniz."
Sadece analiz metnini döndür, JSON değil.`;

  const msg = await getClient().messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  });
  return msg.content[0].text.trim();
};

const answerFinancialQuestion = async (question, userContext = {}) => {
  const prompt = `Sen FinnAI kişisel finans koçusun. Türk kullanıcıya yardım ediyorsun.
${userContext.level ? `Kullanıcı seviyesi: ${userContext.level}` : ''}

Soru: ${question}

Türkçe, pratik ve anlaşılır bir cevap ver (max 3 paragraf). Türkiye koşullarını göz önünde bulundur.`;

  const msg = await getClient().messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 768,
    messages: [{ role: 'user', content: prompt }],
  });
  return msg.content[0].text.trim();
};

const analyzeShopSecurity = async (url, scrapedData = {}) => {
  const prompt = `Bir siber güvenlik uzmanısın. Aşağıdaki e-ticaret sitesini güvenlik açısından değerlendir.

URL: ${url}
${scrapedData.title ? `Site başlığı: ${scrapedData.title}` : ''}
${scrapedData.hasSSL !== undefined ? `SSL: ${scrapedData.hasSSL ? 'Var' : 'Yok'}` : ''}
${scrapedData.domainAge ? `Domain yaşı: ${scrapedData.domainAge}` : ''}

JSON formatında döndür:
{
  "score": 0-100,
  "level": "green|yellow|red",
  "summary": "2-3 cümle Türkçe özet",
  "layers": [
    {"name": "SSL Güvenliği", "result": "açıklama", "status": "ok|warning|danger"},
    {"name": "Domain Güvenilirliği", "result": "açıklama", "status": "ok|warning|danger"},
    {"name": "İçerik Analizi", "result": "açıklama", "status": "ok|warning|danger"},
    {"name": "İtibar Kontrolü", "result": "açıklama", "status": "ok|warning|danger"},
    {"name": "Genel Değerlendirme", "result": "açıklama", "status": "ok|warning|danger"}
  ]
}`;

  const msg = await getClient().messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = msg.content[0].text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('AI yanıtı parse edilemedi');
  return JSON.parse(jsonMatch[0]);
};

const generateHealthInsights = async (scoreData) => {
  const prompt = `Kullanıcının finansal sağlık verisi:
${JSON.stringify(scoreData, null, 2)}

Türkçe olarak:
1. 2-3 kısa öneri (insights dizisi)
2. Varsa kritik uyarılar (warnings dizisi)

JSON formatında döndür:
{
  "insights": ["öneri1", "öneri2"],
  "warnings": ["uyarı1"]
}`;

  const msg = await getClient().messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = msg.content[0].text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return { insights: [], warnings: [] };
  return JSON.parse(jsonMatch[0]);
};

module.exports = {
  generateLesson,
  analyzeBudget,
  answerFinancialQuestion,
  analyzeShopSecurity,
  generateHealthInsights,
};
