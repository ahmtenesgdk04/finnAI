import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { theme } from '../../constants/theme';
import { formatCurrency } from '../../utils/formatters';
import { businessAPI } from '../../services/api';

type Severity = 'warning' | 'danger';
type Priority = 'high' | 'medium' | 'low';

interface SavingSuggestion {
  category: string;
  suggestion: string;
  estimatedSaving: number;
  priority: Priority;
}

interface Anomaly {
  description: string;
  severity: Severity;
}

interface AnalysisResult {
  score: number;
  summary: string;
  savings: SavingSuggestion[];
  anomalies: Anomaly[];
  topExpenseCategories: string[];
  recommendation: string;
}

const priorityColor = (p: Priority) => {
  if (p === 'high') return colors.danger;
  if (p === 'medium') return colors.warning;
  return colors.secondary;
};

const priorityLabel = (p: Priority) => {
  if (p === 'high') return 'Yüksek';
  if (p === 'medium') return 'Orta';
  return 'Düşük';
};

const scoreColor = (s: number) => {
  if (s >= 70) return colors.secondary;
  if (s >= 40) return colors.warning;
  return colors.danger;
};

export default function ExpenseAnalysisScreen({ navigation }: { navigation: any }) {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const { data } = await businessAPI.analyzeExpenses();
      setResult(data);
    } catch {
      Alert.alert('Hata', 'Analiz yapılırken bir sorun oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={26} color={colors.text.primary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Akıllı Gider Analizi</Text>
            <Text style={styles.subtitle}>Giderlerini AI ile optimize et</Text>
          </View>
          <View style={[styles.iconBox, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="document-text-outline" size={28} color={colors.warning} />
          </View>
        </View>

        {/* Analiz Butonu */}
        <TouchableOpacity
          style={[styles.analyzeBtn, loading && { opacity: 0.7 }]}
          onPress={handleAnalyze}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Ionicons name="sparkles" size={20} color="#fff" />
          )}
          <Text style={styles.analyzeBtnText}>
            {loading ? 'Analiz yapılıyor...' : 'AI Analizi Başlat'}
          </Text>
        </TouchableOpacity>

        {!result && !loading && (
          <View style={styles.emptyState}>
            <Ionicons name="analytics-outline" size={56} color={colors.border} />
            <Text style={styles.emptyTitle}>Gider analizine hazır</Text>
            <Text style={styles.emptySub}>
              Son 3 aylık gider verilerin yapay zeka ile incelenerek tasarruf fırsatları ve anormallikler tespit edilecek.
            </Text>
          </View>
        )}

        {result && (
          <>
            {/* Skor */}
            <View style={styles.scoreCard}>
              <View style={[styles.scoreCircle, { borderColor: scoreColor(result.score) }]}>
                <Text style={[styles.scoreNumber, { color: scoreColor(result.score) }]}>{result.score}</Text>
                <Text style={styles.scoreLabel}>/ 100</Text>
              </View>
              <View style={styles.scoreInfo}>
                <Text style={styles.scoreTitle}>Optimizasyon Skoru</Text>
                <Text style={styles.scoreSummary}>{result.summary}</Text>
              </View>
            </View>

            {/* Top kategoriler */}
            {result.topExpenseCategories.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>En Yüksek Gider Kategorileri</Text>
                <View style={styles.chipRow}>
                  {result.topExpenseCategories.map((cat, i) => (
                    <View key={i} style={styles.chip}>
                      <Text style={styles.chipText}>{cat}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* Tasarruf Önerileri */}
            {result.savings.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Tasarruf Fırsatları</Text>
                {result.savings.map((s, i) => (
                  <View key={i} style={styles.savingCard}>
                    <View style={styles.savingHeader}>
                      <View style={[styles.priorityBadge, { backgroundColor: priorityColor(s.priority) + '20' }]}>
                        <Text style={[styles.priorityText, { color: priorityColor(s.priority) }]}>
                          {priorityLabel(s.priority)}
                        </Text>
                      </View>
                      <Text style={styles.savingCategory}>{s.category}</Text>
                      <Text style={styles.savingAmount}>+{formatCurrency(s.estimatedSaving)}</Text>
                    </View>
                    <Text style={styles.savingSuggestion}>{s.suggestion}</Text>
                  </View>
                ))}
              </>
            )}

            {/* Anormallikler */}
            {result.anomalies.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Dikkat Edilmesi Gerekenler</Text>
                {result.anomalies.map((a, i) => (
                  <View
                    key={i}
                    style={[
                      styles.anomalyCard,
                      {
                        backgroundColor: a.severity === 'danger' ? colors.errorLight : colors.warningLight,
                        borderLeftColor: a.severity === 'danger' ? colors.danger : colors.warning,
                      },
                    ]}
                  >
                    <Ionicons
                      name={a.severity === 'danger' ? 'warning' : 'alert-circle'}
                      size={18}
                      color={a.severity === 'danger' ? colors.danger : colors.warning}
                    />
                    <Text style={styles.anomalyText}>{a.description}</Text>
                  </View>
                ))}
              </>
            )}

            {/* Öneri */}
            {result.recommendation && (
              <View style={styles.recommendationCard}>
                <Text style={styles.recommendationTitle}>AI Önerisi</Text>
                <Text style={styles.recommendationText}>{result.recommendation}</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { padding: theme.spacing.md, gap: theme.spacing.md, paddingBottom: 40 },

  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backBtn: { padding: 4 },
  title: { ...theme.typography.h2, color: colors.text.primary },
  subtitle: { ...theme.typography.caption, color: colors.text.secondary, marginTop: 2 },
  iconBox: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },

  analyzeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: colors.warning, paddingVertical: 14,
    borderRadius: theme.borderRadius.lg, ...theme.shadow.elevated,
  },
  analyzeBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyTitle: { ...theme.typography.h3, color: colors.text.secondary },
  emptySub: { fontSize: 14, color: colors.text.muted, textAlign: 'center', lineHeight: 22, maxWidth: 280 },

  scoreCard: {
    backgroundColor: colors.card, borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md, flexDirection: 'row', alignItems: 'center',
    gap: theme.spacing.md, ...theme.shadow.card,
  },
  scoreCircle: {
    width: 80, height: 80, borderRadius: 40, borderWidth: 4,
    alignItems: 'center', justifyContent: 'center',
  },
  scoreNumber: { fontSize: 24, fontWeight: '800' },
  scoreLabel: { fontSize: 11, color: colors.text.muted },
  scoreInfo: { flex: 1, gap: 4 },
  scoreTitle: { fontSize: 13, fontWeight: '700', color: colors.text.secondary },
  scoreSummary: { fontSize: 13, color: colors.text.secondary, lineHeight: 18 },

  sectionTitle: { ...theme.typography.h3, color: colors.text.primary },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 6, backgroundColor: colors.businessLight,
    borderRadius: 16,
  },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.business },

  savingCard: {
    backgroundColor: colors.card, borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md, gap: 6, ...theme.shadow.card,
  },
  savingHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  priorityText: { fontSize: 11, fontWeight: '700' },
  savingCategory: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.text.primary },
  savingAmount: { fontSize: 14, fontWeight: '700', color: colors.secondary },
  savingSuggestion: { fontSize: 13, color: colors.text.secondary, lineHeight: 18 },

  anomalyCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    padding: theme.spacing.md, borderRadius: theme.borderRadius.md, borderLeftWidth: 3,
  },
  anomalyText: { flex: 1, fontSize: 14, color: colors.text.primary, lineHeight: 20 },

  recommendationCard: {
    backgroundColor: colors.businessLight, borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md, gap: 6,
  },
  recommendationTitle: { fontSize: 13, fontWeight: '700', color: colors.business },
  recommendationText: { fontSize: 14, color: colors.text.secondary, lineHeight: 21 },
});
