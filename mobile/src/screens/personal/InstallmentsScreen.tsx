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
import { formatCurrency } from '../../utils/formatters';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';

interface Installment {
  id: string;
  name: string;
  monthlyAmount: number;
  remainingCount: number;
  totalCount: number;
}

const STORAGE_KEY = 'installments';

export default function InstallmentsScreen() {
  const [items, setItems] = useState<Installment[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showSim, setShowSim] = useState(false);
  const [simAmount, setSimAmount] = useState('');
  const [simCount, setSimCount] = useState('');
  const [name, setName] = useState('');
  const [monthly, setMonthly] = useState('');
  const [remaining, setRemaining] = useState('');
  const [total, setTotal] = useState('');

  useFocusEffect(
    React.useCallback(() => {
      AsyncStorage.getItem(STORAGE_KEY).then((val) => {
        if (val) setItems(JSON.parse(val));
      });
    }, [])
  );

  const save = async (list: Installment[]) => {
    setItems(list);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  };

  const handleAdd = async () => {
    if (!name || !monthly || !remaining || !total) {
      Alert.alert('Uyarı', 'Tüm alanları doldurun');
      return;
    }
    const item: Installment = {
      id: Date.now().toString(),
      name, monthlyAmount: parseFloat(monthly),
      remainingCount: parseInt(remaining), totalCount: parseInt(total),
    };
    await save([...items, item]);
    setName(''); setMonthly(''); setRemaining(''); setTotal('');
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Sil', 'Bu taksiti silmek istiyor musunuz?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => save(items.filter((i) => i.id !== id)) },
    ]);
  };

  const totalMonthly = items.reduce((sum, i) => sum + i.monthlyAmount, 0);
  const simMonthly = parseFloat(simAmount) || 0;

  return (
    <View style={styles.container}>
      {items.length > 0 && (
        <View style={styles.totalBar}>
          <View>
            <Text style={styles.totalLabel}>Aylık Taksit Yükü</Text>
            <Text style={styles.totalVal}>{formatCurrency(totalMonthly)}</Text>
          </View>
          <TouchableOpacity style={styles.simBtn} onPress={() => setShowSim(true)}>
            <Ionicons name="calculator-outline" size={18} color={colors.primary} />
            <Text style={styles.simBtnText}>Simülatör</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            icon="card-outline"
            title="Taksit yok"
            description="Kredi kartı ve kredi taksitlerini ekleyin"
            actionLabel="Ekle"
            onAction={() => setShowForm(true)}
          />
        }
        ListHeaderComponent={
          items.length > 0 ? (
            <TouchableOpacity style={styles.addRow} onPress={() => setShowForm(true)}>
              <Ionicons name="add-circle" size={22} color={colors.personal} />
              <Text style={styles.addRowText}>Taksit Ekle</Text>
            </TouchableOpacity>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardName}>{item.name}</Text>
              <TouchableOpacity onPress={() => handleDelete(item.id)}>
                <Ionicons name="trash-outline" size={18} color={colors.text.muted} />
              </TouchableOpacity>
            </View>
            <Text style={styles.cardMonthly}>{formatCurrency(item.monthlyAmount)}/ay</Text>
            <View style={styles.bar}>
              <View
                style={[styles.barFill, {
                  width: `${((item.totalCount - item.remainingCount) / item.totalCount) * 100}%`,
                }]}
              />
            </View>
            <Text style={styles.cardRemaining}>
              {item.totalCount - item.remainingCount} ödendi · {item.remainingCount} kaldı (toplam {item.totalCount})
            </Text>
          </View>
        )}
      />

      {/* Ekle Modal */}
      <Modal visible={showForm} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Taksit Ekle</Text>
              <TouchableOpacity onPress={() => setShowForm(false)}>
                <Ionicons name="close" size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>
            <TextInput style={styles.input} placeholder="Taksit Adı" value={name} onChangeText={setName} />
            <TextInput style={styles.input} placeholder="Aylık Tutar (₺)" keyboardType="numeric" value={monthly} onChangeText={setMonthly} />
            <TextInput style={styles.input} placeholder="Kalan Taksit Sayısı" keyboardType="numeric" value={remaining} onChangeText={setRemaining} />
            <TextInput style={styles.input} placeholder="Toplam Taksit Sayısı" keyboardType="numeric" value={total} onChangeText={setTotal} />
            <Button title="Kaydet" onPress={handleAdd} />
          </View>
        </View>
      </Modal>

      {/* Simülatör Modal */}
      <Modal visible={showSim} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Taksit Simülatörü</Text>
              <TouchableOpacity onPress={() => setShowSim(false)}>
                <Ionicons name="close" size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.simInfo}>Mevcut aylık yük: {formatCurrency(totalMonthly)}</Text>
            <TextInput style={styles.input} placeholder="Yeni taksit aylık tutarı (₺)" keyboardType="numeric" value={simAmount} onChangeText={setSimAmount} />
            {simMonthly > 0 && (
              <View style={styles.simResult}>
                <Text style={styles.simResultText}>
                  Bu taksitiyle aylık yükünüz:
                </Text>
                <Text style={styles.simTotal}>{formatCurrency(totalMonthly + simMonthly)}</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  totalBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.primary, padding: theme.spacing.md,
  },
  totalLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  totalVal: { color: '#fff', fontSize: 20, fontWeight: '700' },
  simBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#fff', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6,
  },
  simBtnText: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  list: { padding: theme.spacing.md, gap: theme.spacing.sm, paddingBottom: 32 },
  addRow: {
    flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  addRowText: { ...theme.typography.body, color: colors.personal, fontWeight: '600' },
  card: {
    backgroundColor: colors.card, borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md, gap: theme.spacing.sm, ...theme.shadow.card,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardName: { ...theme.typography.body, fontWeight: '600', color: colors.text.primary },
  cardMonthly: { fontSize: 20, fontWeight: '700', color: colors.primary },
  bar: { height: 8, backgroundColor: '#E2E8F0', borderRadius: 99, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 99, backgroundColor: colors.personal },
  cardRemaining: { ...theme.typography.caption, color: colors.text.secondary },
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
  simInfo: { ...theme.typography.body, color: colors.text.secondary },
  simResult: { backgroundColor: '#EDE9FE', borderRadius: theme.borderRadius.md, padding: theme.spacing.md, alignItems: 'center' },
  simResultText: { fontSize: 14, color: colors.text.secondary },
  simTotal: { fontSize: 24, fontWeight: '700', color: colors.personal },
});
