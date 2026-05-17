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

const formatRenewalDay = (renewalDate: string): string => {
  if (!renewalDate) return '-';
  if (renewalDate.includes('-')) {
    const day = new Date(renewalDate).getDate();
    return `Her ay ${day}. günü`;
  }
  const day = parseInt(renewalDate, 10);
  return isNaN(day) ? '-' : `Her ay ${day}. günü`;
};
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';

interface Subscription {
  id: string;
  name: string;
  amount: number;
  renewalDate: string;
  lastUsed?: string;
}

const STORAGE_KEY = 'subscriptions';

export default function SubscriptionsScreen() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [renewalDate, setRenewalDate] = useState('');

  useFocusEffect(
    React.useCallback(() => {
      AsyncStorage.getItem(STORAGE_KEY).then((val) => {
        if (val) setSubs(JSON.parse(val));
      });
    }, [])
  );

  const save = async (list: Subscription[]) => {
    setSubs(list);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  };

  const handleAdd = async () => {
    if (!name || !amount || !renewalDate) {
      Alert.alert('Uyarı', 'Tüm alanları doldurun');
      return;
    }
    const newSub: Subscription = {
      id: Date.now().toString(),
      name, amount: parseFloat(amount), renewalDate,
      lastUsed: new Date().toISOString().split('T')[0],
    };
    await save([...subs, newSub]);
    setName(''); setAmount(''); setRenewalDate('');
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Sil', 'Bu aboneliği silmek istiyor musunuz?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => save(subs.filter((s) => s.id !== id)) },
    ]);
  };

  const totalMonthly = subs.reduce((sum, s) => sum + s.amount, 0);

  const isUnused = (lastUsed?: string) => {
    if (!lastUsed) return false;
    const diff = Date.now() - new Date(lastUsed).getTime();
    return diff > 30 * 24 * 60 * 60 * 1000;
  };

  return (
    <View style={styles.container}>
      {subs.length > 0 && (
        <View style={styles.totalBar}>
          <Text style={styles.totalLabel}>Aylık Toplam</Text>
          <Text style={styles.totalVal}>{formatCurrency(totalMonthly)}</Text>
        </View>
      )}
      <FlatList
        data={subs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            icon="card-outline"
            title="Abonelik yok"
            description="Aktif aboneliklerinizi ekleyin"
            actionLabel="Ekle"
            onAction={() => setShowForm(true)}
          />
        }
        ListHeaderComponent={
          subs.length > 0 ? (
            <TouchableOpacity style={styles.addRow} onPress={() => setShowForm(true)}>
              <Ionicons name="add-circle" size={22} color={colors.personal} />
              <Text style={styles.addRowText}>Abonelik Ekle</Text>
            </TouchableOpacity>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={[styles.subCard, isUnused(item.lastUsed) && styles.unusedCard]}>
            <View style={styles.subIcon}>
              <Text style={styles.subIconText}>{item.name.charAt(0)}</Text>
            </View>
            <View style={styles.subInfo}>
              <Text style={styles.subName}>{item.name}</Text>
              <Text style={styles.subRenewal}>Yenileme: {formatRenewalDay(item.renewalDate)}</Text>
              {isUnused(item.lastUsed) && (
                <Text style={styles.unusedText}>30+ gün kullanılmadı</Text>
              )}
            </View>
            <View style={styles.subRight}>
              <Text style={styles.subAmount}>{formatCurrency(item.amount)}/ay</Text>
              <TouchableOpacity onPress={() => handleDelete(item.id)}>
                <Ionicons name="trash-outline" size={18} color={colors.text.muted} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <Modal visible={showForm} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Abonelik Ekle</Text>
              <TouchableOpacity onPress={() => setShowForm(false)}>
                <Ionicons name="close" size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>
            <TextInput style={styles.input} placeholder="Abonelik Adı (Netflix, Spotify...)" value={name} onChangeText={setName} />
            <TextInput style={styles.input} placeholder="Aylık Tutar (₺)" keyboardType="numeric" value={amount} onChangeText={setAmount} />
            <TextInput style={styles.input} placeholder="Yenileme Günü (1-31)" keyboardType="numeric" value={renewalDate} onChangeText={setRenewalDate} />
            <Button title="Kaydet" onPress={handleAdd} />
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
  list: { padding: theme.spacing.md, gap: theme.spacing.sm, paddingBottom: 32 },
  addRow: {
    flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  addRowText: { ...theme.typography.body, color: colors.personal, fontWeight: '600' },
  subCard: {
    flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm,
    backgroundColor: colors.card, borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md, ...theme.shadow.card,
  },
  unusedCard: { borderLeftWidth: 3, borderLeftColor: colors.warning },
  subIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center',
  },
  subIconText: { fontSize: 18, fontWeight: '700', color: colors.primary },
  subInfo: { flex: 1 },
  subName: { ...theme.typography.body, fontWeight: '600', color: colors.text.primary },
  subRenewal: { ...theme.typography.caption, color: colors.text.secondary },
  unusedText: { fontSize: 11, color: colors.warning, fontWeight: '600', marginTop: 2 },
  subRight: { alignItems: 'flex-end', gap: theme.spacing.xs },
  subAmount: { fontSize: 14, fontWeight: '700', color: colors.text.primary },
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
