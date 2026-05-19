import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { businessAPI } from '../../services/api';

const ACCENT = '#EF4444';

type MonthData = { income: number; expense: number };

function getMonthRange(offset = 0): { start: string; end: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() - offset;
  const date = new Date(y, m, 1);
  const start = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const end = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { start, end };
}

function formatMoney(n: number): string {
  return n.toLocaleString('tr-TR', { maximumFractionDigits: 0 }) + ' ₺';
}

type MetricLevel = 'excellent' | 'good' | 'fair' | 'poor';

function levelLabel(l: MetricLevel): string {
  return { excellent: 'Mükemmel', good: 'İyi', fair: 'Geliştirilmeli', poor: 'Kritik' }[l];
}
function levelColor(l: MetricLevel): string {
  return { excellent: '#16A34A', good: '#2563EB', fair: '#D97706', poor: '#DC2626' }[l];
}

function scoreProfitability(cur: MonthData): { score: number; level: MetricLevel; detail: string } {
  if (cur.income === 0) return { score: 0, level: 'poor', detail: 'Bu ay henüz gelir kaydı yok.' };
  const margin = (cur.income - cur.expense) / cur.income;
  if (margin >= 0.25) return { score: 25, level: 'excellent', detail: `Net kâr marjınız %${(margin * 100).toFixed(0)} — çok güçlü.` };
  if (margin >= 0.15) return { score: 20, level: 'good', detail: `Net kâr marjınız %${(margin * 100).toFixed(0)} — iyi seviyede.` };
  if (margin >= 0.05) return { score: 14, level: 'fair', detail: `Net kâr marjınız %${(margin * 100).toFixed(0)} — biraz düşük.` };
  if (margin >= 0) return { score: 8, level: 'fair', detail: `Net kâr marjınız %${(margin * 100).toFixed(0)} — çok kısıtlı.` };
  return { score: 2, level: 'poor', detail: `Bu ay ${formatMoney(Math.abs(cur.income - cur.expense))} zararda.` };
}

function scoreIncomeStability(cur: MonthData, prev: MonthData): { score: number; level: MetricLevel; detail: string } {
  if (prev.income === 0 && cur.income === 0) return { score: 5, level: 'poor', detail: 'Son iki ayda gelir kaydı bulunamadı.' };
  if (prev.income === 0) return { score: 18, level: 'good', detail: `Bu ay ilk gelir kayıtlarınız var: ${formatMoney(cur.income)}.` };
  const change = (cur.income - prev.income) / prev.income;
  if (change >= 0.1) return { score: 25, level: 'excellent', detail: `Geliriniz geçen aya göre %${(change * 100).toFixed(0)} arttı.` };
  if (change >= 0) return { score: 20, level: 'good', detail: `Geliriniz geçen aydan %${(change * 100).toFixed(0)} yüksek — istikrarlı.` };
  if (change >= -0.1) return { score: 15, level: 'fair', detail: `Geliriniz %${(Math.abs(change) * 100).toFixed(0)} azaldı — takipte kalın.` };
  if (change >= -0.25) return { score: 8, level: 'fair', detail: `Gelirde %${(Math.abs(change) * 100).toFixed(0)} düşüş var — dikkat edin.` };
  return { score: 3, level: 'poor', detail: `Gelirde %${(Math.abs(change) * 100).toFixed(0)} ciddi düşüş — acil önlem alın.` };
}

function scoreExpenseControl(cur: MonthData, prev: MonthData): { score: number; level: MetricLevel; detail: string } {
  if (prev.expense === 0 && cur.expense === 0) return { score: 15, level: 'fair', detail: 'Gider kaydı bulunamadı.' };
  if (prev.expense === 0) return { score: 18, level: 'good', detail: `Bu ay giderleriniz: ${formatMoney(cur.expense)}.` };
  const change = (cur.expense - prev.expense) / prev.expense;
  if (change <= -0.05) return { score: 25, level: 'excellent', detail: `Giderlerinizi %${(Math.abs(change) * 100).toFixed(0)} azalttınız — harika.` };
  if (change <= 0.05) return { score: 20, level: 'good', detail: `Giderler stabil — iyi yönetim.` };
  if (change <= 0.15) return { score: 14, level: 'fair', detail: `Giderler %${(change * 100).toFixed(0)} arttı — kontrol altında tutun.` };
  if (change <= 0.30) return { score: 8, level: 'fair', detail: `Giderler %${(change * 100).toFixed(0)} arttı — incelemeniz önerilir.` };
  return { score: 2, level: 'poor', detail: `Giderler %${(change * 100).toFixed(0)} sıçradı — acil analiz yapın.` };
}

