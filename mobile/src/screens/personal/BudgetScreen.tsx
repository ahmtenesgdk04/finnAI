import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, Modal, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { theme } from '../../constants/theme';
import { formatCurrency, formatMonth, formatPercent } from '../../utils/formatters';
import { personalAPI } from '../../services/api';
import { useApi, useApiMutation } from '../../hooks/useApi';
import ExpensePieChart from '../../components/charts/ExpensePieChart';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button from '../../components/common/Button';

type AlertType = 'danger' | 'warning' | 'info';

interface BudgetAnalysis {
  alerts: { type: AlertType; message: string }[];
  insights: string[];
  recommendation: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  'Market': '🛒', 'Yemek': '🍽️', 'Ulaşım': '🚌', 'Eğlence': '🎮',
  'Fatura': '💡', 'Sağlık': '💊', 'Giyim': '👕', 'Eğitim': '📚',
  'Spor': '🏃', 'Kozmetik': '💄', 'Elektronik': '📱', 'Ev': '🏠',
};
const categoryIcon = (cat: string) => CATEGORY_ICONS[cat] || '💸';

const alertColor = (type: AlertType) => {
  if (type === 'danger') return colors.danger;
  if (type === 'warning') return colors.warning;
  return colors.primary;
};
const alertBg = (type: AlertType) => {
  if (type === 'danger') return '#FEF2F2';
  if (type === 'warning') return '#FFFBEB';
  return '#EFF6FF';
};

