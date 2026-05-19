const expenseModel = require('../models/expenseModel');
const budgetModel = require('../models/budgetModel');
const coachModel = require('../models/coachModel');
const aiService = require('./aiService');
const { monthRange, formatMonth } = require('../utils/helpers');

const scoreCache = {};
const CACHE_TTL = 30 * 60 * 1000;

const formatTL = (n) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1)} M ₺`
    : `${n.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺`;

const buildFallback = (scoreData, overLimitCategories) => {
  const { total_score, totalSpent, totalLimit, activeGoalsCount, xp, overLimitCount } = scoreData;
  const remaining = totalLimit - totalSpent;
  const spentPct = Math.round((totalSpent / totalLimit) * 100);

  const warnings = [];
  const insights = [];

  if (totalSpent > totalLimit) {
    warnings.push(
      `Toplam harcamanız (${formatTL(totalSpent)}) bütçe limitinizi (${formatTL(totalLimit)}) ${formatTL(totalSpent - totalLimit)} aştı. Harcamalarınızı acilen gözden geçirin.`
    );
  } else if (spentPct >= 80) {
    warnings.push(
      `Bütçenizin %${spentPct}'ini harcadınız. Kalan limitiniz ${formatTL(remaining)} — dikkatli olun.`
    );
  }

  if (overLimitCount > 0 && overLimitCategories.length > 0) {
    warnings.push(
      `${overLimitCategories.join(', ')} kategorilerinde limit aşımı var. Bu kategorilerdeki harcamalarınızı azaltın.`
    );
  }

  if (activeGoalsCount === 0) {
    insights.push('Henüz aktif finansal hedefiniz yok. Birikim hedefi belirleyerek geleceğinizi planlamaya başlayın.');
  } else {
    insights.push(`${activeGoalsCount} aktif finansal hedefiniz var. Düzenli katkılarla hedeflerinize ulaşabilirsiniz.`);
  }

  if (spentPct < 60 && totalSpent > 0) {
    insights.push(`Harcamalarınız bütçenizin %${spentPct}'inde — iyi gidiyorsunuz. Artan ${formatTL(remaining)} tutarını birikime yönlendirmeyi düşünün.`);
  } else if (spentPct >= 60 && spentPct < 80) {
    insights.push('Harcamalarınız limitinize yaklaşıyor. Gereksiz harcamalarınızı kısarak ay sonuna kadar bütçenizi koruyun.');
  }

  if (xp < 100) {
    insights.push('FinansKoç modülünü kullanarak finansal okuryazarlığınızı artırın ve skorunuzu yükseltin.');
  } else if (total_score >= 70) {
    insights.push('Finansal sağlığınız iyi seviyede. Bu disiplini koruyarak uzun vadeli servet oluşturabilirsiniz.');
  }

  return { insights, warnings };
};

const calculatePersonalScore = async (userId) => {
  const cached = scoreCache[userId];
  if (cached && Date.now() - cached.time < CACHE_TTL) {
    return cached.data;
  }

  const month = formatMonth();
  const { start, end } = monthRange(month);
  const entries = await expenseModel.findByUserAndMonth(userId, start, end);
  const limits = await budgetModel.getLimits(userId);
  const goals = await budgetModel.getGoals(userId);
  const progress = await coachModel.getProgress(userId);

  const total = entries.reduce((s, e) => s + Math.max(0, parseFloat(e.amount)), 0);
  const totalLimit = limits.reduce((s, l) => s + parseFloat(l.monthly_limit), 0) || 1_000_000;

  const budgetScore = Math.min(25, Math.max(0, 25 * (1 - total / totalLimit)));

  const overLimitCategories = limits
    .filter((l) => {
      const spent = entries
        .filter((e) => e.category === l.category)
        .reduce((s, e) => s + parseFloat(e.amount), 0);
      return spent > parseFloat(l.monthly_limit);
    })
    .map((l) => l.category);
  const overLimitCount = overLimitCategories.length;
  const limitsScore = Math.max(0, 25 - overLimitCount * 8);

  const activeGoals = goals.filter((g) => parseFloat(g.currentAmount) < parseFloat(g.targetAmount));
  const goalsScore = activeGoals.length > 0 ? Math.min(25, activeGoals.length * 12) : 5;

  const educationScore = Math.min(25, Math.floor(progress.xp / 20));

  const total_score = Math.round(budgetScore + limitsScore + goalsScore + educationScore);

  const scoreData = {
    total_score,
    budgetScore,
    limitsScore,
    goalsScore,
    educationScore,
    totalSpent: total,
    totalLimit,
    overLimitCount,
    activeGoalsCount: activeGoals.length,
    xp: progress.xp,
  };

  const fallback = buildFallback(scoreData, overLimitCategories);

  let aiResult;
  try {
    const result = await aiService.generateHealthInsights(scoreData);
    aiResult = (result.insights?.length || result.warnings?.length)
      ? result
      : fallback;
  } catch {
    aiResult = fallback;
  }

  const data = {
    personal: total_score,
    breakdown: { budget: budgetScore, limits: limitsScore, goals: goalsScore, education: educationScore },
    insights: aiResult.insights,
    warnings: aiResult.warnings,
  };

  scoreCache[userId] = { data, time: Date.now() };
  return data;
};

module.exports = { calculatePersonalScore };