function scoreCashPosition(cur: MonthData): { score: number; level: MetricLevel; detail: string } {
  if (cur.income === 0) return { score: 3, level: 'poor', detail: 'Gelir olmadan nakit pozisyonu değerlendirilemiyor.' };
  const ratio = cur.expense === 0 ? 3 : cur.income / cur.expense;
  if (ratio >= 2.0) return { score: 25, level: 'excellent', detail: `Geliriniz giderinizin ${ratio.toFixed(1)}× katı — güçlü nakit.` };
  if (ratio >= 1.5) return { score: 20, level: 'good', detail: `Gelir/gider oranı ${ratio.toFixed(1)} — iyi seviye.` };
  if (ratio >= 1.2) return { score: 15, level: 'fair', detail: `Gelir/gider oranı ${ratio.toFixed(1)} — biraz sıkışık.` };
  if (ratio >= 1.0) return { score: 8, level: 'fair', detail: `Gelir/gider oranı ${ratio.toFixed(2)} — çok az marj var.` };
  return { score: 2, level: 'poor', detail: `Giderler geliri aşıyor (oran: ${ratio.toFixed(2)}).` };
}

function overallDesc(score: number): string {
  if (score >= 80) return 'İşletmeniz finansal olarak çok güçlü!';
  if (score >= 60) return 'Genel tablo iyi, bazı alanlarda iyileştirme var.';
  if (score >= 40) return 'Dikkat gerektiren alanlar mevcut.';
  return 'Finansal durumunuz acil ilgi gerektiriyor.';
}

function overallColor(score: number): string {
  if (score >= 80) return '#16A34A';
  if (score >= 60) return '#2563EB';
  if (score >= 40) return '#D97706';
  return '#DC2626';
}

type Metric = { icon: string; name: string; score: number; level: MetricLevel; detail: string; desc: string };

