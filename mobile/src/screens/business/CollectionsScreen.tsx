import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Modal, TextInput, Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { theme } from '../../constants/theme';
import { formatCurrency, formatShortDate } from '../../utils/formatters';
import { businessAPI } from '../../services/api';
import { useApi } from '../../hooks/useApi';

type Urgency = 'critical' | 'high' | 'medium' | 'low';

interface Collection {
  id: string;
  customer_name: string;
  amount: string;
  due_date: string;
  paid: boolean;
  created_at: string;
}

interface CollectionScore {
  id: string;
  paymentProbability: number;
  urgency: Urgency;
  recommendation: string;
  followUpScript: string;
}

interface AnalysisResult {
  scores: CollectionScore[];
  totalAtRisk: number;
  summary: string;
}

const urgencyColor = (u: Urgency) => {
  if (u === 'critical') return colors.danger;
  if (u === 'high') return '#F97316';
  if (u === 'medium') return colors.warning;
  return colors.secondary;
};

const urgencyLabel = (u: Urgency) => {
  if (u === 'critical') return 'Kritik';
  if (u === 'high') return 'Yüksek';
  if (u === 'medium') return 'Orta';
  return 'Düşük';
};

const daysOverdue = (dueDate: string) => {
  const diff = Math.floor((Date.now() - new Date(dueDate).getTime()) / 86400000);
  return diff;
};

