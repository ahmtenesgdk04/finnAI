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

const CATEGORIES = [
  { name: 'Market', icon: '🛒' },
  { name: 'Yemek', icon: '🍽️' },
  { name: 'Ulaşım', icon: '🚌' },
  { name: 'Eğlence', icon: '🎮' },
  { name: 'Fatura', icon: '💡' },
  { name: 'Sağlık', icon: '💊' },
  { name: 'Giyim', icon: '👕' },
  { name: 'Eğitim', icon: '📚' },
  { name: 'Spor', icon: '🏃' },
  { name: 'Kozmetik', icon: '💄' },
  { name: 'Elektronik', icon: '📱' },
  { name: 'Ev', icon: '🏠' },
];

export default function LimitSettingsScreen() {
  const navigation = useNavigation<any>();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [limitInput, setLimitInput] = useState('');
  const [saving, setSaving] = useState(false);

  const month = formatMonth();

  const { data, loading, refetch } = useApi(
    useCallback(() => personalAPI.getLimits(), [])
  );
  const { data: summary, refetch: refetchSummary } = useApi(
    useCallback(() => personalAPI.getSummary(month), [month])
  );

  const limitsRaw: any[] = (data as any)?.limits || [];
  const limitsMap: Record<string, number> = Object.fromEntries(
    limitsRaw.map((l: any) => [l.category, parseFloat(l.monthly_limit)])
  );

  const spendingMap: Record<string, number> = Object.fromEntries(
    ((summary as any)?.categories || []).map((c: any) => [c.category, c.amount])
  );

  const handleRefetch = () => { refetch(); refetchSummary(); };

  const openModal = (category: string) => {
    setSelectedCategory(category);
    setLimitInput(limitsMap[category] ? String(limitsMap[category]) : '');
    setModalVisible(true);
  };

  const handleSave = async () => {
    const parsed = parseFloat(limitInput.replace(',', '.'));
    if (!parsed || parsed <= 0) {
      Alert.alert('Uyarı', 'Geçerli bir tutar girin');
      return;
    }
    setSaving(true);
    try {
      await personalAPI.setLimit({ category: selectedCategory, monthlyLimit: parsed });
      setModalVisible(false);
      handleRefetch();
    } catch {
      Alert.alert('Hata', 'Limit kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !data) return <LoadingSpinner fullScreen text="Yükleniyor..." />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Kategori Limitleri</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={handleRefetch} />}
      >
        <Text style={styles.hint}>
          Her kategori için aylık harcama limiti belirle. Limit aşıldığında uyarı alırsın.
        </Text>

        {CATEGORIES.map((cat) => {
          const limit = limitsMap[cat.name];
          const spent = spendingMap[cat.name] || 0;
          const pct = limit ? Math.min((spent / limit) * 100, 100) : 0;
          const over = limit && spent > limit;
          const barColor = over ? colors.danger : pct > 80 ? colors.warning : colors.secondary;
          return (
            <TouchableOpacity
              key={cat.name}
              style={styles.row}
              onPress={() => openModal(cat.name)}
              activeOpacity={0.7}
            >
              <View style={styles.rowIcon}>
                <Text style={{ fontSize: 20 }}>{cat.icon}</Text>
              </View>
              <View style={styles.rowText}>
                <View style={styles.rowTopLine}>
                  <Text style={styles.rowName}>{cat.name}</Text>
                  <Ionicons
                    name={limit ? 'pencil-outline' : 'add-circle-outline'}
                    size={18}
                    color={limit ? colors.personal : colors.text.muted}
                  />
                </View>
                {limit ? (
                  <>
                    <View style={styles.rowAmounts}>
                      <Text style={[styles.rowSpent, over && { color: colors.danger }]}>
                        {formatCurrency(spent)}
                      </Text>
                      <Text style={styles.rowLimitText}>/ {formatCurrency(limit)}</Text>
                    </View>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: barColor }]} />
                    </View>
                    {over && (
                      <Text style={styles.overText}>
                        Limit aşıldı! {formatCurrency(spent - limit)} fazla
                      </Text>
                    )}
                  </>
                ) : (
                  <Text style={styles.rowNoLimit}>Limit belirlenmedi</Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={modal.overlay}>
          <View style={modal.sheet}>
            <View style={modal.header}>
              <Text style={modal.title}>{selectedCategory} Limiti</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <Text style={modal.label}>Aylık limit (₺)</Text>
            <TextInput
              style={modal.input}
              placeholder="örn. 3000"
              keyboardType="decimal-pad"
              value={limitInput}
              onChangeText={setLimitInput}
              placeholderTextColor={colors.text.muted}
              autoFocus
            />

            <TouchableOpacity
              style={[modal.btn, saving && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={modal.btnText}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</Text>
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
  content: { padding: theme.spacing.md, gap: theme.spacing.sm, paddingBottom: 40 },
  hint: { fontSize: 13, color: colors.text.muted, lineHeight: 18, marginBottom: 4 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm,
    backgroundColor: colors.card, borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md, ...theme.shadow.card,
  },
  rowIcon: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center',
  },
  rowText: { flex: 1, gap: 4 },
  rowTopLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowName: { fontSize: 15, fontWeight: '600', color: colors.text.primary },
  rowAmounts: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  rowSpent: { fontSize: 13, fontWeight: '700', color: colors.text.primary },
  rowLimitText: { fontSize: 12, color: colors.text.muted },
  rowNoLimit: { fontSize: 12, color: colors.text.muted },
  barTrack: { height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  overText: { fontSize: 11, color: colors.danger, fontWeight: '600' },
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
    backgroundColor: colors.personal, borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md, alignItems: 'center', marginTop: 8,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
