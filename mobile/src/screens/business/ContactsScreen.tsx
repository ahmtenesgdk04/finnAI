import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput,
  Modal, Alert, Linking, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../../constants/colors';

const STORAGE_KEY = 'business_contacts';

type ContactType = 'musteri' | 'tedarikci';
type FilterType = 'all' | ContactType;

type Contact = {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  note: string;
  type: ContactType;
  createdAt: string;
};

const TYPE_LABELS: Record<ContactType, string> = { musteri: 'Müşteri', tedarikci: 'Tedarikçi' };
const TYPE_COLORS: Record<ContactType, { bg: string; text: string }> = {
  musteri: { bg: '#EFF6FF', text: colors.business },
  tedarikci: { bg: '#F0FDF4', text: '#16A34A' },
};

const EMPTY: Omit<Contact, 'id' | 'createdAt'> = {
  name: '', company: '', phone: '', email: '', note: '', type: 'musteri',
};

function avatarLetter(name: string) {
  return name.trim().charAt(0).toUpperCase() || '?';
}

function avatarBg(type: ContactType) {
  return type === 'musteri' ? colors.business : '#16A34A';
}

export default function ContactsScreen({ navigation }: { navigation: any }) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  const [showAddModal, setShowAddModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Contact | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  const [detailContact, setDetailContact] = useState<Contact | null>(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) setContacts(JSON.parse(raw));
    } finally {
      setLoading(false);
    }
  };

  const save = async (updated: Contact[]) => {
    setContacts(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const filtered = useMemo(() => {
    let list = contacts;
    if (filter !== 'all') list = list.filter(c => c.type === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        c.phone.includes(q)
      );
    }
    return [...list].sort((a, b) => a.name.localeCompare(b.name, 'tr'));
  }, [contacts, filter, search]);

  const openAdd = () => {
    setEditTarget(null);
    setForm({ ...EMPTY });
    setShowAddModal(true);
  };

  const openEdit = (contact: Contact) => {
    setDetailContact(null);
    setEditTarget(contact);
    setForm({
      name: contact.name,
      company: contact.company,
      phone: contact.phone,
      email: contact.email,
      note: contact.note,
      type: contact.type,
    });
    setShowAddModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert('Hata', 'Ad Soyad zorunludur.');
      return;
    }
    setSaving(true);
    try {
      let updated: Contact[];
      if (editTarget) {
        updated = contacts.map(c =>
          c.id === editTarget.id ? { ...editTarget, ...form, name: form.name.trim() } : c
        );
      } else {
        const newContact: Contact = {
          id: Date.now().toString(),
          ...form,
          name: form.name.trim(),
          createdAt: new Date().toISOString(),
        };
        updated = [newContact, ...contacts];
      }
      await save(updated);
      setShowAddModal(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (contact: Contact) => {
    Alert.alert(
      'Kişiyi Sil',
      `"${contact.name}" kişisini silmek istediğinize emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil', style: 'destructive',
          onPress: async () => {
            setDetailContact(null);
            await save(contacts.filter(c => c.id !== contact.id));
          },
        },
      ]
    );
  };

  const call = (phone: string) => Linking.openURL(`tel:${phone}`);

  const renderContact = ({ item }: { item: Contact }) => (
    <TouchableOpacity style={styles.contactRow} onPress={() => setDetailContact(item)} activeOpacity={0.7}>
      <View style={[styles.avatar, { backgroundColor: avatarBg(item.type) }]}>
        <Text style={styles.avatarText}>{avatarLetter(item.name)}</Text>
      </View>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.name}</Text>
        {item.company ? <Text style={styles.contactSub}>{item.company}</Text> : null}
        {item.phone ? <Text style={styles.contactPhone}>{item.phone}</Text> : null}
      </View>
      <View style={styles.contactRight}>
        <View style={[styles.typeBadge, { backgroundColor: TYPE_COLORS[item.type].bg }]}>
          <Text style={[styles.typeText, { color: TYPE_COLORS[item.type].text }]}>
            {TYPE_LABELS[item.type]}
          </Text>
        </View>
        {item.phone ? (
          <TouchableOpacity onPress={() => call(item.phone)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="call-outline" size={18} color={colors.business} />
          </TouchableOpacity>
        ) : null}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rehber</Text>
        <TouchableOpacity onPress={openAdd} style={styles.addBtn}>
          <Ionicons name="add" size={24} color={colors.business} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={16} color={colors.text.muted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Ara..."
          placeholderTextColor={colors.text.muted}
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={colors.text.muted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filter chips */}
      <View style={styles.filterRow}>
        {(['all', 'musteri', 'tedarikci'] as FilterType[]).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, filter === f && styles.chipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>
              {f === 'all' ? 'Tümü' : TYPE_LABELS[f as ContactType]}
            </Text>
          </TouchableOpacity>
        ))}
        <Text style={styles.countText}>{filtered.length} kişi</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.business} />
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="people-outline" size={52} color={colors.text.muted} />
          <Text style={styles.emptyTitle}>
            {contacts.length === 0 ? 'Henüz kişi yok' : 'Eşleşen kişi bulunamadı'}
          </Text>
          {contacts.length === 0 && (
            <TouchableOpacity style={styles.emptyBtn} onPress={openAdd}>
              <Text style={styles.emptyBtnText}>İlk kişiyi ekle</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderContact}
          contentContainerStyle={{ padding: 12, gap: 8 }}
          keyboardShouldPersistTaps="handled"
        />
      )}

      {/* Detail Modal */}
      <Modal visible={!!detailContact} transparent animationType="slide" onRequestClose={() => setDetailContact(null)}>
        <View style={styles.overlay}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setDetailContact(null)} />
          {detailContact && (
            <View style={styles.detailSheet}>
              {/* Handle */}
              <View style={styles.sheetHandle} />

              {/* Header */}
              <View style={styles.detailTop}>
                <View style={[styles.detailAvatar, { backgroundColor: avatarBg(detailContact.type) }]}>
                  <Text style={styles.detailAvatarText}>{avatarLetter(detailContact.name)}</Text>
                </View>
                <View style={styles.detailTopText}>
                  <Text style={styles.detailName}>{detailContact.name}</Text>
                  {detailContact.company ? (
                    <Text style={styles.detailCompany}>{detailContact.company}</Text>
                  ) : null}
                </View>
                <View style={[styles.typeBadge, { backgroundColor: TYPE_COLORS[detailContact.type].bg }]}>
                  <Text style={[styles.typeText, { color: TYPE_COLORS[detailContact.type].text }]}>
                    {TYPE_LABELS[detailContact.type]}
                  </Text>
                </View>
              </View>

              {/* Action buttons — always 4, phone actions disabled when no phone */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => detailContact.phone && call(detailContact.phone)}
                  disabled={!detailContact.phone}
                >
                  <View style={[styles.actionIcon, { backgroundColor: detailContact.phone ? '#EFF6FF' : colors.background }]}>
                    <Ionicons name="call" size={22} color={detailContact.phone ? colors.business : colors.text.muted} />
                  </View>
                  <Text style={[styles.actionLabel, !detailContact.phone && { color: colors.text.muted }]}>Ara</Text>
                </TouchableOpacity>

<TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => {
                    setDetailContact(null);
                    navigation.getParent()?.navigate('Mesajlar');
                  }}
                >
                  <View style={[styles.actionIcon, { backgroundColor: '#F5F3FF' }]}>
                    <Ionicons name="chatbubbles" size={22} color="#7C3AED" />
                  </View>
                  <Text style={styles.actionLabel}>Sohbet</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionBtn} onPress={() => openEdit(detailContact)}>
                  <View style={[styles.actionIcon, { backgroundColor: '#FEF3C7' }]}>
                    <Ionicons name="pencil" size={22} color="#D97706" />
                  </View>
                  <Text style={styles.actionLabel}>Düzenle</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(detailContact)}>
                  <View style={[styles.actionIcon, { backgroundColor: '#FEF2F2' }]}>
                    <Ionicons name="trash" size={22} color={colors.danger} />
                  </View>
                  <Text style={styles.actionLabel}>Sil</Text>
                </TouchableOpacity>
              </View>

              {/* Divider */}
              <View style={styles.divider} />

              {/* Detaylar section */}
              <Text style={styles.detailSectionTitle}>KİŞİ BİLGİLERİ</Text>
              <View style={styles.detailCard}>
                <DetailRow
                  icon="call-outline"
                  label="Telefon"
                  value={detailContact.phone}
                  iconColor={colors.business}
                  iconBg="#EFF6FF"
                />
                <View style={styles.detailCardDivider} />
                <DetailRow
                  icon="mail-outline"
                  label="E-posta"
                  value={detailContact.email}
                  iconColor="#7C3AED"
                  iconBg="#EDE9FE"
                />
                <View style={styles.detailCardDivider} />
                <DetailRow
                  icon="business-outline"
                  label="Şirket / İlan"
                  value={detailContact.company}
                  iconColor="#D97706"
                  iconBg="#FEF3C7"
                />
                <View style={styles.detailCardDivider} />
                <DetailRow
                  icon="document-text-outline"
                  label="Not"
                  value={detailContact.note}
                  iconColor="#16A34A"
                  iconBg="#F0FDF4"
                />
              </View>

              {/* Eklenme tarihi */}
              <Text style={styles.detailDate}>
                Eklenme: {new Date(detailContact.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}
              </Text>
            </View>
          )}
        </View>
      </Modal>

      {/* Add/Edit Modal */}
      <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={() => setShowAddModal(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.overlay}>
            <View style={[styles.sheet, { paddingBottom: 32 }]}>
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>{editTarget ? 'Kişiyi Düzenle' : 'Yeni Kişi'}</Text>
                <TouchableOpacity onPress={() => setShowAddModal(false)}>
                  <Ionicons name="close" size={24} color={colors.text.secondary} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {/* Type selector */}
                <Text style={styles.fieldLabel}>Tür</Text>
                <View style={styles.typeRow}>
                  {(['musteri', 'tedarikci'] as ContactType[]).map(t => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.typeChip, form.type === t && styles.typeChipActive]}
                      onPress={() => setForm(f => ({ ...f, type: t }))}
                    >
                      <Text style={[styles.typeChipText, form.type === t && styles.typeChipTextActive]}>
                        {TYPE_LABELS[t]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.fieldLabel}>Ad Soyad *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ad Soyad"
                  placeholderTextColor={colors.text.muted}
                  value={form.name}
                  onChangeText={v => setForm(f => ({ ...f, name: v }))}
                />

                <Text style={styles.fieldLabel}>Şirket</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Şirket adı"
                  placeholderTextColor={colors.text.muted}
                  value={form.company}
                  onChangeText={v => setForm(f => ({ ...f, company: v }))}
                />

                <Text style={styles.fieldLabel}>Telefon</Text>
                <TextInput
                  style={styles.input}
                  placeholder="05xx xxx xx xx"
                  placeholderTextColor={colors.text.muted}
                  value={form.phone}
                  onChangeText={v => setForm(f => ({ ...f, phone: v }))}
                  keyboardType="phone-pad"
                />

                <Text style={styles.fieldLabel}>E-posta</Text>
                <TextInput
                  style={styles.input}
                  placeholder="ornek@mail.com"
                  placeholderTextColor={colors.text.muted}
                  value={form.email}
                  onChangeText={v => setForm(f => ({ ...f, email: v }))}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <Text style={styles.fieldLabel}>Not</Text>
                <TextInput
                  style={[styles.input, styles.inputMulti]}
                  placeholder="Notlar..."
                  placeholderTextColor={colors.text.muted}
                  value={form.note}
                  onChangeText={v => setForm(f => ({ ...f, note: v }))}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />

                <TouchableOpacity
                  style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Kaydet</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddModal(false)}>
                  <Text style={styles.cancelBtnText}>İptal</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function DetailRow({ icon, label, value, iconColor, iconBg }: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value?: string;
  iconColor: string;
  iconBg: string;
}) {
  return (
    <View style={styles.detailCardRow}>
      <View style={[styles.detailCardIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={15} color={iconColor} />
      </View>
      <View style={styles.detailCardText}>
        <Text style={styles.detailCardLabel}>{label}</Text>
        <Text style={[styles.detailCardValue, !value && styles.detailCardEmpty]}>
          {value || '—'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: colors.text.primary },
  addBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  searchIcon: {},
  searchInput: {
    flex: 1, fontSize: 15, color: colors.text.primary, paddingVertical: 4,
  },

  filterRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  chip: {
    paddingHorizontal: 14, paddingVertical: 5,
    borderRadius: 99, backgroundColor: colors.background,
    borderWidth: 1, borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.business, borderColor: colors.business },
  chipText: { fontSize: 13, fontWeight: '500', color: colors.text.secondary },
  chipTextActive: { color: '#fff' },
  countText: { marginLeft: 'auto', fontSize: 12, color: colors.text.muted },

  contactRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card, borderRadius: 12,
    padding: 12, borderWidth: 1, borderColor: colors.border, gap: 12,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: '#fff' },
  contactInfo: { flex: 1, gap: 2 },
  contactName: { fontSize: 15, fontWeight: '600', color: colors.text.primary },
  contactSub: { fontSize: 12, color: colors.text.secondary },
  contactPhone: { fontSize: 12, color: colors.text.muted },
  contactRight: { alignItems: 'flex-end', gap: 8 },

  typeBadge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99,
  },
  typeText: { fontSize: 11, fontWeight: '600' },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.text.secondary },
  emptyBtn: {
    marginTop: 8, paddingHorizontal: 24, paddingVertical: 10,
    backgroundColor: colors.business, borderRadius: 10,
  },
  emptyBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, gap: 0,
  },

  detailAvatar: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
  },
  detailAvatarText: { fontSize: 22, fontWeight: '700', color: '#fff' },
  detailName: { fontSize: 16, fontWeight: '700', color: colors.text.primary },

  actionRow: {
    flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20,
  },
  actionBtn: { alignItems: 'center', gap: 6 },
  actionIcon: {
    width: 52, height: 52, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  actionLabel: { fontSize: 12, color: colors.text.secondary, fontWeight: '500' },

  detailFields: { gap: 12 },
  detailRow: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    backgroundColor: colors.background, borderRadius: 10, padding: 10,
  },
  detailFieldLabel: { fontSize: 11, color: colors.text.muted, marginBottom: 2 },
  detailFieldValue: { fontSize: 14, color: colors.text.primary, fontWeight: '500' },

  sheetHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16,
  },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: colors.text.primary },

  fieldLabel: { fontSize: 12, fontWeight: '600', color: colors.text.muted, marginBottom: 4, marginTop: 12 },

  typeRow: { flexDirection: 'row', gap: 10 },
  typeChip: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center',
  },
  typeChipActive: { backgroundColor: colors.business, borderColor: colors.business },
  typeChipText: { fontSize: 14, fontWeight: '600', color: colors.text.secondary },
  typeChipTextActive: { color: '#fff' },

  input: {
    backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 15, color: colors.text.primary,
  },
  inputMulti: { height: 80, paddingTop: 10 },

  saveBtn: {
    marginTop: 20, backgroundColor: colors.business, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  cancelBtn: { alignItems: 'center', paddingVertical: 12 },
  cancelBtnText: { fontSize: 15, color: colors.text.secondary, fontWeight: '500' },

  // Detail modal
  detailSheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 36,
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: colors.border, alignSelf: 'center', marginBottom: 16,
  },
  detailTop: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16,
  },
  detailTopText: { flex: 1 },
  detailCompany: { fontSize: 13, color: colors.text.secondary, marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.border, marginBottom: 14 },
  detailSectionTitle: {
    fontSize: 11, fontWeight: '700', color: colors.text.muted,
    letterSpacing: 0.8, marginBottom: 8,
  },
  detailCard: {
    backgroundColor: colors.background,
    borderRadius: 12, borderWidth: 1, borderColor: colors.border,
    overflow: 'hidden', marginBottom: 12,
  },
  detailCardDivider: { height: 1, backgroundColor: colors.border, marginLeft: 52 },
  detailCardRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12,
  },
  detailCardIcon: {
    width: 32, height: 32, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  detailCardText: { flex: 1 },
  detailCardLabel: { fontSize: 11, color: colors.text.muted, marginBottom: 2 },
  detailCardValue: { fontSize: 14, fontWeight: '500', color: colors.text.primary },
  detailCardEmpty: { color: colors.text.muted, fontWeight: '400' },
  detailDate: { fontSize: 11, color: colors.text.muted, textAlign: 'center', marginTop: 4 },
});