export default function BudgetScreen() {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysis, setAnalysis] = useState<BudgetAnalysis | null>(null);
  const [showAllExpenses, setShowAllExpenses] = useState(false);

  const month = formatMonth(selectedMonth);
  const { data: summary, loading, refetch } = useApi(
    useCallback(() => personalAPI.getSummary(month), [month])
  );
  const { mutate: analyze, loading: analyzing } = useApiMutation(personalAPI.analyzeBudget);

  const categories: { category: string; amount: number; limit?: number }[] = summary?.categories || [];
  const total = summary?.total || 0;
  const entries: { id: string; category: string; amount: number; date: string; note?: string }[] = summary?.entries || [];
  const visibleEntries = showAllExpenses ? entries : entries.slice(0, 5);

  const handleAnalyze = async () => {
    try {
      const result = await analyze(undefined as any) as any;
      setAnalysis({
        alerts: result.alerts || [],
        insights: result.insights || [],
        recommendation: result.recommendation || '',
      });
      setShowAnalysis(true);
    } catch {
      Alert.alert('Hata', 'Analiz yapılamadı');
    }
  };

  const now = new Date();
  const isCurrentMonth =
    selectedMonth.getFullYear() === now.getFullYear() &&
    selectedMonth.getMonth() === now.getMonth();

  const shiftMonth = (dir: 1 | -1) => {
    if (dir === 1 && isCurrentMonth) return;
    setSelectedMonth((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + dir);
      return d;
    });
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
    >
      {/* Ay seçici */}
      <View style={styles.monthRow}>
        <TouchableOpacity onPress={() => shiftMonth(-1)}>
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.monthLabel}>
          {selectedMonth.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
        </Text>
        <TouchableOpacity onPress={() => shiftMonth(1)} disabled={isCurrentMonth}>
          <Ionicons name="chevron-forward" size={24} color={isCurrentMonth ? colors.border : colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Toplam */}
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Toplam Harcama</Text>
        <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
      </View>

      {/* Pasta grafik */}
      {categories.length > 0 && (
        <View style={styles.chartCard}>
          <ExpensePieChart
            data={categories.map((c) => ({ category: c.category, amount: c.amount }))}
          />
        </View>
      )}

      {/* AI Analiz butonu */}
      <Button
        title={analyzing ? 'Analiz ediliyor...' : 'AI Bütçe Analizi'}
        onPress={handleAnalyze}
        loading={analyzing}
        variant="outline"
      />

      {/* Kategori listesi */}
      <Text style={styles.sectionTitle}>Kategoriler</Text>
      {loading ? (
        <LoadingSpinner />
      ) : (
        categories.map((cat) => {
          const pct = cat.limit ? (cat.amount / cat.limit) * 100 : 0;
          const over = cat.limit && cat.amount > cat.limit;
          return (
            <View key={cat.category} style={styles.catCard}>
              <View style={styles.catHeader}>
                <Text style={styles.catName}>{cat.category}</Text>
                <Text style={[styles.catAmount, over ? { color: colors.danger } : {}]}>
                  {formatCurrency(cat.amount)}
                  {cat.limit ? ` / ${formatCurrency(cat.limit)}` : ''}
                </Text>
              </View>
              {cat.limit && (
                <View style={styles.bar}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${Math.min(pct, 100)}%`,
                        backgroundColor: over ? colors.danger : pct > 80 ? colors.warning : colors.secondary,
                      },
                    ]}
                  />
                </View>
              )}
              {over && (
                <Text style={styles.overText}>Limit aşıldı! {formatPercent(pct - 100)} fazla</Text>
              )}
            </View>
          );
        })
      )}

      {/* Harcama Listesi */}
      {entries.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Harcamalar</Text>
          {visibleEntries.map((e) => (
            <View key={e.id} style={styles.entryRow}>
              <View style={styles.entryIcon}>
                <Text style={{ fontSize: 20 }}>{categoryIcon(e.category)}</Text>
              </View>
              <View style={styles.entryInfo}>
                <Text style={styles.entryCategory}>{e.category}</Text>
                {e.note && !/^\d{4}-\d{2}-\d{2}T/.test(e.note) ? <Text style={styles.entryNote}>{e.note}</Text> : null}
                <Text style={styles.entryDate}>
                  {new Date(e.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                </Text>
              </View>
              <Text style={[styles.entryAmount, e.amount < 0 && { color: colors.secondary }]}>
                {e.amount < 0 ? `+${formatCurrency(-e.amount)}` : `-${formatCurrency(e.amount)}`}
              </Text>
            </View>
          ))}
          {entries.length > 5 && (
            <TouchableOpacity style={styles.showMoreBtn} onPress={() => setShowAllExpenses((v) => !v)}>
              <Text style={styles.showMoreText}>
                {showAllExpenses ? 'Daha az göster' : `Tümünü gör (${entries.length})`}
              </Text>
              <Ionicons
                name={showAllExpenses ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={colors.personal}
              />
            </TouchableOpacity>
          )}
        </>
      )}

      {/* Analiz Modalı */}
      <Modal visible={showAnalysis} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Başlık */}
              <View style={styles.modalHeader}>
                <Ionicons name="sparkles" size={18} color={colors.personal} />
                <Text style={styles.modalTitle}>AI Bütçe Analizi</Text>
              </View>

              {/* Uyarılar */}
              {analysis && analysis.alerts.length > 0 && (
                <View style={styles.analysisSection}>
                  <Text style={styles.analysisSectionTitle}>Uyarılar</Text>
                  {analysis.alerts.map((a, i) => (
                    <View key={i} style={[styles.alertCard, { backgroundColor: alertBg(a.type), borderLeftColor: alertColor(a.type) }]}>
                      <Ionicons
                        name={a.type === 'danger' ? 'warning' : a.type === 'warning' ? 'alert-circle' : 'information-circle'}
                        size={16}
                        color={alertColor(a.type)}
                      />
                      <Text style={[styles.alertText, { color: alertColor(a.type) }]}>{a.message}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* İçgörüler */}
              {analysis && analysis.insights.length > 0 && (
                <View style={styles.analysisSection}>
                  <Text style={styles.analysisSectionTitle}>Analizler</Text>
                  {analysis.insights.map((ins, i) => (
                    <View key={i} style={styles.insightRow}>
                      <Ionicons name="bulb-outline" size={16} color={colors.personal} />
                      <Text style={styles.insightText}>{ins}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Öneri */}
              {analysis?.recommendation ? (
                <View style={styles.recommendationCard}>
                  <Text style={styles.recommendationTitle}>AI Önerisi</Text>
                  <Text style={styles.recommendationText}>{analysis.recommendation}</Text>
                </View>
              ) : null}

              <Text style={styles.geminiNote}>Gemini ile analiz edildi</Text>
              <Button title="Kapat" onPress={() => setShowAnalysis(false)} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { padding: theme.spacing.md, gap: theme.spacing.md, paddingBottom: 32 },
  monthRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.card, borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md, ...theme.shadow.card,
  },
  monthLabel: { ...theme.typography.h3, color: colors.text.primary },
  totalCard: {
    backgroundColor: colors.personal, borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg, alignItems: 'center', ...theme.shadow.elevated,
  },
  totalLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '500' },
  totalValue: { color: '#fff', fontSize: 32, fontWeight: '700', marginTop: 4 },
  chartCard: {
    backgroundColor: colors.card, borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md, ...theme.shadow.card,
  },
  sectionTitle: { ...theme.typography.h3, color: colors.text.primary },
  catCard: {
    backgroundColor: colors.card, borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md, gap: theme.spacing.sm, ...theme.shadow.card,
  },
  catHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  catName: { ...theme.typography.body, fontWeight: '600', color: colors.text.primary },
  catAmount: { ...theme.typography.body, color: colors.text.secondary },
  bar: { height: 8, backgroundColor: '#E2E8F0', borderRadius: 99, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 99 },
  overText: { fontSize: 12, color: colors.danger, fontWeight: '500' },
  entryRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card,
    borderRadius: theme.borderRadius.md, padding: theme.spacing.md,
    gap: theme.spacing.sm, ...theme.shadow.card,
  },
  entryIcon: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.background,
    alignItems: 'center', justifyContent: 'center',
  },
  entryInfo: { flex: 1, gap: 2 },
  entryCategory: { fontSize: 14, fontWeight: '600', color: colors.text.primary },
  entryNote: { fontSize: 12, color: colors.text.secondary },
  entryDate: { fontSize: 11, color: colors.text.muted },
  entryAmount: { fontSize: 14, fontWeight: '700', color: colors.danger },
  showMoreBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, paddingVertical: theme.spacing.sm,
  },
  showMoreText: { fontSize: 14, color: colors.personal, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: theme.spacing.lg, paddingBottom: 40, maxHeight: '85%',
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: theme.spacing.md },
  modalTitle: { ...theme.typography.h3, color: colors.text.primary },
  analysisSection: { gap: theme.spacing.sm, marginBottom: theme.spacing.md },
  analysisSectionTitle: { fontSize: 13, fontWeight: '700', color: colors.text.secondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  alertCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    padding: theme.spacing.md, borderRadius: theme.borderRadius.md, borderLeftWidth: 3,
  },
  alertText: { flex: 1, fontSize: 14, lineHeight: 20 },
  insightRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  insightText: { flex: 1, fontSize: 14, color: colors.text.secondary, lineHeight: 20 },
  recommendationCard: {
    backgroundColor: '#EDE9FE', borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md, gap: 6, marginBottom: theme.spacing.md,
  },
  recommendationTitle: { fontSize: 13, fontWeight: '700', color: colors.personal },
  recommendationText: { fontSize: 14, color: colors.text.secondary, lineHeight: 21 },
  geminiNote: { fontSize: 11, color: colors.text.muted, textAlign: 'right', fontStyle: 'italic', marginBottom: theme.spacing.md },
});
