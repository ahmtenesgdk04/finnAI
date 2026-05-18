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
import { personalAPI } from '../../services/api';

interface Installment {
  id: string;
  name: string;
  monthlyAmount: number;
  remainingCount: number;
  totalCount: number;
  paymentDay: number;
  lastBilled?: string; // 'YYYY-MM'
}

const STORAGE_KEY = 'installments';

export default function InstallmentsScreen() {
  const [items, setItems] = useState<Installment[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showSim, setShowSim] = useState(false);
  const [simAmount, setSimAmount] = useState('');
  const [simCount, setSimCount] = useState('');
  const [name, setName] = useState('');
  const [totalCost, setTotalCost] = useState('');
  const [installmentCount, setInstallmentCount] = useState('');
  const [paymentDay, setPaymentDay] = useState('');

  useFocusEffect(
    React.useCallback(() => {
      AsyncStorage.getItem(STORAGE_KEY).then(async (val) => {
        if (!val) return;
        const loaded: Installment[] = JSON.parse(val);

        const today = new Date();
        const todayDay = today.getDate();
        const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        const todayStr = today.toISOString().split('T')[0];

        let remainingBudget = Infinity;
        try {
          const res = await personalAPI.getSummary(currentMonth);
          const summary = (res as any).data;
          remainingBudget = (summary.budget || 1000000) - (summary.total || 0);
        } catch {}

        const billedNames: string[] = [];
        const completedNames: string[] = [];
        const skippedNames: string[] = [];

        const updated: Installment[] = [];
        for (const item of loaded) {
          if (item.paymentDay > 0 && todayDay >= item.paymentDay && item.lastBilled !== currentMonth) {
            if (item.monthlyAmount > remainingBudget) {
              skippedNames.push(item.name);
              updated.push(item);
              continue;
            }
            try {
              await personalAPI.addEntry({
                amount: item.monthlyAmount,
                category: 'Taksit',
                date: todayStr,
                note: item.name,
              });
              remainingBudget -= item.monthlyAmount;
              const newRemaining = item.remainingCount - 1;
              if (newRemaining <= 0) {
                completedNames.push(item.name);
              } else {
                updated.push({ ...item, remainingCount: newRemaining, lastBilled: currentMonth });
                billedNames.push(item.name);
              }
            } catch {
              updated.push(item);
            }
          } else {
            updated.push(item);
          }
        }

        if (billedNames.length > 0 || completedNames.length > 0 || skippedNames.length > 0) {
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          setItems(updated);
          if (completedNames.length > 0) {
            Alert.alert(
              '🎉 Taksit Tamamlandı!',
              `${completedNames.join(', ')} tamamen ödendi ve listeden kaldırıldı.`
            );
          }
          if (billedNames.length > 0) {
            Alert.alert(
              'Taksit Ödemesi Eklendi',
              `${billedNames.join(', ')} bu aya ait ödeme bütçene eklendi.`
            );
          }
          if (skippedNames.length > 0) {
            Alert.alert(
              'Yetersiz Bütçe',
              `${skippedNames.join(', ')} için bütçeniz yeterli olmadığından ödeme yapılamadı.`
            );
          }
        } else {
          setItems(loaded);
        }
      });
    }, [])
  );

  const save = async (list: Installment[]) => {
    setItems(list);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  };

  const handleAdd = async () => {
    if (!name || !totalCost || !installmentCount || !paymentDay) {
      Alert.alert('Uyarı', 'Tüm alanları doldurun');
      return;
    }
    const cost = parseFloat(totalCost);
    if (cost <= 0) {
      Alert.alert('Uyarı', 'Tutar 0 veya negatif olamaz');
      return;
    }
    const count = parseInt(installmentCount);
    const monthly = Math.ceil(cost / count);
    const item: Installment = {
      id: Date.now().toString(),
      name,
      monthlyAmount: monthly,
      totalCount: count,
      remainingCount: count,
      paymentDay: parseInt(paymentDay),
    };
    await save([...items, item]);
    setName(''); setTotalCost(''); setInstallmentCount(''); setPaymentDay('');
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
            <Text style={styles.cardPayDay}>Her ay {item.paymentDay}. günü · Kalan toplam: {formatCurrency(item.monthlyAmount * item.remainingCount)}</Text>
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
            <TextInput style={styles.input} placeholder="Taksit Adı (örn: Telefon, Laptop)" value={name} onChangeText={setName} />
            <TextInput style={styles.input} placeholder="Toplam Maliyet (₺)" keyboardType="numeric" value={totalCost} onChangeText={setTotalCost} />
            <TextInput style={styles.input} placeholder="Taksit Sayısı" keyboardType="numeric" value={installmentCount} onChangeText={setInstallmentCount} />
            <TextInput style={styles.input} placeholder="Ödeme Günü (1-31)" keyboardType="numeric" value={paymentDay} onChangeText={setPaymentDay} />
            {totalCost && installmentCount && parseInt(installmentCount) > 0 && (
              <View style={styles.preview}>
                <Text style={styles.previewLabel}>Aylık ödeme</Text>
                <Text style={styles.previewAmount}>
                  {formatCurrency(Math.ceil(parseFloat(totalCost) / parseInt(installmentCount)))}
                </Text>
              </View>
            )}
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
  cardPayDay: { fontSize: 11, color: colors.text.muted },
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
  preview: {
    backgroundColor: '#EDE9FE', borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center',
  },
  previewLabel: { fontSize: 14, color: colors.personal },
  previewAmount: { fontSize: 20, fontWeight: '700', color: colors.personal },
  simInfo: { ...theme.typography.body, color: colors.text.secondary },
  simResult: { backgroundColor: '#EDE9FE', borderRadius: theme.borderRadius.md, padding: theme.spacing.md, alignItems: 'center' },
  simResultText: { fontSize: 14, color: colors.text.secondary },
  simTotal: { fontSize: 24, fontWeight: '700', color: colors.personal },
});
