import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, RefreshControl, Modal, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../../constants/colors';
import { theme } from '../../constants/theme';
import { formatCurrency, formatMonth } from '../../utils/formatters';
import { personalAPI } from '../../services/api';
import { useApi } from '../../hooks/useApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const STORAGE_KEY = 'custom_categories';
const STORAGE_KEY_DELETED = 'deleted_default_categories';

const DEFAULT_CATEGORIES = [
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

const EMOJI_OPTIONS = [
  '🛒','🍽️','🚌','🎮','💡','💊','👕','📚','🏃','💄','📱','🏠',
  '✈️','🎵','🎬','🏋️','🐾','🌿','🍕','☕','🎁','💈','🔧','🚗',
  '🏦','💰','🎯','🛠️','🌍','📷','🎨','🎻','🏖️','🍦','🎪','🎲',
  '🧴','🧹','🪴','🧃','🥗','🛁','🪑','💻','🖨️','📦','🧲','🎀',
];

type Category = { name: string; icon: string };

export default function LimitSettingsScreen() {
  const navigation = useNavigation<any>();

  const [customCategories, setCustomCategories] = useState<Category[]>([]);
  const [deletedDefaults, setDeletedDefaults] = useState<string[]>([]);

  // Limit modal
  const [limitModal, setLimitModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [limitInput, setLimitInput] = useState('');
  const [savingLimit, setSavingLimit] = useState(false);

  // Harcama modal
  const [expenseModal, setExpenseModal] = useState(false);
  const [expenseCategory, setExpenseCategory] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseNote, setExpenseNote] = useState('');
  const [savingExpense, setSavingExpense] = useState(false);

  // Yeni kategori modal
  const [newCatModal, setNewCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('📂');

  const month = formatMonth();

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(STORAGE_KEY),
      AsyncStorage.getItem(STORAGE_KEY_DELETED),
    ]).then(([custom, deleted]) => {
      if (custom) setCustomCategories(JSON.parse(custom));
      if (deleted) setDeletedDefaults(JSON.parse(deleted));
    });
  }, []);

  const saveCustomCategories = async (updated: Category[]) => {
    setCustomCategories(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const handleAddCategory = async () => {
    const trimmed = newCatName.trim();
    if (!trimmed) {
      Alert.alert('Uyarı', 'Kategori adı girin');
      return;
    }
    const all = [...DEFAULT_CATEGORIES, ...customCategories];
    if (all.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      Alert.alert('Uyarı', 'Bu kategori zaten var');
      return;
    }
    await saveCustomCategories([...customCategories, { name: trimmed, icon: newCatIcon }]);
    setNewCatModal(false);
    setNewCatName('');
    setNewCatIcon('📂');
  };

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

  const allCategories = [
    ...DEFAULT_CATEGORIES.filter((d) => !deletedDefaults.includes(d.name)),
    ...customCategories,
  ];

  const handleRefetch = () => { refetch(); refetchSummary(); };

  const handleDeleteCategory = (catName: string) => {
    Alert.alert(
      'Kategoriyi Sil',
      `"${catName}" kategorisini silmek istiyor musunuz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            const isDefault = DEFAULT_CATEGORIES.some((d) => d.name === catName);
            if (isDefault) {
              const updated = [...deletedDefaults, catName];
              setDeletedDefaults(updated);
              await AsyncStorage.setItem(STORAGE_KEY_DELETED, JSON.stringify(updated));
            } else {
              await saveCustomCategories(customCategories.filter((c) => c.name !== catName));
            }
          },
        },
      ]
    );
  };

  const openLimitModal = (category: string) => {
    setSelectedCategory(category);
    setLimitInput(limitsMap[category] ? String(limitsMap[category]) : '');
    setLimitModal(true);
  };

  const openExpenseModal = (category: string) => {
    setExpenseCategory(category);
    setExpenseAmount('');
    setExpenseNote('');
    setExpenseModal(true);
  };

  const handleSaveLimit = async () => {
    const parsed = parseFloat(limitInput.replace(',', '.'));
    if (!parsed || parsed <= 0) {
      Alert.alert('Uyarı', 'Geçerli bir tutar girin');
      return;
    }
    setSavingLimit(true);
    try {
      await personalAPI.setLimit({ category: selectedCategory, monthlyLimit: parsed });
      setLimitModal(false);
      handleRefetch();
    } catch {
      Alert.alert('Hata', 'Limit kaydedilemedi');
    } finally {
      setSavingLimit(false);
    }
  };

  const handleAddExpense = async () => {
    const parsed = parseFloat(expenseAmount.replace(',', '.'));
    if (!parsed || parsed <= 0) {
      Alert.alert('Uyarı', 'Geçerli bir tutar girin');
      return;
    }
    setSavingExpense(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      await personalAPI.addEntry({
        amount: parsed,
        category: expenseCategory,
        date: today,
        note: expenseNote.trim() || undefined,
      });
      setExpenseModal(false);
      handleRefetch();
    } catch {
      Alert.alert('Hata', 'Harcama eklenemedi');
    } finally {
      setSavingExpense(false);
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
          Limit belirle ve harcama ekle. Kalem → limit düzenle, + → harcama ekle. Silmek için üstüne uzun bas.
        </Text>

        {allCategories.map((cat) => {
          const limit = limitsMap[cat.name];
          const spent = spendingMap[cat.name] || 0;
          const pct = limit ? Math.min((spent / limit) * 100, 100) : 0;
          const over = limit && spent > limit;
          const barColor = over ? colors.danger : pct > 80 ? colors.warning : colors.secondary;
          return (
            <TouchableOpacity
              key={cat.name}
              style={styles.row}
              activeOpacity={0.7}
              onLongPress={() => handleDeleteCategory(cat.name)}
              delayLongPress={400}
            >
              <View style={styles.rowIcon}>
                <Text style={{ fontSize: 20 }}>{cat.icon}</Text>
              </View>

              <View style={styles.rowText}>
                <View style={styles.rowTopLine}>
                  <Text style={styles.rowName}>{cat.name}</Text>
                  <TouchableOpacity
                    onPress={() => openLimitModal(cat.name)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name={limit ? 'pencil-outline' : 'options-outline'}
                      size={18}
                      color={limit ? colors.personal : colors.text.muted}
                    />
                  </TouchableOpacity>
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

              {limit && (
                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={() => openExpenseModal(cat.name)}
                  hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                >
                  <Ionicons name="add" size={16} color="#fff" />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          );
        })}

        {/* Yeni kategori ekle butonu */}
        <TouchableOpacity style={styles.newCatBtn} onPress={() => setNewCatModal(true)}>
          <Ionicons name="add-circle-outline" size={20} color={colors.personal} />
          <Text style={styles.newCatBtnText}>Yeni Kategori Ekle</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Limit modalı */}
      <Modal visible={limitModal} transparent animationType="slide" onRequestClose={() => setLimitModal(false)}>
        <View style={modal.overlay}>
          <View style={modal.sheet}>
            <View style={modal.header}>
              <Text style={modal.title}>{selectedCategory} Limiti</Text>
              <TouchableOpacity onPress={() => setLimitModal(false)}>
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
              style={[modal.btn, { backgroundColor: colors.personal }, savingLimit && { opacity: 0.6 }]}
              onPress={handleSaveLimit}
              disabled={savingLimit}
            >
              <Text style={modal.btnText}>{savingLimit ? 'Kaydediliyor...' : 'Kaydet'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Harcama ekleme modalı */}
      <Modal visible={expenseModal} transparent animationType="slide" onRequestClose={() => setExpenseModal(false)}>
        <View style={modal.overlay}>
          <View style={modal.sheet}>
            <View style={modal.header}>
              <Text style={modal.title}>{expenseCategory} Harcaması</Text>
              <TouchableOpacity onPress={() => setExpenseModal(false)}>
                <Ionicons name="close" size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>
            <Text style={modal.label}>Tutar (₺)</Text>
            <TextInput
              style={modal.input}
              placeholder="örn. 250"
              keyboardType="decimal-pad"
              value={expenseAmount}
              onChangeText={setExpenseAmount}
              placeholderTextColor={colors.text.muted}
              autoFocus
            />
            <Text style={modal.label}>Not (isteğe bağlı)</Text>
            <TextInput
              style={modal.input}
              placeholder="örn. Haftalık alışveriş"
              value={expenseNote}
              onChangeText={setExpenseNote}
              placeholderTextColor={colors.text.muted}
            />
            <TouchableOpacity
              style={[modal.btn, { backgroundColor: colors.danger }, savingExpense && { opacity: 0.6 }]}
              onPress={handleAddExpense}
              disabled={savingExpense}
            >
              <Text style={modal.btnText}>{savingExpense ? 'Ekleniyor...' : 'Harcama Ekle'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Yeni kategori modalı */}
      <Modal visible={newCatModal} transparent animationType="slide" onRequestClose={() => setNewCatModal(false)}>
        <View style={modal.overlay}>
          <View style={[modal.sheet, { maxHeight: '80%' }]}>
            <View style={modal.header}>
              <Text style={modal.title}>Yeni Kategori</Text>
              <TouchableOpacity onPress={() => setNewCatModal(false)}>
                <Ionicons name="close" size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <Text style={modal.label}>Kategori Adı</Text>
            <TextInput
              style={modal.input}
              placeholder="örn. Hobi"
              value={newCatName}
              onChangeText={setNewCatName}
              placeholderTextColor={colors.text.muted}
              autoFocus
            />

            <Text style={modal.label}>Simge Seç</Text>
            <View style={styles.selectedEmojiRow}>
              <Text style={styles.selectedEmoji}>{newCatIcon}</Text>
              <Text style={styles.selectedEmojiHint}>seçili simge</Text>
            </View>
            <FlatList
              data={EMOJI_OPTIONS}
              keyExtractor={(item) => item}
              numColumns={8}
              style={styles.emojiGrid}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.emojiCell, newCatIcon === item && styles.emojiCellSelected]}
                  onPress={() => setNewCatIcon(item)}
                >
                  <Text style={styles.emojiItem}>{item}</Text>
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity
              style={[modal.btn, { backgroundColor: colors.personal }]}
              onPress={handleAddCategory}
            >
              <Text style={modal.btnText}>Ekle</Text>
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
  addBtn: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center',
  },
  newCatBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.card, borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md, borderWidth: 1, borderColor: colors.personal,
    borderStyle: 'dashed', marginTop: 4,
  },
  newCatBtnText: { fontSize: 15, fontWeight: '600', color: colors.personal },
  selectedEmojiRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  selectedEmoji: { fontSize: 28 },
  selectedEmojiHint: { fontSize: 12, color: colors.text.muted },
  emojiGrid: { maxHeight: 220 },
  emojiCell: {
    flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: 'center',
    borderRadius: 8, margin: 2,
  },
  emojiCellSelected: { backgroundColor: colors.personalLight },
  emojiItem: { fontSize: 22 },
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
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md, alignItems: 'center', marginTop: 8,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