export default function CollectionsScreen({ navigation }: { navigation: any }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedScore, setSelectedScore] = useState<CollectionScore | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  const { data: collections, loading, refetch } = useApi<Collection[]>(
    useCallback(() => businessAPI.getCollections(), [])
  );

  const unpaid = (collections ?? []).filter((c) => !c.paid);
  const paid = (collections ?? []).filter((c) => c.paid);
  const totalOutstanding = unpaid.reduce((s, c) => s + parseFloat(c.amount), 0);

  const handleAdd = async () => {
    if (!customerName.trim()) return Alert.alert('Hata', 'Müşteri adı girin.');
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (!parsedAmount || parsedAmount <= 0) return Alert.alert('Hata', 'Geçerli tutar girin.');
    if (!dueDate.trim()) return Alert.alert('Hata', 'Vade tarihi girin. (YYYY-AA-GG)');
    setSaving(true);
    try {
      await businessAPI.addCollection({ customerName: customerName.trim(), amount: parsedAmount, dueDate });
      setModalVisible(false);
      setCustomerName('');
      setAmount('');
      setDueDate('');
      refetch();
    } catch {
      Alert.alert('Hata', 'Kayıt eklenemedi.');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkPaid = async (id: string) => {
    try {
      await businessAPI.markCollectionPaid(id);
      refetch();
    } catch {
      Alert.alert('Hata', 'Güncelleme yapılamadı.');
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Sil', 'Bu alacağı silmek istiyor musun?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil', style: 'destructive', onPress: async () => {
          await businessAPI.deleteCollection(id);
          refetch();
        },
      },
    ]);
  };

  const handleAnalyze = async () => {
    if (unpaid.length === 0) return Alert.alert('Bilgi', 'Analiz için bekleyen alacak yok.');
    setAnalyzing(true);
    try {
      const { data } = await businessAPI.analyzeCollections();
      setAnalysis(data);
    } catch {
      Alert.alert('Hata', 'AI analizi yapılamadı.');
    } finally {
      setAnalyzing(false);
    }
  };

  const getScore = (id: string) => analysis?.scores.find((s) => s.id === id);

  const openDetail = (score: CollectionScore) => {
    setSelectedScore(score);
    setDetailVisible(true);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={26} color={colors.text.primary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Alacak Takibi</Text>
            <Text style={styles.subtitle}>Müşteri alacak takibi ve AI tavsiye</Text>
          </View>
          <TouchableOpacity
            style={[styles.addFab, { backgroundColor: colors.business }]}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Özet */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderLeftColor: colors.warning }]}>
            <Text style={styles.statLabel}>Bekleyen Alacak</Text>
            <Text style={[styles.statValue, { color: colors.warning }]}>{formatCurrency(totalOutstanding)}</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: colors.danger }]}>
            <Text style={styles.statLabel}>Müşteri Sayısı</Text>
            <Text style={[styles.statValue, { color: colors.danger }]}>{unpaid.length}</Text>
          </View>
        </View>

        {/* AI analiz özeti */}
        {analysis && (
          <View style={styles.analysisSummaryCard}>
            <View style={styles.analysisSummaryHeader}>
              <Ionicons name="sparkles" size={16} color={colors.business} />
              <Text style={styles.analysisSummaryTitle}>AI Analiz Özeti</Text>
              {analysis.totalAtRisk > 0 && (
                <Text style={styles.atRisk}>Risk: {formatCurrency(analysis.totalAtRisk)}</Text>
              )}
            </View>
            <Text style={styles.analysisSummaryText}>{analysis.summary}</Text>
          </View>
        )}

        {/* AI Analiz Butonu */}
        <TouchableOpacity
          style={[styles.analyzeBtn, analyzing && { opacity: 0.7 }]}
          onPress={handleAnalyze}
          disabled={analyzing}
        >
          {analyzing ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="people" size={18} color="#fff" />}
          <Text style={styles.analyzeBtnText}>
            {analyzing ? 'Analiz ediliyor...' : 'AI Alacak Analizi'}
          </Text>
        </TouchableOpacity>

        {/* Bekleyen Alacaklar */}
        {unpaid.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Bekleyen Alacaklar</Text>
            {unpaid.map((c) => {
              const score = getScore(c.id);
              const overdue = daysOverdue(c.due_date);
              const isOverdue = overdue > 0;
              return (
                <View key={c.id} style={styles.collectionCard}>
                  <View style={styles.cardTop}>
                    <View style={styles.cardLeft}>
                      <Text style={styles.customerName}>{c.customer_name}</Text>
                      <Text style={[styles.dueDateText, isOverdue && { color: colors.danger }]}>
                        {isOverdue ? `${overdue} gün gecikmiş` : `Vade: ${formatShortDate(c.due_date)}`}
                      </Text>
                    </View>
                    <Text style={styles.collectionAmount}>{formatCurrency(parseFloat(c.amount))}</Text>
                  </View>

                  {score && (
                    <TouchableOpacity style={styles.scoreBadgeRow} onPress={() => openDetail(score)}>
                      <View style={[styles.urgencyBadge, { backgroundColor: urgencyColor(score.urgency) + '20' }]}>
                        <Text style={[styles.urgencyText, { color: urgencyColor(score.urgency) }]}>
                          {urgencyLabel(score.urgency)}
                        </Text>
                      </View>
                      <Text style={styles.probabilityText} numberOfLines={1}>{score.recommendation}</Text>
                      <Ionicons name="chevron-forward" size={14} color={colors.text.muted} />
                    </TouchableOpacity>
                  )}

                  <View style={styles.cardActions}>
                    <TouchableOpacity style={styles.paidBtn} onPress={() => handleMarkPaid(c.id)}>
                      <Ionicons name="checkmark-circle-outline" size={16} color={colors.secondary} />
                      <Text style={styles.paidBtnText}>Ödendi</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(c.id)}>
                      <Ionicons name="trash-outline" size={16} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </>
        )}

        {/* Tahsil Edilenler */}
        {paid.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Tahsil Edildi</Text>
            {paid.map((c) => (
              <View key={c.id} style={[styles.collectionCard, { opacity: 0.6 }]}>
                <View style={styles.cardTop}>
                  <View style={styles.cardLeft}>
                    <Text style={styles.customerName}>{c.customer_name}</Text>
                    <Text style={styles.dueDateText}>Ödendi</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={[styles.collectionAmount, { color: colors.secondary }]}>
                      {formatCurrency(parseFloat(c.amount))}
                    </Text>
                    <TouchableOpacity onPress={() => handleDelete(c.id)}>
                      <Ionicons name="trash-outline" size={16} color={colors.text.muted} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}

        {(collections ?? []).length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={56} color={colors.border} />
            <Text style={styles.emptyTitle}>Alacak kaydı yok</Text>
            <Text style={styles.emptySub}>+ butonuna tıklayarak ilk alacağını ekle.</Text>
          </View>
        )}
      </ScrollView>

      {/* Yeni Alacak Modalı */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Yeni Alacak Ekle</Text>

            <Text style={styles.inputLabel}>Müşteri / Firma Adı</Text>
            <TextInput
              style={styles.input}
              placeholder="Örn: ABC Tekstil"
              value={customerName}
              onChangeText={setCustomerName}
            />

            <Text style={styles.inputLabel}>Tutar (TL)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="0,00"
              value={amount}
              onChangeText={setAmount}
            />

            <Text style={styles.inputLabel}>Vade Tarihi (YYYY-AA-GG)</Text>
            <TextInput
              style={styles.input}
              placeholder="2025-06-30"
              value={dueDate}
              onChangeText={setDueDate}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleAdd} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveText}>Kaydet</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Skor Detay Modalı */}
      <Modal visible={detailVisible} animationType="slide" transparent onRequestClose={() => setDetailVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            {selectedScore && (
              <>
                <Text style={styles.modalTitle}>AI Tavsiye</Text>

                <View style={[styles.urgencyBanner, { backgroundColor: urgencyColor(selectedScore.urgency) + '15' }]}>
                  <Text style={[styles.urgencyBannerText, { color: urgencyColor(selectedScore.urgency) }]}>
                    Aciliyet: {urgencyLabel(selectedScore.urgency)}
                  </Text>
                </View>

                <Text style={styles.detailSection}>Tavsiye</Text>
                <Text style={styles.detailText}>{selectedScore.recommendation}</Text>

                <TouchableOpacity style={styles.saveBtn} onPress={() => setDetailVisible(false)}>
                  <Text style={styles.saveText}>Kapat</Text>
                </TouchableOpacity>
              </>
            )}
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
  addFab: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', ...theme.shadow.elevated },

  statsRow: { flexDirection: 'row', gap: theme.spacing.sm },
  statCard: {
    flex: 1, backgroundColor: colors.card, borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm, borderLeftWidth: 3, ...theme.shadow.card,
  },
  statLabel: { fontSize: 11, color: colors.text.secondary, fontWeight: '500' },
  statValue: { fontSize: 16, fontWeight: '700', marginTop: 2 },

  analysisSummaryCard: {
    backgroundColor: colors.primaryLight, borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md, gap: 6,
  },
  analysisSummaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  analysisSummaryTitle: { fontSize: 13, fontWeight: '700', color: colors.business, flex: 1 },
  atRisk: { fontSize: 12, color: colors.danger, fontWeight: '700' },
  analysisSummaryText: { fontSize: 13, color: colors.text.secondary, lineHeight: 18 },

  analyzeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: colors.business, paddingVertical: 13,
    borderRadius: theme.borderRadius.lg, ...theme.shadow.elevated,
  },
  analyzeBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  sectionTitle: { ...theme.typography.h3, color: colors.text.primary },

  collectionCard: {
    backgroundColor: colors.card, borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md, gap: theme.spacing.sm, ...theme.shadow.card,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardLeft: { flex: 1, gap: 2 },
  customerName: { fontSize: 15, fontWeight: '700', color: colors.text.primary },
  dueDateText: { fontSize: 12, color: colors.text.secondary },
  collectionAmount: { fontSize: 16, fontWeight: '800', color: colors.text.primary },

  scoreBadgeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.background, borderRadius: theme.borderRadius.sm, padding: 8,
  },
  urgencyBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  urgencyText: { fontSize: 11, fontWeight: '700' },
  probabilityText: { flex: 1, fontSize: 12, color: colors.text.secondary },

  cardActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  paidBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 8, borderRadius: theme.borderRadius.sm,
    borderWidth: 1.5, borderColor: colors.secondary,
  },
  paidBtnText: { fontSize: 13, fontWeight: '600', color: colors.secondary },
  deleteBtn: {
    width: 36, height: 36, alignItems: 'center', justifyContent: 'center',
    borderRadius: theme.borderRadius.sm, borderWidth: 1.5, borderColor: colors.danger,
  },

  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyTitle: { ...theme.typography.h3, color: colors.text.secondary },
  emptySub: { fontSize: 14, color: colors.text.muted, textAlign: 'center' },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
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
  modalActions: { flexDirection: 'row', gap: theme.spacing.sm },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: theme.borderRadius.md,
    borderWidth: 1.5, borderColor: colors.border, alignItems: 'center',
  },
  cancelText: { fontSize: 15, fontWeight: '600', color: colors.text.secondary },
  saveBtn: {
    flex: 2, paddingVertical: 14, borderRadius: theme.borderRadius.md,
    backgroundColor: colors.business, alignItems: 'center',
  },
  saveText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  probCircle: {
    width: 96, height: 96, borderRadius: 48, borderWidth: 5,
    alignItems: 'center', justifyContent: 'center', alignSelf: 'center',
  },
  probNumber: { fontSize: 28, fontWeight: '800' },
  probLabel: { fontSize: 11, color: colors.text.muted },
  urgencyBanner: { borderRadius: theme.borderRadius.sm, padding: 10, alignItems: 'center' },
  urgencyBannerText: { fontSize: 14, fontWeight: '700' },
  detailSection: { fontSize: 13, fontWeight: '700', color: colors.text.secondary, marginTop: 4 },
  detailText: { fontSize: 14, color: colors.text.primary, lineHeight: 20 },
});
