import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Modal, TextInput, Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { theme } from '../../constants/theme';
import { formatCurrency, formatCompact, formatShortDate } from '../../utils/formatters';
import { businessAPI } from '../../services/api';
import { useApi } from '../../hooks/useApi';

type AlertType = 'warning' | 'danger' | 'info';
type VadeTipi = 'short' | 'medium' | 'long';
type PeriodKey = 'day30' | 'day60' | 'day90' | 'month6' | 'month9' | 'month12' | 'year1' | 'year2' | 'year3';

interface ForecastPeriod {
  expectedIncome: number;
  expectedExpense: number;
  netCashflow: number;
  confidence: number;
}

interface ForecastResult {
  forecast: Partial<Record<PeriodKey, ForecastPeriod>>;
  alerts: { type: AlertType; message: string }[];
  insights: string[];
  recommendation: string;
}

const VADE_CONFIG: Record<VadeTipi, { label: string; sublabel: string; keys: PeriodKey[]; keyLabels: Partial<Record<PeriodKey, string>> }> = {
  short:  { label: 'Kısa Vade', sublabel: '30-60-90 Gün', keys: ['day30', 'day60', 'day90'],     keyLabels: { day30: '30 Gün', day60: '60 Gün', day90: '90 Gün' } },
  medium: { label: 'Orta Vade', sublabel: '6-9-12 Ay',    keys: ['month6', 'month9', 'month12'], keyLabels: { month6: '6 Ay', month9: '9 Ay', month12: '12 Ay' } },
  long:   { label: 'Uzun Vade', sublabel: '1-2-3 Yıl',    keys: ['year1', 'year2', 'year3'],     keyLabels: { year1: '1. Yıl', year2: '2. Yıl', year3: '3. Yıl' } },
};

interface Summary {
  currentMonth: { totalIncome: number; totalExpense: number };
  recentEntries: { type: string; id: string; amount: string; label: string; date: string; note: string }[];
}

const EXPENSE_CATEGORIES = ['Kira', 'Hammadde', 'Lojistik', 'Personel', 'Vergi', 'Enerji', 'Pazarlama', 'Diğer'];

