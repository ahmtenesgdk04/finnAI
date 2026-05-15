import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput, Modal,
  StyleSheet, Alert, RefreshControl, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { theme } from '../../constants/theme';
import { formatCurrency, formatShortDate, formatMonth } from '../../utils/formatters';
import { personalAPI } from '../../services/api';
import { useApi, useApiMutation } from '../../hooks/useApi';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';

const CATEGORIES = ['Market', 'Kira', 'Fatura', 'Sağlık', 'Eğlence', 'Ulaşım', 'Giyim', 'Diğer'];

export default function ExpenseTrackerScreen() {
  const [showForm, setShowForm] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisText, setAnalysisText] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [suggesting, setSuggesting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const month = formatMonth();
  const { data: summary, loading, refetch } = useApi(
    useCallback(() => personalAPI.getSummary(month), [month])
  );
  const { mutate: addEntry, loading: adding } = useApiMutation(personalAPI.addEntry);

  const entries = (summary as any)?.entries || [];
  const total = (summary as any)?.total || 0;
  const budget = (summary as any)?.budget || 10000;

  const handleAdd = async () => {
    if (!amount || !category) {
      Alert.alert('Uyarı', 'Tutar ve kategori zorunludur');
      return;
    }
    try {
      await addEntry({
        amount: parseFloat(amount),
        category,
        date: new Date().toISOString().split('T')[0],
        note,
      });
      setAmount('');
      setCategory('');
      setNote('');
      setShowForm(false);
      refetch();
    } catch {
      Alert.alert('Hata', 'İşlem eklenemedi');
    }
  };

  const handleSuggestCategory = async () => {
    if (!note.trim()) {
      Alert.alert('Uyarı', 'Kategori önerisi için önce not girin');
      return;
    }
    setSuggesting(true);
    try {
      const res = await personalAPI.suggestCategory(note, parseFloat(amount) || 0);
      setCategory((res as any).data.category);
    } catch {
      Alert.alert('Hata', 'Kategori önerilemedi');
    } finally {
      setSuggesting(false);
    }
  };

  const handleAnalyzeExpenses = async () => {
    setAnalyzing(true);
    try {
      const res = await personalAPI.analyzeExpenses(month);
      setAnalysisText((res as any).data.insight || 'Analiz tamamlandı.');
      setShowAnalysis(true);
    } catch {
      Alert.alert('Hata', 'Analiz yapılamadı');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.summaryBar}>
        <View>
          <Text style={styles.summaryLabel}>Bu Ay</Text>
          <Text style={styles.summaryValue}>{formatCurrency(total)}</Text>
        </View>
        <View style={styles.divider} />
        <View>
          <Text style={styles.summaryLabel}>Kalan</Text>
          <Text style={[styles.summaryValue, { color: budget - total >= 0 ? colors.secondary : colors.danger }]}>
            {formatCurrency(budget - total)}
          </Text>
        </View>
        <View style={styles.barActions}>
          <TouchableOpacity style={styles.analyzeBtn} onPress={handleAnalyzeExpenses} disabled={analyzing}>
            {analyzing
              ? <ActivityIndicator size="small" color={colors.personal} />
              : <Ionicons name="sparkles-outline" size={20} color={colors.personal} />}
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(true)}>
            <Ionicons name="add" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={entries}
        keyExtractor={(item: any) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
        ListEmptyComponent={
          <EmptyState
            icon="receipt-outline"
            title="Henüz harcama yok"
            description="+ butonuna basarak harcama ekleyebilirsin"
          />
        }
        renderItem={({ item }: { item: any }) => (
          <View style={styles.entryCard}>
            <View style={styles.entryCat}>
              <Text style={styles.entryCatText}>{item.category?.charAt(0)}</Text>
            </View>
            <View style={styles.entryInfo}>
              <Text style={styles.entryCatName}>{item.category}</Text>
              {item.note ? <Text style={styles.entryNote}>{item.note}</Text> : null}
              <Text style={styles.entryDate}>{formatShortDate(item.date)}</Text>
            </View>
            <Text style={styles.entryAmt}>-{formatCurrency(item.amount)}</Text>
          </View>
        )}
      />

      {/* Harcama Ekle Modal */}
      <Modal visible={showForm} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Harcama Ekle</Text>
              <TouchableOpacity onPress={() => setShowForm(false)}>
                <Ionicons name="close" size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Tutar (₺)"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />

            {/* Not + AI öneri butonu */}
            <View style={styles.noteRow}>
              <TextInput
                style={[styles.input, styles.noteInput]}
                placeholder="Not (opsiyonel)"
                value={note}
                onChangeText={setNote}
              />
              <TouchableOpacity
                style={[styles.sparkleBtn, suggesting && { opacity: 0.6 }]}
                onPress={handleSuggestCategory}
                disabled={suggesting}
              >
                {suggesting
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Ionicons name="sparkles" size={18} color="#fff" />}
              </TouchableOpacity>
            </View>
            {category ? (
              <Text style={styles.suggestedLabel}>
                {suggesting ? 'Öneriyor...' : `Kategori: ${category}`}
              </Text>
            ) : (
              <Text style={styles.hintText}>✨ Notu yazıp ışıltı butonuna bas, Gemini kategori önersin</Text>
            )}

            <TouchableOpacity style={styles.catSelect} onPress={() => setShowCatModal(true)}>
              <Text style={[styles.catSelectText, !category && { color: colors.text.muted }]}>
                {category || 'Kategori Seç'}
              </Text>
              <Ionicons name="chevron-down" size={18} color={colors.text.secondary} />
            </TouchableOpacity>
            <Button title="Kaydet" onPress={handleAdd} loading={adding} />
          </View>
        </View>
      </Modal>

      {/* Kategori Seçim Modal */}
      <Modal visible={showCatModal} transparent animationType="fade">
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowCatModal(false)}>
          <View style={styles.catSheet}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={styles.catItem}
                onPress={() => { setCategory(cat); setShowCatModal(false); }}
              >
                <Text style={styles.catItemText}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Gemini Analiz Modal */}
      <Modal visible={showAnalysis} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.analysisSheet}>
            <View style={styles.sheetHeader}>
              <View style={styles.analysisTitle}>
                <Ionicons name="sparkles" size={18} color={colors.personal} />
                <Text style={styles.sheetTitle}>Harcama Analizi</Text>
              </View>
              <TouchableOpacity onPress={() => setShowAnalysis(false)}>
                <Ionicons name="close" size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.analysisText}>{analysisText}</Text>
            <Text style={styles.poweredBy}>Gemini ile analiz edildi</Text>
            <Button title="Kapat" onPress={() => setShowAnalysis(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
    ...theme.shadow.card,
  },
  summaryLabel: { fontSize: 12, color: colors.text.secondary },
  summaryValue: { fontSize: 20, fontWeight: '700', color: colors.text.primary },
  divider: { width: 1, height: 40, backgroundColor: colors.border },
  barActions: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 8 },
  analyzeBtn: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 1.5, borderColor: colors.personal,
    alignItems: 'center', justifyContent: 'center',
  },
  addBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.personal,
    alignItems: 'center', justifyContent: 'center',
  },
  list: { padding: theme.spacing.md, gap: theme.spacing.sm, paddingBottom: 32 },
  entryCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card,
    borderRadius: theme.borderRadius.md, padding: theme.spacing.md,
    gap: theme.spacing.sm, ...theme.shadow.card,
  },
  entryCat: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center',
  },
  entryCatText: { fontSize: 16, fontWeight: '700', color: colors.personal },
  entryInfo: { flex: 1 },
  entryCatName: { ...theme.typography.body, fontWeight: '600', color: colors.text.primary },
  entryNote: { ...theme.typography.caption, color: colors.text.secondary },
  entryDate: { ...theme.typography.caption, color: colors.text.muted },
  entryAmt: { fontSize: 15, fontWeight: '700', color: colors.danger },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: theme.spacing.lg, paddingBottom: 40, gap: theme.spacing.md,
  },
  analysisSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: theme.spacing.lg, paddingBottom: 40, gap: theme.spacing.md,
  },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  analysisTitle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sheetTitle: { ...theme.typography.h3, color: colors.text.primary },
  input: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: theme.borderRadius.md, padding: theme.spacing.md,
    fontSize: 15, color: colors.text.primary,
  },
  noteRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  noteInput: { flex: 1 },
  sparkleBtn: {
    width: 46, height: 46, borderRadius: theme.borderRadius.md,
    backgroundColor: colors.personal,
    alignItems: 'center', justifyContent: 'center',
  },
  suggestedLabel: { fontSize: 13, fontWeight: '600', color: colors.personal },
  hintText: { fontSize: 12, color: colors.text.muted },
  catSelect: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: theme.borderRadius.md, padding: theme.spacing.md,
  },
  catSelectText: { fontSize: 15, color: colors.text.primary },
  catSheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: theme.spacing.md, paddingBottom: 40,
  },
  catItem: {
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  catItemText: { ...theme.typography.body, color: colors.text.primary },
  analysisText: { ...theme.typography.body, color: colors.text.secondary, lineHeight: 24 },
  poweredBy: { fontSize: 11, color: colors.text.muted, textAlign: 'right', fontStyle: 'italic' },
});
