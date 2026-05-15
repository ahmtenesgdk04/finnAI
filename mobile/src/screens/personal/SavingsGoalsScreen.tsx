import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  Modal, StyleSheet, Alert, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { theme } from '../../constants/theme';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { personalAPI } from '../../services/api';
import { useApi, useApiMutation } from '../../hooks/useApi';
import ProgressBar from '../../components/education/ProgressBar';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';

interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
}

export default function SavingsGoalsScreen() {
  const [showForm, setShowForm] = useState(false);
  const [showContrib, setShowContrib] = useState<Goal | null>(null);
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [contribution, setContribution] = useState('');

  const { data: goals, loading, refetch } = useApi(
    useCallback(() => personalAPI.getGoals(), [])
  );
  const { mutate: createGoal, loading: creating } = useApiMutation(personalAPI.createGoal);
  const { mutate: updateGoal, loading: updating } = useApiMutation(
    (params: { id: string; data: any }) => personalAPI.updateGoal(params.id, params.data)
  );
  const { mutate: deleteGoal } = useApiMutation(personalAPI.deleteGoal);

  const goalList: Goal[] = (goals as any) || [];

  const handleCreate = async () => {
    if (!name || !targetAmount || !targetDate) {
      Alert.alert('Uyarı', 'Tüm alanları doldurun');
      return;
    }
    try {
      await createGoal({ name, targetAmount: parseFloat(targetAmount), targetDate, currentAmount: 0 });
      setName(''); setTargetAmount(''); setTargetDate('');
      setShowForm(false);
      refetch();
    } catch {
      Alert.alert('Hata', 'Hedef oluşturulamadı');
    }
  };

  const handleContrib = async () => {
    if (!showContrib || !contribution) return;
    try {
      await updateGoal({
        id: showContrib.id,
        data: { currentAmount: showContrib.currentAmount + parseFloat(contribution) },
      });
      setContribution('');
      setShowContrib(null);
      refetch();
    } catch {
      Alert.alert('Hata', 'Güncelleme başarısız');
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Sil', 'Bu hedefi silmek istediğinizden emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil', style: 'destructive',
        onPress: async () => {
          await deleteGoal(id);
          refetch();
        },
      },
    ]);
  };

  const monthsLeft = (targetDate: string) => {
    const diff = new Date(targetDate).getTime() - Date.now();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24 * 30)));
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={goalList}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
        ListEmptyComponent={
          <EmptyState
            icon="flag-outline"
            title="Henüz hedef yok"
            description="İlk birikim hedefinizi oluşturun"
            actionLabel="Hedef Ekle"
            onAction={() => setShowForm(true)}
          />
        }
        ListHeaderComponent={
          goalList.length > 0 ? (
            <TouchableOpacity style={styles.addRow} onPress={() => setShowForm(true)}>
              <Ionicons name="add-circle" size={22} color={colors.personal} />
              <Text style={styles.addRowText}>Yeni Hedef Ekle</Text>
            </TouchableOpacity>
          ) : null
        }
        renderItem={({ item }) => {
          const pct = Math.min((item.currentAmount / item.targetAmount) * 100, 100);
          const months = monthsLeft(item.targetDate);
          const monthly = Math.ceil((item.targetAmount - item.currentAmount) / months);
          const done = item.currentAmount >= item.targetAmount;
          return (
            <View style={[styles.goalCard, done && styles.goalDone]}>
              <View style={styles.goalHeader}>
                <Text style={styles.goalName}>{item.name}</Text>
                <TouchableOpacity onPress={() => handleDelete(item.id)}>
                  <Ionicons name="trash-outline" size={18} color={colors.text.muted} />
                </TouchableOpacity>
              </View>
              <View style={styles.amounts}>
                <Text style={styles.current}>{formatCurrency(item.currentAmount)}</Text>
                <Text style={styles.target}> / {formatCurrency(item.targetAmount)}</Text>
              </View>
              <ProgressBar
                current={item.currentAmount}
                total={item.targetAmount}
                color={done ? colors.secondary : colors.personal}
                showLabel={false}
                height={10}
              />
              {!done && (
                <View style={styles.goalMeta}>
                  <Text style={styles.metaText}>Hedef: {formatDate(item.targetDate)}</Text>
                  <Text style={styles.metaText}>Aylık: {formatCurrency(monthly)}</Text>
                </View>
              )}
              {done && (
                <View style={styles.doneRow}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.secondary} />
                  <Text style={styles.doneText}>Tamamlandı!</Text>
                </View>
              )}
              {!done && (
                <TouchableOpacity style={styles.contribBtn} onPress={() => setShowContrib(item)}>
                  <Text style={styles.contribBtnText}>+ Katkı Ekle</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
      />

      {/* Yeni Hedef Modal */}
      <Modal visible={showForm} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Yeni Hedef</Text>
              <TouchableOpacity onPress={() => setShowForm(false)}>
                <Ionicons name="close" size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>
            <TextInput style={styles.input} placeholder="Hedef Adı (örn: Tatil)" value={name} onChangeText={setName} />
            <TextInput style={styles.input} placeholder="Hedef Tutar (₺)" keyboardType="numeric" value={targetAmount} onChangeText={setTargetAmount} />
            <TextInput style={styles.input} placeholder="Hedef Tarih (YYYY-AA-GG)" value={targetDate} onChangeText={setTargetDate} />
            <Button title="Kaydet" onPress={handleCreate} loading={creating} />
          </View>
        </View>
      </Modal>

      {/* Katkı Modal */}
      <Modal visible={!!showContrib} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Katkı Ekle — {showContrib?.name}</Text>
              <TouchableOpacity onPress={() => setShowContrib(null)}>
                <Ionicons name="close" size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input} placeholder="Tutar (₺)" keyboardType="numeric"
              value={contribution} onChangeText={setContribution}
            />
            <Button title="Ekle" onPress={handleContrib} loading={updating} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: theme.spacing.md, gap: theme.spacing.md, paddingBottom: 32 },
  addRow: {
    flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  addRowText: { ...theme.typography.body, color: colors.personal, fontWeight: '600' },
  goalCard: {
    backgroundColor: colors.card, borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md, gap: theme.spacing.sm, ...theme.shadow.card,
  },
  goalDone: { borderLeftWidth: 4, borderLeftColor: colors.secondary },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  goalName: { ...theme.typography.h3, color: colors.text.primary },
  amounts: { flexDirection: 'row', alignItems: 'baseline' },
  current: { fontSize: 20, fontWeight: '700', color: colors.personal },
  target: { fontSize: 14, color: colors.text.secondary },
  goalMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  metaText: { ...theme.typography.caption, color: colors.text.secondary },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  doneText: { fontSize: 14, color: colors.secondary, fontWeight: '600' },
  contribBtn: {
    alignSelf: 'flex-start', backgroundColor: '#EDE9FE',
    borderRadius: 99, paddingHorizontal: 14, paddingVertical: 6,
  },
  contribBtnText: { fontSize: 13, color: colors.personal, fontWeight: '600' },
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