export default function CashflowScreen({ navigation }: { navigation: any }) {
  const [selectedPeriod, setSelectedPeriod] = useState<VadeTipi>('short');
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [forecasting, setForecasting] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [entryType, setEntryType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [label, setLabel] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: summary, loading, refetch } = useApi<Summary>(
    useCallback(() => businessAPI.getCashflowSummary(), [])
  );

  const currentMonth = summary?.currentMonth ?? { totalIncome: 0, totalExpense: 0 };
  const net = currentMonth.totalIncome - currentMonth.totalExpense;
  const recentEntries = summary?.recentEntries ?? [];

  const handleForecast = async () => {
    setForecasting(true);
    try {
      const { data } = await businessAPI.getForecast(selectedPeriod);
      setForecast(data);
    } catch {
      Alert.alert('Hata', 'Tahmin alınırken bir sorun oluştu.');
    } finally {
      setForecasting(false);
    }
  };

  const handleSaveEntry = async () => {
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (!parsedAmount || parsedAmount <= 0) {
      Alert.alert('Hata', 'Geçerli bir tutar girin.');
      return;
    }
    if (!label.trim()) {
      Alert.alert('Hata', entryType === 'expense' ? 'Kategori seçin.' : 'Kaynak girin.');
      return;
    }

    setSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      if (entryType === 'expense') {
        await businessAPI.addExpense({ amount: parsedAmount, category: label, date: today });
      } else {
        await businessAPI.addIncome({ amount: parsedAmount, source: label, date: today });
      }
      setModalVisible(false);
      setAmount('');
      setLabel('');
      refetch();
    } catch {
      Alert.alert('Hata', 'Kayıt eklenirken bir sorun oluştu.');
    } finally {
      setSaving(false);
    }
  };

  const alertColor = (type: AlertType) => {
    if (type === 'danger') return colors.danger;
    if (type === 'warning') return colors.warning;
    return colors.primary;
  };

  const alertBg = (type: AlertType) => {
    if (type === 'danger') return colors.errorLight;
    if (type === 'warning') return colors.warningLight;
    return colors.primaryLight;
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
      >
        {/* Başlık */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={26} color={colors.text.primary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>NakitRadar</Text>
            <Text style={styles.subtitle}>30-60-90 günlük nakit akışı tahmini</Text>
          </View>
          <View style={[styles.radarIcon, { backgroundColor: colors.businessLight }]}>
            <Ionicons name="radio-outline" size={28} color={colors.business} />
          </View>
        </View>

        {/* Bu Ay Özeti */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { borderLeftColor: colors.secondary }]}>
            <Text style={styles.summaryLabel}>Bu Ay Gelir</Text>
            <Text style={[styles.summaryValue, { color: colors.secondary }]}>
              {formatCompact(currentMonth.totalIncome)}
            </Text>
          </View>
          <View style={[styles.summaryCard, { borderLeftColor: colors.danger }]}>
            <Text style={styles.summaryLabel}>Bu Ay Gider</Text>
            <Text style={[styles.summaryValue, { color: colors.danger }]}>
              {formatCompact(currentMonth.totalExpense)}
            </Text>
          </View>
          <View style={[styles.summaryCard, { borderLeftColor: net >= 0 ? colors.secondary : colors.danger }]}>
            <Text style={styles.summaryLabel}>Net</Text>
            <Text style={[styles.summaryValue, { color: net >= 0 ? colors.secondary : colors.danger }]}>
              {formatCompact(net)}
            </Text>
          </View>
        </View>

        {/* Hızlı Ekle */}
        <View style={styles.addRow}>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.secondary }]}
            onPress={() => { setEntryType('income'); setModalVisible(true); }}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.addBtnText}>+ Gelir</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.danger }]}
            onPress={() => { setEntryType('expense'); setModalVisible(true); }}
          >
            <Ionicons name="remove" size={18} color="#fff" />
            <Text style={styles.addBtnText}>+ Gider</Text>
          </TouchableOpacity>
        </View>

        {/* Vade Seçici */}
        <View style={styles.periodSelector}>
          {(Object.keys(VADE_CONFIG) as VadeTipi[]).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.periodBtn, selectedPeriod === p && styles.periodBtnActive]}
              onPress={() => { setSelectedPeriod(p); setForecast(null); }}
            >
              <Text style={[styles.periodBtnText, selectedPeriod === p && styles.periodBtnTextActive]}>
                {VADE_CONFIG[p].label}
              </Text>
              <Text style={[styles.periodBtnSub, selectedPeriod === p && styles.periodBtnSubActive]}>
                {VADE_CONFIG[p].sublabel}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* AI Tahmin Butonu */}
        <TouchableOpacity
          style={[styles.forecastBtn, forecasting && styles.forecastBtnDisabled]}
          onPress={handleForecast}
          disabled={forecasting}
        >
          {forecasting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Ionicons name="sparkles" size={20} color="#fff" />
          )}
          <Text style={styles.forecastBtnText}>
            {forecasting ? 'Tahmin hesaplanıyor...' : 'AI Tahmini Al'}
          </Text>
        </TouchableOpacity>

        {/* Tahmin Sonuçları */}
        {forecast && (
          <>
            <Text style={styles.sectionTitle}>Nakit Akışı Tahmini</Text>
            {VADE_CONFIG[selectedPeriod].keys.map((key) => {
              const period = forecast.forecast[key];
              if (!period) return null;
              const label = VADE_CONFIG[selectedPeriod].keyLabels[key]!;
              const isPositive = period.netCashflow >= 0;
              return (
                <View key={key} style={styles.forecastCard}>
                  <View style={styles.forecastHeader}>
                    <Text style={styles.forecastPeriod}>{label}</Text>
                    <View style={[styles.confidenceBadge, { backgroundColor: colors.primaryLight }]}>
                      <Text style={[styles.confidenceText, { color: colors.primary }]}>
                        %{period.confidence} güven
                      </Text>
                    </View>
                  </View>
                  <View style={styles.forecastRow}>
                    <View style={styles.forecastItem}>
                      <Text style={styles.forecastItemLabel}>Tahmini Gelir</Text>
                      <Text style={[styles.forecastItemValue, { color: colors.secondary }]}>
                        {formatCurrency(period.expectedIncome)}
                      </Text>
                    </View>
                    <View style={styles.forecastItem}>
                      <Text style={styles.forecastItemLabel}>Tahmini Gider</Text>
                      <Text style={[styles.forecastItemValue, { color: colors.danger }]}>
                        {formatCurrency(period.expectedExpense)}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.netBar, { backgroundColor: isPositive ? colors.successLight : colors.errorLight }]}>
                    <Text style={[styles.netLabel, { color: isPositive ? colors.secondary : colors.danger }]}>
                      Net: {formatCurrency(period.netCashflow)}
                    </Text>
                  </View>
                </View>
              );
            })}

            {/* Uyarılar */}
            {forecast.alerts.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Uyarılar</Text>
                {forecast.alerts.map((alert, i) => (
                  <View key={i} style={[styles.alertCard, { backgroundColor: alertBg(alert.type), borderLeftColor: alertColor(alert.type) }]}>
                    <Ionicons
                      name={alert.type === 'danger' ? 'warning' : alert.type === 'warning' ? 'alert-circle' : 'information-circle'}
                      size={18}
                      color={alertColor(alert.type)}
                    />
                    <Text style={[styles.alertText, { color: alertColor(alert.type) }]}>{alert.message}</Text>
                  </View>
                ))}
              </>
            )}

            {/* İçgörüler */}
            {forecast.insights.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Analizler</Text>
                {forecast.insights.map((insight, i) => (
                  <View key={i} style={styles.insightRow}>
                    <Ionicons name="bulb-outline" size={16} color={colors.accent} />
                    <Text style={styles.insightText}>{insight}</Text>
                  </View>
                ))}
              </>
            )}

            {/* Öneri */}
            {forecast.recommendation && (
              <View style={styles.recommendationCard}>
                <Text style={styles.recommendationTitle}>AI Önerisi</Text>
                <Text style={styles.recommendationText}>{forecast.recommendation}</Text>
              </View>
            )}
          </>
        )}

        {/* Son İşlemler */}
        {recentEntries.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Son İşlemler</Text>
            {recentEntries.map((entry) => (
              <View key={entry.id} style={styles.entryRow}>
                <View style={[styles.entryDot, { backgroundColor: entry.type === 'income' ? colors.secondary : colors.danger }]} />
                <View style={styles.entryInfo}>
                  <Text style={styles.entryLabel}>{entry.label || '—'}</Text>
                  <Text style={styles.entryDate}>{formatShortDate(entry.date)}</Text>
                </View>
                <Text style={[styles.entryAmount, { color: entry.type === 'income' ? colors.secondary : colors.danger }]}>
                  {entry.type === 'income' ? '+' : '-'}{formatCompact(parseFloat(entry.amount))}
                </Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {/* Giriş Modalı */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {entryType === 'income' ? 'Gelir Ekle' : 'Gider Ekle'}
            </Text>

            <Text style={styles.inputLabel}>Tutar (TL)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="0,00"
              value={amount}
              onChangeText={setAmount}
            />

            <Text style={styles.inputLabel}>{entryType === 'expense' ? 'Kategori' : 'Kaynak'}</Text>
            {entryType === 'expense' ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.categoryChip, label === cat && styles.categoryChipActive]}
                    onPress={() => setLabel(cat)}
                  >
                    <Text style={[styles.categoryChipText, label === cat && styles.categoryChipTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <TextInput
                style={styles.input}
                placeholder="Müşteri adı, hizmet vb."
                value={label}
                onChangeText={setLabel}
              />
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                onPress={handleSaveEntry}
                disabled={saving}
              >
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>Kaydet</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  radarIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },

  summaryRow: { flexDirection: 'row', gap: theme.spacing.sm },
  summaryCard: {
    flex: 1, backgroundColor: colors.card, borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm, borderLeftWidth: 3, ...theme.shadow.card,
  },
  summaryLabel: { fontSize: 11, color: colors.text.secondary, fontWeight: '500' },
  summaryValue: { fontSize: 15, fontWeight: '700', marginTop: 2 },

  addRow: { flexDirection: 'row', gap: theme.spacing.sm },
  addBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12, borderRadius: theme.borderRadius.md,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  periodSelector: { flexDirection: 'row', gap: theme.spacing.sm },
  periodBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 10, paddingHorizontal: 4,
    backgroundColor: colors.card, borderRadius: theme.borderRadius.md,
    borderWidth: 1.5, borderColor: colors.border, ...theme.shadow.card,
  },
  periodBtnActive: { borderColor: colors.business, backgroundColor: colors.businessLight },
  periodBtnText: { fontSize: 12, fontWeight: '700', color: colors.text.secondary },
  periodBtnTextActive: { color: colors.business },
  periodBtnSub: { fontSize: 10, color: colors.text.muted, marginTop: 2 },
  periodBtnSubActive: { color: colors.business },

  forecastBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: colors.business, paddingVertical: 14,
    borderRadius: theme.borderRadius.lg, ...theme.shadow.elevated,
  },
  forecastBtnDisabled: { opacity: 0.7 },
  forecastBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  sectionTitle: { ...theme.typography.h3, color: colors.text.primary },

  forecastCard: {
    backgroundColor: colors.card, borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md, gap: theme.spacing.sm, ...theme.shadow.card,
  },
  forecastHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  forecastPeriod: { ...theme.typography.h3, color: colors.text.primary },
  confidenceBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  confidenceText: { fontSize: 12, fontWeight: '600' },
  forecastRow: { flexDirection: 'row', gap: theme.spacing.sm },
  forecastItem: { flex: 1 },
  forecastItemLabel: { fontSize: 12, color: colors.text.secondary },
  forecastItemValue: { fontSize: 15, fontWeight: '700', marginTop: 2 },
  netBar: { borderRadius: theme.borderRadius.sm, padding: theme.spacing.sm, alignItems: 'center' },
  netLabel: { fontSize: 15, fontWeight: '700' },

  alertCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md, borderLeftWidth: 3,
  },
  alertText: { flex: 1, fontSize: 14, lineHeight: 20 },

  insightRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  insightText: { flex: 1, fontSize: 14, color: colors.text.secondary, lineHeight: 20 },

  recommendationCard: {
    backgroundColor: colors.businessLight, borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md, gap: 6,
  },
  recommendationTitle: { fontSize: 13, fontWeight: '700', color: colors.business },
  recommendationText: { fontSize: 14, color: colors.text.secondary, lineHeight: 21 },

  entryRow: {
    flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm,
    backgroundColor: colors.card, borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md, ...theme.shadow.card,
  },
  entryDot: { width: 10, height: 10, borderRadius: 5 },
  entryInfo: { flex: 1 },
  entryLabel: { fontSize: 14, fontWeight: '600', color: colors.text.primary },
  entryDate: { fontSize: 12, color: colors.text.secondary, marginTop: 2 },
  entryAmount: { fontSize: 14, fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: theme.spacing.lg, gap: theme.spacing.md,
  },
  modalTitle: { ...theme.typography.h3, color: colors.text.primary, textAlign: 'center' },
  inputLabel: { fontSize: 13, fontWeight: '600', color: colors.text.secondary },
  input: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: theme.borderRadius.md,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: colors.text.primary,
    backgroundColor: colors.background,
  },
  categoriesScroll: { flexGrow: 0 },
  categoryChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: colors.border, marginRight: 8, backgroundColor: colors.background,
  },
  categoryChipActive: { borderColor: colors.business, backgroundColor: colors.businessLight },
  categoryChipText: { fontSize: 13, color: colors.text.secondary, fontWeight: '500' },
  categoryChipTextActive: { color: colors.business, fontWeight: '700' },
  modalActions: { flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.sm },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: theme.borderRadius.md,
    borderWidth: 1.5, borderColor: colors.border, alignItems: 'center',
  },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: colors.text.secondary },
  saveBtn: {
    flex: 2, paddingVertical: 14, borderRadius: theme.borderRadius.md,
    backgroundColor: colors.business, alignItems: 'center',
  },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