export default function HealthScoreScreen({ navigation }: { navigation: any }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cur, setCur] = useState<MonthData>({ income: 0, expense: 0 });
  const [prev, setPrev] = useState<MonthData>({ income: 0, expense: 0 });

  const load = async () => {
    try {
      const curRange = getMonthRange(0);
      const prevRange = getMonthRange(1);
      const [curRes, prevRes] = await Promise.all([
        businessAPI.getSummaryByRange(curRange.start, curRange.end),
        businessAPI.getSummaryByRange(prevRange.start, prevRange.end),
      ]);
      setCur({ income: curRes.data.totalIncome ?? 0, expense: curRes.data.totalExpense ?? 0 });
      setPrev({ income: prevRes.data.totalIncome ?? 0, expense: prevRes.data.totalExpense ?? 0 });
    } catch {
      // keep zeros — score will reflect missing data
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onRefresh = () => { setRefreshing(true); load(); };

  const m1 = scoreProfitability(cur);
  const m2 = scoreIncomeStability(cur, prev);
  const m3 = scoreExpenseControl(cur, prev);
  const m4 = scoreCashPosition(cur);
  const total = m1.score + m2.score + m3.score + m4.score;

  const metrics: Metric[] = [
    { icon: 'trending-up-outline', name: 'Kârlılık', score: m1.score, level: m1.level, detail: m1.detail, desc: 'Net kâr marjınız — gelirin gideri ne kadar aştığı.' },
    { icon: 'bar-chart-outline', name: 'Gelir İstikrarı', score: m2.score, level: m2.level, detail: m2.detail, desc: 'Bu ay gelirinin geçen ayla karşılaştırması.' },
    { icon: 'shield-checkmark-outline', name: 'Gider Yönetimi', score: m3.score, level: m3.level, detail: m3.detail, desc: 'Giderlerin aylık değişim trendi.' },
    { icon: 'wallet-outline', name: 'Nakit Pozisyonu', score: m4.score, level: m4.level, detail: m4.detail, desc: 'Gelir ile gider arasındaki oran.' },
  ];

  const now = new Date();
  const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  const curLabel = `${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
  const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
  const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const prevLabel = `${MONTHS[prevMonth]} ${prevYear}`;

  const scoreColor = overallColor(total);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Finansal Sağlık</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={ACCENT} />
          <Text style={styles.loadingText}>Finansal veriler analiz ediliyor...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />}
        >
          {/* Score gauge card */}
          <View style={styles.scoreCard}>
            <View style={[styles.gaugeOuter, { borderColor: scoreColor }]}>
              <Text style={[styles.gaugeScore, { color: scoreColor }]}>{total}</Text>
              <Text style={styles.gaugeMax}>/100</Text>
            </View>
            <Text style={styles.scoreTitle}>Finansal Sağlık Skoru</Text>
            <Text style={styles.scoreDesc}>{overallDesc(total)}</Text>
            <View style={styles.periodRow}>
              <Ionicons name="calendar-outline" size={13} color={colors.text.muted} />
              <Text style={styles.periodText}>
                {curLabel} · Önceki ay: {prevLabel}
              </Text>
            </View>
          </View>

          {/* How score is calculated info */}
          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={18} color={colors.business} />
            <Text style={styles.infoText}>
              Skor 4 metriğin toplamından oluşur: Kârlılık, Gelir İstikrarı, Gider Yönetimi ve Nakit Pozisyonu. Her biri max 25 puan taşır ve bu aydaki gerçek verilerinizden hesaplanır.
            </Text>
          </View>

          {/* Summary row */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Bu Ay Gelir</Text>
              <Text style={[styles.summaryValue, { color: '#16A34A' }]}>{formatMoney(cur.income)}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Bu Ay Gider</Text>
              <Text style={[styles.summaryValue, { color: '#DC2626' }]}>{formatMoney(cur.expense)}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Net Kâr</Text>
              <Text style={[styles.summaryValue, { color: cur.income - cur.expense >= 0 ? '#16A34A' : '#DC2626' }]}>
                {cur.income - cur.expense >= 0 ? '+' : ''}{formatMoney(cur.income - cur.expense)}
              </Text>
            </View>
          </View>

          {/* Metric cards */}
          <Text style={styles.sectionTitle}>Metrik Analizi</Text>
          {metrics.map((m) => (
            <View key={m.name} style={styles.metricCard}>
              <View style={styles.metricTop}>
                <View style={[styles.metricIconWrap, { backgroundColor: levelColor(m.level) + '18' }]}>
                  <Ionicons name={m.icon as any} size={20} color={levelColor(m.level)} />
                </View>
                <View style={styles.metricTitleBlock}>
                  <Text style={styles.metricName}>{m.name}</Text>
                  <Text style={styles.metricDesc}>{m.desc}</Text>
                </View>
                <View style={[styles.levelBadge, { backgroundColor: levelColor(m.level) + '18' }]}>
                  <Text style={[styles.levelBadgeText, { color: levelColor(m.level) }]}>
                    {levelLabel(m.level)}
                  </Text>
                </View>
              </View>

              {/* Progress bar */}
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${(m.score / 25) * 100}%`, backgroundColor: levelColor(m.level) }]} />
              </View>
              <View style={styles.barLabels}>
                <Text style={[styles.barScore, { color: levelColor(m.level) }]}>{m.score}/25</Text>
              </View>

              <View style={styles.metricDetailRow}>
                <Ionicons name="chatbubble-ellipses-outline" size={13} color={colors.text.muted} />
                <Text style={styles.metricDetailText}>{m.detail}</Text>
              </View>
            </View>
          ))}

          {/* Recommendations */}
          <Text style={styles.sectionTitle}>Öneriler</Text>
          {buildRecommendations(cur, prev, m1.level, m2.level, m3.level, m4.level).map((rec, i) => (
            <View key={i} style={[styles.recCard, { borderLeftColor: rec.color }]}>
              <Ionicons name={rec.icon as any} size={18} color={rec.color} />
              <Text style={styles.recText}>{rec.text}</Text>
            </View>
          ))}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function buildRecommendations(
  cur: MonthData,
  prev: MonthData,
  l1: MetricLevel, l2: MetricLevel, l3: MetricLevel, l4: MetricLevel
): { text: string; icon: string; color: string }[] {
  const recs: { text: string; icon: string; color: string }[] = [];

  if (cur.income === 0) {
    recs.push({ text: 'Bu ay henüz gelir kaydı yok. Gelirlerinizi düzenli kaydedin — skor gerçek verilere göre hesaplanır.', icon: 'alert-circle-outline', color: '#DC2626' });
  }
  if (l1 === 'poor' || l1 === 'fair') {
    recs.push({ text: 'Kâr marjınızı artırmak için gider kalemlerini tek tek inceleyin ve gereksiz olanları kısın.', icon: 'cut-outline', color: '#D97706' });
  }
  if (l2 === 'poor') {
    recs.push({ text: 'Gelir düşüşü ciddi. Düzenli müşteri tabanı oluşturmak ve aylık sabit gelir sözleşmeleri yapmak faydalı olabilir.', icon: 'trending-down-outline', color: '#DC2626' });
  }
  if (l3 === 'poor') {
    recs.push({ text: 'Giderlerdeki hızlı artış dikkat çekici. Hangi kategoride artış olduğunu Gelir/Gider ekranından inceleyin.', icon: 'warning-outline', color: '#DC2626' });
  }
  if (l4 === 'fair' || l4 === 'poor') {
    recs.push({ text: 'Nakit pozisyonunuzu güçlendirmek için tahsilatları hızlandırın ve ödemeleri planlayın.', icon: 'time-outline', color: '#D97706' });
  }
  if (cur.income > 0 && prev.income > 0 && cur.expense < prev.expense) {
    recs.push({ text: `Harika! Giderlerinizi geçen aya kıyasla ${formatMoney(prev.expense - cur.expense)} azalttınız. Bu tasarrufu büyümeye yatırabilirsiniz.`, icon: 'checkmark-circle-outline', color: '#16A34A' });
  }
  if (recs.length === 0) {
    recs.push({ text: 'Finansal tablonuz güçlü görünüyor. Büyüme hedeflerinizi belirleyerek ilerlemeye devam edin.', icon: 'rocket-outline', color: '#16A34A' });
  }
  return recs;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  back: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: colors.text.primary },

  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  loadingText: { fontSize: 14, color: colors.text.secondary },

  scoreCard: {
    margin: 16, backgroundColor: colors.card, borderRadius: 20,
    padding: 28, alignItems: 'center', gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  gaugeOuter: {
    width: 130, height: 130, borderRadius: 65,
    borderWidth: 8, alignItems: 'center', justifyContent: 'center',
  },
  gaugeScore: { fontSize: 40, fontWeight: '800', lineHeight: 46 },
  gaugeMax: { fontSize: 14, color: colors.text.muted, fontWeight: '500' },
  scoreTitle: { fontSize: 16, fontWeight: '700', color: colors.text.primary },
  scoreDesc: { fontSize: 13, color: colors.text.secondary, textAlign: 'center' },
  periodRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  periodText: { fontSize: 12, color: colors.text.muted },

  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    marginHorizontal: 16, marginBottom: 12,
    backgroundColor: colors.primaryLight, borderRadius: 12,
    padding: 14, borderWidth: 1, borderColor: colors.business + '30',
  },
  infoText: { flex: 1, fontSize: 12, color: colors.text.secondary, lineHeight: 18 },

  summaryRow: {
    flexDirection: 'row', marginHorizontal: 16, marginBottom: 16,
    backgroundColor: colors.card, borderRadius: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.border,
  },
  summaryItem: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  summaryLabel: { fontSize: 11, color: colors.text.muted, marginBottom: 4, fontWeight: '500' },
  summaryValue: { fontSize: 13, fontWeight: '700' },
  summaryDivider: { width: 1, backgroundColor: colors.border },

  sectionTitle: {
    fontSize: 13, fontWeight: '600', color: colors.text.muted,
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginHorizontal: 16, marginBottom: 8, marginTop: 4,
  },

  metricCard: {
    marginHorizontal: 16, marginBottom: 12,
    backgroundColor: colors.card, borderRadius: 14,
    padding: 16, borderWidth: 1, borderColor: colors.border,
  },
  metricTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  metricIconWrap: {
    width: 40, height: 40, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  metricTitleBlock: { flex: 1 },
  metricName: { fontSize: 15, fontWeight: '700', color: colors.text.primary },
  metricDesc: { fontSize: 11, color: colors.text.muted, marginTop: 2, lineHeight: 16 },
  levelBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  levelBadgeText: { fontSize: 11, fontWeight: '700' },

  barTrack: {
    height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 4 },
  barLabels: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4 },
  barScore: { fontSize: 12, fontWeight: '700' },

  metricDetailRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    marginTop: 10, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  metricDetailText: { flex: 1, fontSize: 12, color: colors.text.secondary, lineHeight: 18 },

  recCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    marginHorizontal: 16, marginBottom: 10,
    backgroundColor: colors.card, borderRadius: 12,
    padding: 14, borderLeftWidth: 3,
    borderWidth: 1, borderColor: colors.border,
  },
  recText: { flex: 1, fontSize: 13, color: colors.text.secondary, lineHeight: 20 },
});
