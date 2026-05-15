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

export default function BudgetScreen() {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisText, setAnalysisText] = useState('');

  const month = formatMonth(selectedMonth);
  const { data: summary, loading, refetch } = useApi(
    useCallback(() => personalAPI.getSummary(month), [month])
  );
  const { mutate: analyze, loading: analyzing } = useApiMutation(personalAPI.analyzeBudget);

  const categories: { category: string; amount: number; limit?: number }[] = summary?.categories || [];
  const total = summary?.total || 0;

  const handleAnalyze = async () => {
    try {
      const result = await analyze(undefined as any);
      setAnalysisText((result as any).insight || 'Analiz tamamlandı.');
      setShowAnalysis(true);
    } catch {
      Alert.alert('Hata', 'Analiz yapılamadı');
    }
  };

  const shiftMonth = (dir: 1 | -1) => {
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
        <TouchableOpacity onPress={() => shiftMonth(1)}>
          <Ionicons name="chevron-forward" size={24} color={colors.text.primary} />
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

      {/* Analiz Modalı */}
      <Modal visible={showAnalysis} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>AI Bütçe Analizi</Text>
            <Text style={styles.modalText}>{analysisText}</Text>
            <Button title="Kapat" onPress={() => setShowAnalysis(false)} />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    ...theme.shadow.card,
  },
  monthLabel: { ...theme.typography.h3, color: colors.text.primary },
  totalCard: {
    backgroundColor: colors.personal,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    ...theme.shadow.elevated,
  },
  totalLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '500' },
  totalValue: { color: '#fff', fontSize: 32, fontWeight: '700', marginTop: 4 },
  chartCard: {
    backgroundColor: colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    ...theme.shadow.card,
  },
  sectionTitle: { ...theme.typography.h3, color: colors.text.primary },
  catCard: {
    backgroundColor: colors.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    ...theme.shadow.card,
  },
  catHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  catName: { ...theme.typography.body, fontWeight: '600', color: colors.text.primary },
  catAmount: { ...theme.typography.body, color: colors.text.secondary },
  bar: { height: 8, backgroundColor: '#E2E8F0', borderRadius: 99, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 99 },
  overText: { fontSize: 12, color: colors.danger, fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: theme.spacing.lg,
    paddingBottom: 40,
    gap: theme.spacing.md,
  },
  modalTitle: { ...theme.typography.h3, color: colors.text.primary },
  modalText: { ...theme.typography.body, color: colors.text.secondary, lineHeight: 24 },
});
