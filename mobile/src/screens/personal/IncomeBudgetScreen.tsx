import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, RefreshControl, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../constants/colors';
import { theme } from '../../constants/theme';
import { formatCurrency, formatMonth } from '../../utils/formatters';
import { personalAPI } from '../../services/api';
import { useApi } from '../../hooks/useApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const MONTH_NAMES: Record<string, string> = {
  '01': 'Ocak', '02': 'Şubat', '03': 'Mart', '04': 'Nisan',
  '05': 'Mayıs', '06': 'Haziran', '07': 'Temmuz', '08': 'Ağustos',
  '09': 'Eylül', '10': 'Ekim', '11': 'Kasım', '12': 'Aralık',
};

function monthLabel(m: string) {
  const [year, mon] = m.split('-');
  return `${MONTH_NAMES[mon] || mon} ${year}`;
}

export default function IncomeBudgetScreen() {
  const navigation = useNavigation<any>();
  const month = formatMonth();
  const [modalVisible, setModalVisible] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const { data, loading, refetch } = useApi(
    useCallback(() => personalAPI.getIncome(month), [month])
  );

  const incomeData = data as any;
  const entries: any[] = incomeData?.entries || [];
  const total: number = incomeData?.total || 0;

  const handleAdd = async () => {
    const parsed = parseFloat(amount.replace(',', '.'));
    if (!parsed || parsed <= 0) {
      Alert.alert('Uyarı', 'Geçerli bir tutar girin');
      return;
    }
    setSaving(true);
    try {
      await personalAPI.addIncome({ amount: parsed, description: description.trim() || undefined, month });
      setAmount('');
      setDescription('');
      setModalVisible(false);
      refetch();
    } catch {
      Alert.alert('Hata', 'Gelir eklenemedi');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string, desc: string) => {
    Alert.alert(
      'Sil',
      `"${desc || 'Bu gelir girişi'}" silinsin mi?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil', style: 'destructive',
          onPress: async () => {
            try {
              await personalAPI.deleteIncome(id);
              refetch();
            } catch {
              Alert.alert('Hata', 'Silinemedi');
            }
          },
        },
      ]
    );
  };

  if (loading && !data) return <LoadingSpinner fullScreen text="Yükleniyor..." />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Bütçem</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
      >
        {/* Toplam kart */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>{monthLabel(month)} Toplam Bütçe</Text>
          <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
          {total === 0 && (
            <Text style={styles.totalHint}>
              Gelir ekleyerek bütçeni belirle. Eklemezsen limit toplamı kullanılır.
            </Text>
          )}
        </View>

        {/* Giriş listesi */}
        <Text style={styles.sectionTitle}>Gelir Girişleri</Text>

        {entries.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="wallet-outline" size={48} color={colors.text.muted} />
            <Text style={styles.emptyText}>Henüz gelir girişi yok</Text>
            <Text style={styles.emptyHint}>Maaş, freelance gelir veya elimdeki bütçeni ekle</Text>
          </View>
        ) : (
          entries.map((e) => (
            <View key={e.id} style={styles.row}>
              <View style={styles.rowIcon}>
                <Ionicons name="cash-outline" size={20} color={colors.secondary} />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowDesc}>{e.description || 'Gelir'}</Text>
                <Text style={styles.rowDate}>
                  {new Date(e.created_at).toLocaleDateString('tr-TR')}
                </Text>
              </View>
              <Text style={styles.rowAmount}>{formatCurrency(parseFloat(e.amount))}</Text>
              <TouchableOpacity onPress={() => handleDelete(e.id, e.description)} style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={18} color={colors.danger} />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={modal.overlay}>
          <View style={modal.sheet}>
            <View style={modal.header}>
              <Text style={modal.title}>Bütçe / Gelir Ekle</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <Text style={modal.label}>Tutar (₺)</Text>
            <TextInput
              style={modal.input}
              placeholder="örn. 15000"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              placeholderTextColor={colors.text.muted}
            />

            <Text style={modal.label}>Açıklama (isteğe bağlı)</Text>
            <TextInput
              style={modal.input}
              placeholder="örn. Maaş, Freelance, Kira geliri..."
              value={description}
              onChangeText={setDescription}
              placeholderTextColor={colors.text.muted}
            />

            <TouchableOpacity
              style={[modal.btn, saving && { opacity: 0.6 }]}
              onPress={handleAdd}
              disabled={saving}
            >
              <Text style={modal.btnText}>{saving ? 'Ekleniyor...' : 'Ekle'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.card },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.card, paddingHorizontal: theme.spacing.md,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: { width: 40, alignItems: 'flex-start' },
  topBarTitle: { fontSize: 17, fontWeight: '700', color: colors.text.primary },
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { padding: theme.spacing.md, paddingBottom: 100, gap: theme.spacing.md },
  totalCard: {
    backgroundColor: colors.secondary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
    gap: 6,
    ...theme.shadow.elevated,
  },
  totalLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  totalValue: { fontSize: 32, fontWeight: '700', color: '#fff' },
  totalHint: { fontSize: 12, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: 4 },
  sectionTitle: { ...theme.typography.h3, color: colors.text.primary },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyText: { ...theme.typography.body, color: colors.text.secondary },
  emptyHint: { fontSize: 12, color: colors.text.muted, textAlign: 'center' },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm,
    backgroundColor: colors.card, borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md, ...theme.shadow.card,
  },
  rowIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#D1FAE5', alignItems: 'center', justifyContent: 'center',
  },
  rowText: { flex: 1 },
  rowDesc: { fontSize: 14, fontWeight: '600', color: colors.text.primary },
  rowDate: { fontSize: 12, color: colors.text.muted, marginTop: 2 },
  rowAmount: { fontSize: 15, fontWeight: '700', color: colors.secondary },
  deleteBtn: { padding: 4 },
  fab: {
    position: 'absolute', bottom: 28, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center',
    ...theme.shadow.elevated,
  },
});

const modal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: theme.spacing.lg, paddingBottom: 40, gap: theme.spacing.sm,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title: { fontSize: 18, fontWeight: '700', color: colors.text.primary },
  label: { fontSize: 13, fontWeight: '600', color: colors.text.secondary, marginTop: 4 },
  input: {
    backgroundColor: colors.card, borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md, fontSize: 15, color: colors.text.primary,
    borderWidth: 1, borderColor: colors.border,
  },
  btn: {
    backgroundColor: colors.secondary, borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md, alignItems: 'center', marginTop: 8,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
