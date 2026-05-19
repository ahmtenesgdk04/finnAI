import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Modal, TextInput, KeyboardAvoidingView, Platform, Alert,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../../constants/colors';
import { businessAPI } from '../../services/api';

type MonthYear = { year: number; month: number };
type Entry = { id: string; type: 'income' | 'expense'; amount: number; label: string; date: string; note?: string | null };
type RangeData = { totalIncome: number; totalExpense: number; entries: Entry[] };
type Filter = 'all' | 'income' | 'expense';

const MONTHS_TR = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const EXPENSE_CATS = ['Kira', 'Maaş', 'Hammadde', 'Fatura', 'Vergi', 'Diğer'];
const INCOME_SRCS  = ['Satış', 'Hizmet', 'Kira Geliri', 'Diğer'];

const nowMY = (): MonthYear => ({ year: new Date().getFullYear(), month: new Date().getMonth() });

const monthStart = ({ year, month }: MonthYear) =>
  `${year}-${String(month + 1).padStart(2, '0')}-01`;

const monthEnd = ({ year, month }: MonthYear) => {
  const last = new Date(year, month + 1, 0).getDate();
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(last).padStart(2, '0')}`;
};

const prevMY = ({ year, month }: MonthYear): MonthYear =>
  month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 };

const nextMY = ({ year, month }: MonthYear): MonthYear =>
  month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 };

function todayDMY(): string {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
}

function parseDMY(str: string): string | null {
  const parts = str.trim().split('.');
  if (parts.length !== 3) return null;
  const [dd, mm, yyyy] = parts;
  const day = parseInt(dd), mon = parseInt(mm), yr = parseInt(yyyy);
  if (isNaN(day) || isNaN(mon) || isNaN(yr)) return null;
  if (mon < 1 || mon > 12 || day < 1 || day > 31 || yr < 2000) return null;
  return `${yyyy}-${String(mon).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function fmtDate(dateStr: string, showYear = false): string {
  const d = (dateStr || '').split('T')[0];
  const parts = d.split('-');
  if (parts.length < 3) return d;
  const base = `${parseInt(parts[2])} ${MONTHS_TR[parseInt(parts[1]) - 1]}`;
  return showYear ? `${base} ${parts[0]}` : base;
}

function fmtMoney(n: number): string {
  return n.toLocaleString('tr-TR', { maximumFractionDigits: 0 }) + ' ₺';
}

export default function IncomesExpensesScreen({ navigation }: { navigation: any }) {
  const [curMonth, setCurMonth] = useState<MonthYear>(nowMY());
  const [data, setData]         = useState<RangeData>({ totalIncome: 0, totalExpense: 0, entries: [] });
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter]     = useState<Filter>('all');

  // Add modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [entryType, setEntryType] = useState<'income' | 'expense'>('income');
  const [amount, setAmount]       = useState('');
  const [label, setLabel]         = useState('');
  const [dateInput, setDateInput] = useState(todayDMY());
  const [note, setNote]           = useState('');
  const [saving, setSaving]       = useState(false);
  const [viewAll, setViewAll]     = useState(false);

  const fetchData = async (my: MonthYear) => {
    try {
      const res = await businessAPI.getSummaryByRange(monthStart(my), monthEnd(my));
      setData(res.data);
    } catch {
      Alert.alert('Hata', 'Veriler yüklenemedi.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => {
    setLoading(true);
    fetchData(curMonth);
  }, []));

  const goMonth = (my: MonthYear) => {
    setCurMonth(my);
    setLoading(true);
    fetchData(my);
  };

  const fetchAll = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await businessAPI.getSummaryByRange('2000-01-01', today);
      setData(res.data);
    } catch {
      Alert.alert('Hata', 'Veriler yüklenemedi.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const toggleViewAll = () => {
    setLoading(true);
    if (!viewAll) {
      setViewAll(true);
      fetchAll();
    } else {
      setViewAll(false);
      fetchData(curMonth);
    }
  };

  const onRefresh = () => { setRefreshing(true); viewAll ? fetchAll() : fetchData(curMonth); };

  const openAdd = () => {
    setEntryType('income');
    setAmount('');
    setLabel('');
    setDateInput(todayDMY());
    setNote('');
    setModalVisible(true);
  };

  const handleSave = async () => {
    const amt = parseFloat(amount.replace(',', '.'));
    if (!amt || amt <= 0) { Alert.alert('Hata', 'Geçerli bir tutar girin.'); return; }
    if (!label) { Alert.alert('Hata', entryType === 'income' ? 'Kaynak seçin.' : 'Kategori seçin.'); return; }
    const isoDate = parseDMY(dateInput);
    if (!isoDate) { Alert.alert('Hata', 'Tarih formatı: GG.AA.YYYY'); return; }

    setSaving(true);
    try {
      if (entryType === 'income') {
        await businessAPI.addIncome({ amount: amt, source: label, date: isoDate, description: note || undefined });
      } else {
        await businessAPI.addExpense({ amount: amt, category: label, date: isoDate, description: note || undefined });
      }
      setModalVisible(false);
      setLoading(true);
      fetchData(curMonth);
    } catch {
      Alert.alert('Hata', 'İşlem kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (item: Entry) => {
    Alert.alert('Kaydı Sil', `"${item.label}" kaydını silmek istiyor musunuz?`, [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil', style: 'destructive',
        onPress: async () => {
          try {
            await businessAPI.deleteEntry(item.type, item.id);
            setData(prev => ({
              ...prev,
              totalIncome:  item.type === 'income'  ? prev.totalIncome  - item.amount : prev.totalIncome,
              totalExpense: item.type === 'expense' ? prev.totalExpense - item.amount : prev.totalExpense,
              entries: prev.entries.filter(e => e.id !== item.id),
            }));
          } catch {
            Alert.alert('Hata', 'Kayıt silinemedi.');
          }
        },
      },
    ]);
  };

  const isNow = curMonth.year === nowMY().year && curMonth.month === nowMY().month;
  const net   = data.totalIncome - data.totalExpense;

  const filteredEntries = data.entries.filter(e =>
    filter === 'all' ? true : e.type === filter
  );
  const displayEntries = viewAll
    ? [...filteredEntries].sort((a, b) => b.date.localeCompare(a.date))
    : filteredEntries;

  // Comparison bar metrics
  const maxVal = Math.max(data.totalIncome, data.totalExpense, 1);
  const incomeRatio  = data.totalIncome  / maxVal;
  const expenseRatio = data.totalExpense / maxVal;

  const categories = entryType === 'income' ? INCOME_SRCS : EXPENSE_CATS;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Gelir / Gider</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color={colors.business} size="large" />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.business} />}
        >
          {/* Month navigation / view selector */}
          {!viewAll ? (
            <View style={styles.navSection}>
              <View style={styles.monthNav}>
                <TouchableOpacity style={styles.navBtn} onPress={() => goMonth(prevMY(curMonth))}>
                  <Ionicons name="chevron-back" size={20} color={colors.business} />
                </TouchableOpacity>
                <Text style={styles.monthLabel}>{MONTHS_TR[curMonth.month]} {curMonth.year}</Text>
                <TouchableOpacity
                  style={[styles.navBtn, isNow && styles.navBtnDisabled]}
                  onPress={() => !isNow && goMonth(nextMY(curMonth))}
                >
                  <Ionicons name="chevron-forward" size={20} color={isNow ? colors.border : colors.business} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.viewAllBtn} onPress={toggleViewAll}>
                <Ionicons name="time-outline" size={14} color={colors.business} />
                <Text style={styles.viewAllBtnText}>Tüm Kayıtlar</Text>
                <Ionicons name="chevron-forward" size={13} color={colors.business} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.viewAllHeader}>
              <View style={styles.viewAllBadge}>
                <Ionicons name="time-outline" size={16} color={colors.business} />
                <Text style={styles.viewAllHeaderText}>Tüm Kayıtlar</Text>
              </View>
              <TouchableOpacity style={styles.backToMonthBtn} onPress={toggleViewAll}>
                <Ionicons name="calendar-outline" size={14} color={colors.text.secondary} />
                <Text style={styles.backToMonthText}>Aylık Görünüm</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Summary cards */}
          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, { borderTopColor: colors.secondary }]}>
              <Ionicons name="arrow-up-circle-outline" size={20} color={colors.secondary} />
              <Text style={styles.summaryLabel}>Gelir</Text>
              <Text style={[styles.summaryAmount, { color: colors.secondary }]}>{fmtMoney(data.totalIncome)}</Text>
            </View>
            <View style={[styles.summaryCard, { borderTopColor: colors.danger }]}>
              <Ionicons name="arrow-down-circle-outline" size={20} color={colors.danger} />
              <Text style={styles.summaryLabel}>Gider</Text>
              <Text style={[styles.summaryAmount, { color: colors.danger }]}>{fmtMoney(data.totalExpense)}</Text>
            </View>
            <View style={[styles.summaryCard, { borderTopColor: net >= 0 ? colors.secondary : colors.danger }]}>
              <Ionicons name="wallet-outline" size={20} color={net >= 0 ? colors.secondary : colors.danger} />
              <Text style={styles.summaryLabel}>Net</Text>
              <Text style={[styles.summaryAmount, { color: net >= 0 ? colors.secondary : colors.danger }]}>
                {net >= 0 ? '+' : ''}{fmtMoney(net)}
              </Text>
            </View>
          </View>

          {/* Comparison chart */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Karşılaştırma</Text>

            <View style={styles.barRow}>
              <View style={styles.barLabel}>
                <View style={[styles.barDot, { backgroundColor: colors.secondary }]} />
                <Text style={styles.barLabelText}>Gelir</Text>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${incomeRatio * 100}%`, backgroundColor: colors.secondary }]} />
              </View>
              <Text style={styles.barValue}>{fmtMoney(data.totalIncome)}</Text>
            </View>

            <View style={[styles.barRow, { marginTop: 10 }]}>
              <View style={styles.barLabel}>
                <View style={[styles.barDot, { backgroundColor: colors.danger }]} />
                <Text style={styles.barLabelText}>Gider</Text>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${expenseRatio * 100}%`, backgroundColor: colors.danger }]} />
              </View>
              <Text style={styles.barValue}>{fmtMoney(data.totalExpense)}</Text>
            </View>

          </View>

          {/* Filter tabs */}
          <View style={styles.filterTabs}>
            {(['all', 'income', 'expense'] as Filter[]).map(f => (
              <TouchableOpacity
                key={f}
                style={[styles.filterTab, filter === f && styles.filterTabActive]}
                onPress={() => setFilter(f)}
              >
                <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>
                  {f === 'all' ? 'Tümü' : f === 'income' ? 'Gelir' : 'Gider'}
                </Text>
                {filter === f && (
                  <View style={styles.filterBadge}>
                    <Text style={styles.filterBadgeText}>{filteredEntries.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Transaction list */}
          <View style={styles.listCard}>
            {displayEntries.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons name="receipt-outline" size={40} color={colors.border} />
                <Text style={styles.emptyText}>İşlem yok</Text>
              </View>
            ) : (
              displayEntries.map((item, i) => {
                const isIncome = item.type === 'income';
                return (
                  <View key={item.id}>
                    <View style={styles.entryRow}>
                      <View style={[styles.entryIcon, { backgroundColor: isIncome ? colors.successLight : colors.errorLight }]}>
                        <Ionicons
                          name={isIncome ? 'arrow-up' : 'arrow-down'}
                          size={15}
                          color={isIncome ? colors.secondary : colors.danger}
                        />
                      </View>
                      <View style={styles.entryInfo}>
                        <Text style={styles.entryLabel} numberOfLines={1}>{item.label}</Text>
                        <Text style={styles.entryDate}>{fmtDate(item.date, viewAll)}</Text>
                        {item.note ? <Text style={styles.entryNote} numberOfLines={1}>{item.note}</Text> : null}
                      </View>
                      <Text style={[styles.entryAmount, { color: isIncome ? colors.secondary : colors.danger }]}>
                        {isIncome ? '+' : '-'}{fmtMoney(Number(item.amount))}
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleDelete(item)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        style={{ paddingLeft: 10 }}
                      >
                        <Ionicons name="trash-outline" size={16} color={colors.text.muted} />
                      </TouchableOpacity>
                    </View>
                    {i < displayEntries.length - 1 && <View style={styles.divider} />}
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      )}

      {/* Add Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Yeni İşlem</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Type toggle */}
              <View style={styles.typeToggle}>
                <TouchableOpacity
                  style={[styles.typeBtn, entryType === 'income' && styles.typeBtnIncome]}
                  onPress={() => { setEntryType('income'); setLabel(''); }}
                >
                  <Ionicons name="arrow-up-circle-outline" size={16} color={entryType === 'income' ? colors.secondary : colors.text.muted} />
                  <Text style={[styles.typeBtnText, entryType === 'income' && { color: colors.secondary, fontWeight: '700' }]}>Gelir</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeBtn, entryType === 'expense' && styles.typeBtnExpense]}
                  onPress={() => { setEntryType('expense'); setLabel(''); }}
                >
                  <Ionicons name="arrow-down-circle-outline" size={16} color={entryType === 'expense' ? colors.danger : colors.text.muted} />
                  <Text style={[styles.typeBtnText, entryType === 'expense' && { color: colors.danger, fontWeight: '700' }]}>Gider</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Tutar (₺) *</Text>
              <TextInput
                style={styles.input}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={colors.text.muted}
                value={amount}
                onChangeText={setAmount}
              />

              <Text style={styles.inputLabel}>{entryType === 'income' ? 'Kaynak' : 'Kategori'} *</Text>
              <View style={styles.chipRow}>
                {categories.map(c => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.chip, label === c && styles.chipActive]}
                    onPress={() => setLabel(c)}
                  >
                    <Text style={[styles.chipText, label === c && styles.chipTextActive]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Tarih * (GG.AA.YYYY)</Text>
              <TextInput
                style={styles.input}
                placeholder="01.01.2025"
                placeholderTextColor={colors.text.muted}
                value={dateInput}
                onChangeText={setDateInput}
                keyboardType="numbers-and-punctuation"
              />

              <Text style={styles.inputLabel}>Açıklama (isteğe bağlı)</Text>
              <TextInput
                style={styles.input}
                placeholder="Not ekle..."
                placeholderTextColor={colors.text.muted}
                value={note}
                onChangeText={setNote}
              />

              <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Kaydet</Text>}
              </TouchableOpacity>
              <View style={{ height: 32 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  title: { fontSize: 17, fontWeight: '700', color: colors.text.primary },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.business, alignItems: 'center', justifyContent: 'center' },

  content: { padding: 16, gap: 12, paddingBottom: 40 },

  navSection: { gap: 6 },
  monthNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.card, borderRadius: 14, paddingHorizontal: 8, paddingVertical: 6,
    borderWidth: 1, borderColor: colors.border,
  },
  navBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  navBtnDisabled: { backgroundColor: colors.background },
  monthLabel: { fontSize: 16, fontWeight: '700', color: colors.text.primary },
  viewAllBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 5,
    paddingVertical: 6, paddingHorizontal: 4,
  },
  viewAllBtnText: { fontSize: 12, fontWeight: '600', color: colors.business },
  viewAllHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.primaryLight, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: colors.business,
  },
  viewAllBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  viewAllHeaderText: { fontSize: 15, fontWeight: '700', color: colors.business },
  backToMonthBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: colors.card, borderRadius: 10 },
  backToMonthText: { fontSize: 12, fontWeight: '600', color: colors.text.secondary },

  summaryRow: { flexDirection: 'row', gap: 8 },
  summaryCard: {
    flex: 1, backgroundColor: colors.card, borderRadius: 14, padding: 12,
    alignItems: 'center', gap: 4, borderTopWidth: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  summaryLabel:  { fontSize: 10, color: colors.text.muted, fontWeight: '600', textTransform: 'uppercase' },
  summaryAmount: { fontSize: 13, fontWeight: '700' },

  card: {
    backgroundColor: colors.card, borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: colors.text.primary, marginBottom: 14 },

  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barLabel: { flexDirection: 'row', alignItems: 'center', gap: 5, width: 48 },
  barDot: { width: 8, height: 8, borderRadius: 4 },
  barLabelText: { fontSize: 12, fontWeight: '600', color: colors.text.secondary },
  barTrack: { flex: 1, height: 10, backgroundColor: colors.border, borderRadius: 5, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 5 },
  barValue: { fontSize: 12, fontWeight: '700', color: colors.text.primary, width: 80, textAlign: 'right' },
  filterTabs: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: 14, padding: 4, gap: 4, borderWidth: 1, borderColor: colors.border },
  filterTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, gap: 6 },
  filterTabActive: { backgroundColor: colors.primaryLight },
  filterTabText: { fontSize: 13, fontWeight: '600', color: colors.text.muted },
  filterTabTextActive: { color: colors.business },
  filterBadge: { backgroundColor: colors.business, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
  filterBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },

  listCard: {
    backgroundColor: colors.card, borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  entryRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  entryIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  entryInfo: { flex: 1 },
  entryLabel: { fontSize: 14, fontWeight: '600', color: colors.text.primary },
  entryDate: { fontSize: 11, color: colors.text.muted, marginTop: 1 },
  entryNote: { fontSize: 11, color: colors.text.secondary, marginTop: 1 },
  entryAmount: { fontSize: 13, fontWeight: '700' },
  divider: { height: 1, backgroundColor: colors.border, marginHorizontal: 14 },

  empty: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyText: { fontSize: 14, color: colors.text.muted },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  modalSheet: {
    backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 12, maxHeight: '90%',
  },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 12 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text.primary },

  typeToggle: { flexDirection: 'row', backgroundColor: colors.background, borderRadius: 12, padding: 4, gap: 4, marginBottom: 4 },
  typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, gap: 6 },
  typeBtnIncome: { backgroundColor: colors.successLight },
  typeBtnExpense: { backgroundColor: colors.errorLight },
  typeBtnText: { fontSize: 14, fontWeight: '600', color: colors.text.secondary },

  inputLabel: { fontSize: 12, fontWeight: '600', color: colors.text.secondary, marginTop: 12, marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
    color: colors.text.primary, backgroundColor: colors.background,
  },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
  chipActive: { borderColor: colors.business, backgroundColor: colors.primaryLight },
  chipText: { fontSize: 13, color: colors.text.secondary, fontWeight: '500' },
  chipTextActive: { color: colors.business, fontWeight: '700' },

  saveBtn: { backgroundColor: colors.business, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 16 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
