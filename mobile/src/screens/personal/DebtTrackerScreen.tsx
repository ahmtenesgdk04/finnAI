import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  Modal, StyleSheet, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../../constants/colors';
import { theme } from '../../constants/theme';
import { formatCurrency, formatShortDate, formatMonth } from '../../utils/formatters';
import { personalAPI } from '../../services/api';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';

interface Debt {
  id: string;
  person: string;
  amount: number;
  date: string;
  type: 'given' | 'received';
  paid: boolean;
  note?: string;
}

const STORAGE_KEY = 'debts';

export default function DebtTrackerScreen() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [tab, setTab] = useState<'given' | 'received'>('given');
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<'given' | 'received'>('given');
  const [person, setPerson] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  useFocusEffect(
    React.useCallback(() => {
      AsyncStorage.getItem(STORAGE_KEY).then((val) => {
        if (val) setDebts(JSON.parse(val));
      });
    }, [])
  );

  const save = async (list: Debt[]) => {
    setDebts(list);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  };

  const handleAdd = async () => {
    if (!person || !amount) {
      Alert.alert('Uyarı', 'Kişi adı ve tutar zorunludur');
      return;
    }
    const parsed = parseFloat(amount);
    if (parsed <= 0) {
      Alert.alert('Uyarı', 'Tutar 0 veya negatif olamaz');
      return;
    }
    const currentMonth = formatMonth();
    const today = new Date().toISOString().split('T')[0];

    if (formType === 'given') {
      try {
        const res = await personalAPI.getSummary(currentMonth);
        const summary = (res as any).data;
        const remaining = (summary.budget || 1000000) - (summary.total || 0);
        if (parsed > remaining) {
          Alert.alert('Yetersiz Bütçe', `Bu ay kalan bütçeniz ${remaining.toFixed(2)} ₺. Borç eklenemedi.`);
          return;
        }
      } catch {}
    }

    const d: Debt = {
      id: Date.now().toString(),
      person, amount: parsed, note,
      date: today,
      type: formType, paid: false,
    };
    await save([...debts, d]);

    try {
      await personalAPI.addEntry({
        amount: formType === 'given' ? parsed : -parsed,
        category: formType === 'given' ? 'Borç Verilen' : 'Borç Alınan',
        date: today,
        note: person + (note ? ` - ${note}` : ''),
      });
    } catch {}

    setPerson(''); setAmount(''); setNote('');
    setShowForm(false);
  };

  const togglePaid = async (id: string) => {
    await save(debts.map((d) => (d.id === id ? { ...d, paid: !d.paid } : d)));
  };

  const handleDelete = (id: string) => {
    Alert.alert('Sil', 'Bu borcu silmek istiyor musunuz?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => save(debts.filter((d) => d.id !== id)) },
    ]);
  };

  const filtered = debts.filter((d) => d.type === tab);
  const total = filtered.filter((d) => !d.paid).reduce((sum, d) => sum + d.amount, 0);

  return (
    <View style={styles.container}>
      {/* Sekme */}
      <View style={styles.tabs}>
        {(['given', 'received'] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'given' ? 'Verilen Borçlar' : 'Alınan Borçlar'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filtered.length > 0 && (
        <View style={styles.totalBar}>
          <Text style={styles.totalLabel}>Bekleyen Toplam</Text>
          <Text style={styles.totalVal}>{formatCurrency(total)}</Text>
        </View>
      )}

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title="Borç yok"
            description={tab === 'given' ? 'Verdiğiniz borçları takip edin' : 'Aldığınız borçları takip edin'}
            actionLabel="Ekle"
            onAction={() => { setFormType(tab); setShowForm(true); }}
          />
        }
        ListHeaderComponent={
          filtered.length > 0 ? (
            <TouchableOpacity style={styles.addRow} onPress={() => { setFormType(tab); setShowForm(true); }}>
              <Ionicons name="add-circle" size={22} color={colors.personal} />
              <Text style={styles.addRowText}>Borç Ekle</Text>
            </TouchableOpacity>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={[styles.debtCard, item.paid && styles.paidCard]}>
            <View style={styles.debtLeft}>
              <Text style={[styles.debtPerson, item.paid && styles.paidText]}>{item.person}</Text>
              <Text style={styles.debtDate}>{formatShortDate(item.date)}</Text>
              {item.note ? <Text style={styles.debtNote}>{item.note}</Text> : null}
            </View>
            <View style={styles.debtRight}>
              <Text style={[styles.debtAmount, item.paid && styles.paidText]}>
                {formatCurrency(item.amount)}
              </Text>
              <View style={styles.debtActions}>
                <TouchableOpacity onPress={() => togglePaid(item.id)}>
                  <Ionicons
                    name={item.paid ? 'checkmark-circle' : 'checkmark-circle-outline'}
                    size={22}
                    color={item.paid ? colors.secondary : colors.text.muted}
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item.id)}>
                  <Ionicons name="trash-outline" size={18} color={colors.text.muted} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />

      <Modal visible={showForm} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                {formType === 'given' ? 'Verilen Borç' : 'Alınan Borç'}
              </Text>
              <TouchableOpacity onPress={() => setShowForm(false)}>
                <Ionicons name="close" size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>
            <TextInput style={styles.input} placeholder="Kişi Adı" value={person} onChangeText={setPerson} />
            <TextInput style={styles.input} placeholder="Tutar (₺)" keyboardType="numeric" value={amount} onChangeText={setAmount} />
            <TextInput style={styles.input} placeholder="Not (opsiyonel)" value={note} onChangeText={setNote} />
            <Button title="Kaydet" onPress={handleAdd} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  tabs: { flexDirection: 'row', backgroundColor: colors.card, ...theme.shadow.card },
  tab: { flex: 1, paddingVertical: theme.spacing.md, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.personal },
  tabText: { ...theme.typography.body, color: colors.text.secondary },
  tabTextActive: { color: colors.personal, fontWeight: '600' },
  totalBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.primary, padding: theme.spacing.md,
  },
  totalLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  totalVal: { color: '#fff', fontSize: 20, fontWeight: '700' },
  list: { padding: theme.spacing.md, gap: theme.spacing.sm, paddingBottom: 32 },
  addRow: {
    flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  addRowText: { ...theme.typography.body, color: colors.personal, fontWeight: '600' },
  debtCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.card, borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md, ...theme.shadow.card,
  },
  paidCard: { opacity: 0.6 },
  debtLeft: { flex: 1 },
  debtPerson: { ...theme.typography.body, fontWeight: '600', color: colors.text.primary },
  debtDate: { ...theme.typography.caption, color: colors.text.secondary },
  debtNote: { ...theme.typography.caption, color: colors.text.muted },
  paidText: { textDecorationLine: 'line-through' },
  debtRight: { alignItems: 'flex-end', gap: theme.spacing.xs },
  debtAmount: { fontSize: 16, fontWeight: '700', color: colors.text.primary },
  debtActions: { flexDirection: 'row', gap: theme.spacing.sm },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: theme.spacing.lg, paddingBottom: 40, gap: theme.spacing.md,
  },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sheetTitle: { ...theme.typography.h3, color: colors.text.primary },
  input: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: theme.borderRadius.md, padding: theme.spacing.md,
    fontSize: 15, color: colors.text.primary,
  },
});
