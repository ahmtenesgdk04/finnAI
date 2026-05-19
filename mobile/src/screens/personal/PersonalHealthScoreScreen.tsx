import React, { useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { personalAPI } from '../../services/api';
import { useApi } from '../../hooks/useApi';

type MetricLevel = 'excellent' | 'good' | 'fair' | 'poor';

function scoreToLevel(s: number): MetricLevel {
  if (s >= 20) return 'excellent';
  if (s >= 14) return 'good';
  if (s >= 8)  return 'fair';
  return 'poor';
}
function levelLabel(l: MetricLevel): string {
  return { excellent: 'Mükemmel', good: 'İyi', fair: 'Geliştirilmeli', poor: 'Kritik' }[l];
}
function levelColor(l: MetricLevel): string {
  return { excellent: '#16A34A', good: '#2563EB', fair: '#D97706', poor: '#DC2626' }[l];
}

function overallDesc(score: number): string {
  if (score >= 80) return 'Finansal durumunuz çok güçlü!';
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

const BREAKDOWN_ITEMS = [
  { key: 'budget',    icon: 'wallet-outline',           name: 'Bütçeleme',          desc: 'Aylık bütçe planlaması ve harcama disiplini.' },
  { key: 'limits',   icon: 'shield-checkmark-outline',  name: 'Limit Kontrolü',     desc: 'Kategori limitlerinin aşılıp aşılmadığı.' },
  { key: 'goals',    icon: 'flag-outline',              name: 'Birikim Hedefleri',  desc: 'Birikim hedeflerine doğru ilerleme.' },
  { key: 'education',icon: 'school-outline',            name: 'Finansal Eğitim',    desc: 'FinansKoç\'taki eğitim tamamlama oranı.' },
] as const;

export default function PersonalHealthScoreScreen({ navigation }: { navigation: any }) {
  const { data, loading, refetch } = useApi(
    useCallback(() => personalAPI.getHealthScore(), [])
  );

  const score: number            = (data as any)?.personal  ?? 0;
  const breakdown                = (data as any)?.breakdown ?? {};
  const insights: string[]       = (data as any)?.insights  ?? [];
  const warnings: string[]       = (data as any)?.warnings  ?? [];
  const scoreColor               = overallColor(score);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Finansal Sağlık</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.personal} />
          <Text style={styles.loadingText}>Finansal sağlık analiz ediliyor...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor={colors.personal} />}
        >
          {/* Skor gauge kartı */}
          <View style={styles.scoreCard}>
            <View style={[styles.gaugeOuter, { borderColor: scoreColor }]}>
              <Text style={[styles.gaugeScore, { color: scoreColor }]}>{score}</Text>
              <Text style={styles.gaugeMax}>/100</Text>
            </View>
            <Text style={styles.scoreTitle}>Finansal Sağlık Skoru</Text>
            <Text style={styles.scoreDesc}>{overallDesc(score)}</Text>
          </View>

          {/* Bilgi kartı */}
          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={18} color={colors.personal} />
            <Text style={styles.infoText}>
              Skor 4 metriğin toplamından oluşur: Bütçeleme, Limit Kontrolü, Birikim Hedefleri ve Finansal Eğitim. Her biri max 25 puan taşır.
            </Text>
          </View>

          {/* Metrik kartları */}
          <Text style={styles.sectionTitle}>Metrik Analizi</Text>
          {BREAKDOWN_ITEMS.map((item) => {
            const val   = Math.round(breakdown[item.key] ?? 0);
            const level = scoreToLevel(val);
            const col   = levelColor(level);
            return (
              <View key={item.key} style={styles.metricCard}>
                <View style={styles.metricTop}>
                  <View style={[styles.metricIconWrap, { backgroundColor: col + '18' }]}>
                    <Ionicons name={item.icon} size={20} color={col} />
                  </View>
                  <View style={styles.metricTitleBlock}>
                    <Text style={styles.metricName}>{item.name}</Text>
                    <Text style={styles.metricDesc}>{item.desc}</Text>
                  </View>
                  <View style={[styles.levelBadge, { backgroundColor: col + '18' }]}>
                    <Text style={[styles.levelBadgeText, { color: col }]}>
                      {levelLabel(level)}
                    </Text>
                  </View>
                </View>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${(val / 25) * 100}%`, backgroundColor: col }]} />
                </View>
                <View style={styles.barLabels}>
                  <Text style={[styles.barScore, { color: col }]}>{val}/25</Text>
                </View>
              </View>
            );
          })}

          {/* Uyarılar */}
          {warnings.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Önemli Uyarılar</Text>
              {warnings.map((w, i) => (
                <View key={i} style={[styles.recCard, { borderLeftColor: '#D97706' }]}>
                  <Ionicons name="warning-outline" size={18} color="#D97706" />
                  <Text style={styles.recText}>{w}</Text>
                </View>
              ))}
            </>
          )}

          {/* Öneriler */}
          {insights.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Öneriler</Text>
              {insights.map((ins, i) => (
                <View key={i} style={[styles.recCard, { borderLeftColor: colors.personal }]}>
                  <Ionicons name="bulb-outline" size={18} color={colors.personal} />
                  <Text style={styles.recText}>{ins}</Text>
                </View>
              ))}
            </>
          )}

          {/* FinansKoç linki */}
          <TouchableOpacity
            style={styles.coachLink}
            onPress={() => navigation.navigate('Coach')}
          >
            <Ionicons name="school-outline" size={22} color={colors.personal} />
            <Text style={styles.coachLinkText}>FinansKoç ile skorunu yükselt</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.personal} />
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
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
  gaugeMax:   { fontSize: 14, color: colors.text.muted, fontWeight: '500' },
  scoreTitle: { fontSize: 16, fontWeight: '700', color: colors.text.primary },
  scoreDesc:  { fontSize: 13, color: colors.text.secondary, textAlign: 'center' },

  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    marginHorizontal: 16, marginBottom: 12,
    backgroundColor: colors.personalLight, borderRadius: 12,
    padding: 14, borderWidth: 1, borderColor: colors.personal + '30',
  },
  infoText: { flex: 1, fontSize: 12, color: colors.text.secondary, lineHeight: 18 },

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

  barTrack: { height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden' },
  barFill:  { height: '100%', borderRadius: 4 },
  barLabels: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4 },
  barScore:  { fontSize: 12, fontWeight: '700' },

  recCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    marginHorizontal: 16, marginBottom: 10,
    backgroundColor: colors.card, borderRadius: 12,
    padding: 14, borderLeftWidth: 3,
    borderWidth: 1, borderColor: colors.border,
  },
  recText: { flex: 1, fontSize: 13, color: colors.text.secondary, lineHeight: 20 },

  coachLink: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 16, marginTop: 4, marginBottom: 10,
    backgroundColor: '#EDE9FE', borderRadius: 14, padding: 16,
  },
  coachLinkText: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.personal },
});
