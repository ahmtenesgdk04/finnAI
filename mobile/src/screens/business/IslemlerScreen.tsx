import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Modal, TextInput, Alert, ActivityIndicator, RefreshControl,
  KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../../constants/colors';
import { businessAPI } from '../../services/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS_TR = [
  'Ocak','Şubat','Mart','Nisan','Mayıs','Haziran',
  'Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık',
];

type MonthYear = { year: number; month: number }; // month: 0-based

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

const todayISO = () => new Date().toISOString().split('T')[0];

// ─── Types ────────────────────────────────────────────────────────────────────

type Entry = {
  type: 'income' | 'expense';
  id: string;
  amount: number;
  label: string;
  date: string;
  note?: string | null;
};

type RangeData = { totalIncome: number; totalExpense: number; entries: Entry[] };

// ─── Constants ────────────────────────────────────────────────────────────────

const EXPENSE_CATEGORIES = ['Kira', 'Maaş', 'Hammadde', 'Fatura', 'Vergi', 'Diğer'];
const INCOME_SOURCES     = ['Satış', 'Hizmet', 'Kira Geliri', 'Diğer'];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function IslemlerScreen() {
  const [curMonth, setCurMonth] = useState<MonthYear>(nowMY());

  const [data,       setData]       = useState<RangeData>({ totalIncome: 0, totalExpense: 0, entries: [] });
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // New entry modal
  const [modalVisible, setModalVisible] = useState(false);
  const [entryType,    setEntryType]    = useState<'income' | 'expense'>('income');
  const [amount,       setAmount]       = useState('');
  const [label,        setLabel]        = useState('');
  const [note,         setNote]         = useState('');
  const [photo,        setPhoto]        = useState<string | null>(null);
  const [saving,       setSaving]       = useState(false);

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

  const onRefresh = () => { setRefreshing(true); fetchData(curMonth); };

  const openNewEntry = () => {
    setEntryType('income'); setAmount(''); setLabel(''); setNote(''); setPhoto(null);
    setModalVisible(true);
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('İzin Gerekli', 'Galeriye erişim izni veriniz.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.7 });
    if (!result.canceled) setPhoto(result.assets[0].uri);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('İzin Gerekli', 'Kamera erişim izni veriniz.'); return; }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.7 });
    if (!result.canceled) setPhoto(result.assets[0].uri);
  };

  const handleSave = async () => {
    const amt = parseFloat(amount.replace(',', '.'));
    if (!amt || amt <= 0) { Alert.alert('Hata', 'Geçerli bir tutar giriniz.'); return; }
    if (!label) { Alert.alert('Hata', entryType === 'income' ? 'Kaynak seçiniz.' : 'Kategori seçiniz.'); return; }
    setSaving(true);
    try {
      if (entryType === 'income') {
        await businessAPI.addIncome({ amount: amt, source: label, date: todayISO(), description: note || undefined });
      } else {
        await businessAPI.addExpense({ amount: amt, category: label, date: todayISO(), description: note || undefined });
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

  const now       = nowMY();
  const isNow     = curMonth.year === now.year && curMonth.month === now.month;
  const net       = data.totalIncome - data.totalExpense;
  const categories = entryType === 'income' ? INCOME_SOURCES : EXPENSE_CATEGORIES;

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIcon}>
            <Ionicons name="business-outline" size={20} color={colors.business} />
          </View>
          <View>
            <Text style={styles.headerTitle}>İşletme Hesabı</Text>
            <Text style={styles.headerSub}>Gelir & Gider Takibi</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openNewEntry}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color={colors.business} size="large" />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.business} />}
        >
          {/* ── Ay navigasyonu ── */}
          <View style={styles.monthNav}>
            <TouchableOpacity style={styles.navBtn} onPress={() => goMonth(prevMY(curMonth))}>
              <Ionicons name="chevron-back" size={20} color={colors.business} />
            </TouchableOpacity>
            <Text style={styles.monthLabel}>
              {MONTHS_TR[curMonth.month]} {curMonth.year}
            </Text>
            <TouchableOpacity
              style={[styles.navBtn, isNow && styles.navBtnDisabled]}
              onPress={() => !isNow && goMonth(nextMY(curMonth))}
            >
              <Ionicons name="chevron-forward" size={20} color={isNow ? colors.border : colors.business} />
            </TouchableOpacity>
          </View>

          {/* ── Özet kartlar ── */}
          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, { borderTopColor: '#10B981' }]}>
              <Ionicons name="arrow-up-circle-outline" size={18} color="#10B981" style={{ marginBottom: 6 }} />
              <Text style={styles.summaryLabel}>Toplam Gelir</Text>
              <Text style={[styles.summaryAmount, { color: '#10B981' }]}>
                {data.totalIncome.toLocaleString('tr-TR')} ₺
              </Text>
            </View>
            <View style={[styles.summaryCard, { borderTopColor: colors.danger }]}>
              <Ionicons name="arrow-down-circle-outline" size={18} color={colors.danger} style={{ marginBottom: 6 }} />
              <Text style={styles.summaryLabel}>Toplam Gider</Text>
              <Text style={[styles.summaryAmount, { color: colors.danger }]}>
                {data.totalExpense.toLocaleString('tr-TR')} ₺
              </Text>
            </View>
          </View>

          {/* ── Net bakiye ── */}
          <View style={[styles.netCard, { borderLeftColor: net >= 0 ? '#10B981' : colors.danger }]}>
            <View>
              <Text style={styles.netLabel}>Net Bakiye</Text>
              <Text style={styles.netPeriod}>{MONTHS_TR[curMonth.month]} {curMonth.year}</Text>
            </View>
            <Text style={[styles.netAmount, { color: net >= 0 ? '#10B981' : colors.danger }]}>
              {net >= 0 ? '+' : ''}{net.toLocaleString('tr-TR')} ₺
            </Text>
          </View>

          {/* ── İşlemler listesi ── */}
          <Text style={styles.sectionLabel}>İşlemler</Text>
          <View style={styles.entriesCard}>
            {data.entries.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons name="receipt-outline" size={44} color={colors.border} />
                <Text style={styles.emptyText}>Bu ay işlem yok</Text>
                <Text style={styles.emptySub}>+ ile yeni gelir veya gider ekleyebilirsiniz</Text>
              </View>
            ) : (
              data.entries.map((item, i) => {
                const isIncome = item.type === 'income';
                const dateStr  = new Date(item.date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
                return (
                  <View key={item.id}>
                    <View style={styles.entryRow}>
                      <View style={[styles.entryIcon, { backgroundColor: isIncome ? '#ECFDF5' : '#FEF2F2' }]}>
                        <Ionicons name={isIncome ? 'arrow-up' : 'arrow-down'} size={16} color={isIncome ? '#10B981' : colors.danger} />
                      </View>
                      <View style={styles.entryInfo}>
                        <Text style={styles.entryLabel}>{item.label}</Text>
                        {item.note ? <Text style={styles.entryNote} numberOfLines={1}>{item.note}</Text> : null}
                      </View>
                      <View style={styles.entryRight}>
                        <Text style={[styles.entryAmount, { color: isIncome ? '#10B981' : colors.danger }]}>
                          {isIncome ? '+' : '-'}{Number(item.amount).toLocaleString('tr-TR')} ₺
                        </Text>
                        <Text style={styles.entryDate}>{dateStr}</Text>
                      </View>
                    </View>
                    {i < data.entries.length - 1 && <View style={styles.divider} />}
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      )}

      {/* ══ Yeni İşlem Modal ══ */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setModalVisible(false)} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView style={styles.entrySheet} bounces={false} keyboardShouldPersistTaps="handled">
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Yeni İşlem</Text>

            <View style={styles.typeToggle}>
              <TouchableOpacity
                style={[styles.typeBtn, entryType === 'income' && styles.typeBtnActiveIncome]}
                onPress={() => { setEntryType('income'); setLabel(''); }}
              >
                <Ionicons name="arrow-up-circle-outline" size={16} color={entryType === 'income' ? '#10B981' : colors.text.muted} />
                <Text style={[styles.typeBtnText, entryType === 'income' && { color: '#10B981', fontWeight: '700' }]}>Gelir</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeBtn, entryType === 'expense' && styles.typeBtnActiveExpense]}
                onPress={() => { setEntryType('expense'); setLabel(''); }}
              >
                <Ionicons name="arrow-down-circle-outline" size={16} color={entryType === 'expense' ? colors.danger : colors.text.muted} />
                <Text style={[styles.typeBtnText, entryType === 'expense' && { color: colors.danger, fontWeight: '700' }]}>Gider</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Tutar (₺)</Text>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              placeholder="0.00"
              value={amount}
              onChangeText={setAmount}
              placeholderTextColor={colors.text.muted}
            />

            <Text style={styles.inputLabel}>{entryType === 'income' ? 'Kaynak' : 'Kategori'}</Text>
            <View style={styles.chipRow}>
              {categories.map(c => (
                <TouchableOpacity key={c} style={[styles.chip, label === c && styles.chipActive]} onPress={() => setLabel(c)}>
                  <Text style={[styles.chipText, label === c && styles.chipTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Açıklama (isteğe bağlı)</Text>
            <TextInput
              style={styles.input}
              placeholder="Not ekle..."
              value={note}
              onChangeText={setNote}
              placeholderTextColor={colors.text.muted}
            />

            <Text style={styles.inputLabel}>Fotoğraf (isteğe bağlı)</Text>
            {photo ? (
              <View style={styles.photoPreview}>
                <Image source={{ uri: photo }} style={styles.photoThumb} />
                <TouchableOpacity style={styles.photoRemove} onPress={() => setPhoto(null)}>
                  <Ionicons name="close-circle" size={22} color={colors.danger} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.photoRow}>
                <TouchableOpacity style={styles.photoBtn} onPress={takePhoto}>
                  <Ionicons name="camera-outline" size={20} color={colors.business} />
                  <Text style={styles.photoBtnText}>Kameradan</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.photoBtn} onPress={pickFromGallery}>
                  <Ionicons name="image-outline" size={20} color={colors.business} />
                  <Text style={styles.photoBtnText}>Galeriden</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.7 }]} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Kaydet</Text>}
            </TouchableOpacity>
            <View style={{ height: 24 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIcon:  { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: colors.text.primary },
  headerSub:   { fontSize: 12, color: colors.text.secondary, marginTop: 1 },
  addBtn:      { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.business, alignItems: 'center', justifyContent: 'center' },

  content: { padding: 16, gap: 12, paddingBottom: 40 },

  monthNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.card, borderRadius: 14, paddingHorizontal: 8, paddingVertical: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  navBtn:         { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  navBtnDisabled: { backgroundColor: colors.background },
  monthLabel:     { fontSize: 16, fontWeight: '700', color: colors.text.primary },

  summaryRow: { flexDirection: 'row', gap: 10 },
  summaryCard: {
    flex: 1, backgroundColor: colors.card, borderRadius: 14, padding: 14, borderTopWidth: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
  },
  summaryLabel:  { fontSize: 11, color: colors.text.secondary, fontWeight: '500' },
  summaryAmount: { fontSize: 15, fontWeight: '700', marginTop: 2 },

  netCard: {
    backgroundColor: colors.card, borderRadius: 14, padding: 16, borderLeftWidth: 4,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
  },
  netLabel:  { fontSize: 14, fontWeight: '600', color: colors.text.primary },
  netPeriod: { fontSize: 11, color: colors.text.secondary, marginTop: 2 },
  netAmount: { fontSize: 20, fontWeight: '800' },

  sectionLabel: { fontSize: 13, fontWeight: '600', color: colors.text.muted, paddingHorizontal: 4 },

  entriesCard: {
    backgroundColor: colors.card, borderRadius: 14, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  entryRow:    { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  entryIcon:   { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  entryInfo:   { flex: 1 },
  entryLabel:  { fontSize: 14, fontWeight: '600', color: colors.text.primary },
  entryNote:   { fontSize: 12, color: colors.text.secondary, marginTop: 2 },
  entryRight:  { alignItems: 'flex-end' },
  entryAmount: { fontSize: 14, fontWeight: '700' },
  entryDate:   { fontSize: 11, color: colors.text.muted, marginTop: 2 },
  divider:     { height: 1, backgroundColor: colors.border, marginHorizontal: 14 },

  empty:     { alignItems: 'center', padding: 36, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: '700', color: colors.text.primary },
  emptySub:  { fontSize: 13, color: colors.text.secondary, textAlign: 'center' },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 12 },
  sheetTitle:  { fontSize: 17, fontWeight: '700', color: colors.text.primary, marginBottom: 16 },

  entrySheet: {
    backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 12, maxHeight: '92%',
  },

  typeToggle:           { flexDirection: 'row', backgroundColor: colors.background, borderRadius: 12, padding: 4, gap: 4, marginBottom: 4 },
  typeBtn:              { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, gap: 6 },
  typeBtnActiveIncome:  { backgroundColor: '#ECFDF5' },
  typeBtnActiveExpense: { backgroundColor: '#FEF2F2' },
  typeBtnText:          { fontSize: 14, fontWeight: '600', color: colors.text.secondary },

  inputLabel: { fontSize: 12, fontWeight: '600', color: colors.text.secondary, marginTop: 10, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 10,
    padding: 12, fontSize: 15, color: colors.text.primary, backgroundColor: colors.background,
  },

  chipRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:           { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
  chipActive:     { borderColor: colors.business, backgroundColor: colors.primaryLight },
  chipText:       { fontSize: 13, color: colors.text.secondary, fontWeight: '500' },
  chipTextActive: { color: colors.business, fontWeight: '700' },

  photoRow:     { flexDirection: 'row', gap: 10 },
  photoBtn:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.primaryLight },
  photoBtnText: { fontSize: 13, fontWeight: '600', color: colors.business },
  photoPreview: { position: 'relative', alignSelf: 'flex-start' },
  photoThumb:   { width: 90, height: 90, borderRadius: 10 },
  photoRemove:  { position: 'absolute', top: -8, right: -8 },

  saveBtn:     { backgroundColor: colors.business, borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 12 },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
