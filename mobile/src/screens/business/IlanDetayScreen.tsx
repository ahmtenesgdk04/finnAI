import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { marketplaceAPI } from '../../services/api';

type Listing = {
  id: string;
  title: string;
  category: string;
  description?: string;
  city: string;
  unit_price: number;
  currency: string;
  unit: string;
  min_order_qty: number;
  total_stock?: number;
  delivery_time?: string;
  delivery_method?: string;
  payment_terms?: string;
  contact_preference: string[];
  status: 'active' | 'passive' | 'sold';
  created_at: string;
};

const STATUS_INFO: Record<string, { label: string; color: string; bg: string }> = {
  active:  { label: 'Aktif',   color: '#10B981', bg: '#ECFDF5' },
  passive: { label: 'Pasif',   color: '#94A3B8', bg: '#F1F5F9' },
  sold:    { label: 'Satıldı', color: '#F97316', bg: '#FFF7ED' },
};

const CONTACT_LABELS: Record<string, string> = {
  phone: 'Telefon',
  whatsapp: 'WhatsApp',
  email: 'E-posta',
  inApp: 'Uygulama içi mesaj',
};

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

export default function IlanDetayScreen({ route, navigation }: { route: any; navigation: any }) {
  const [listing, setListing] = useState<Listing>(route.params.listing);
  const [statusLoading, setStatusLoading] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const isOwner = route.params.isOwner !== false;

  const s = STATUS_INFO[listing.status];
  const dateStr = new Date(listing.created_at).toLocaleDateString('tr-TR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  const handleStatusChange = async (status: 'active' | 'passive' | 'sold') => {
    setMenuVisible(false);
    setStatusLoading(true);
    try {
      await marketplaceAPI.updateStatus(listing.id, status);
      setListing(prev => ({ ...prev, status }));
    } catch {
      Alert.alert('Hata', 'Durum güncellenemedi.');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'İlanı Sil',
      `"${listing.title}" ilanını silmek istediğinize emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await marketplaceAPI.remove(listing.id);
              navigation.goBack();
            } catch {
              Alert.alert('Hata', 'İlan silinemedi.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>İlan Detayı</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* İlan başlığı + durum */}
        <View style={styles.titleCard}>
          <View style={styles.titleRow}>
            <Text style={styles.ilanTitle}>{listing.title}</Text>
            <View style={[styles.badge, { backgroundColor: s.bg }]}>
              <Text style={[styles.badgeText, { color: s.color }]}>{s.label}</Text>
            </View>
          </View>
          <Text style={styles.ilanMeta}>{listing.category} · {listing.city} · {dateStr}</Text>
        </View>

        {/* Fiyat & Miktar */}
        <Section title="Fiyat & Miktar">
          <InfoRow
            label="Birim Fiyat"
            value={`${Number(listing.unit_price).toLocaleString('tr-TR')} ${listing.currency} / ${listing.unit}`}
          />
          <InfoRow label="Minimum Sipariş" value={`${listing.min_order_qty} ${listing.unit}`} />
          {listing.total_stock != null && (
            <InfoRow label="Toplam Stok" value={`${listing.total_stock} ${listing.unit}`} />
          )}
        </Section>

        {/* Ürün Bilgileri */}
        {listing.description ? (
          <Section title="Açıklama">
            <Text style={styles.descText}>{listing.description}</Text>
          </Section>
        ) : null}

        {/* Teslimat */}
        {(listing.delivery_time || listing.delivery_method || listing.payment_terms) ? (
          <Section title="Teslimat & Ödeme">
            <InfoRow label="Teslimat Süresi" value={listing.delivery_time} />
            <InfoRow label="Teslimat Şekli" value={listing.delivery_method} />
            <InfoRow label="Ödeme Koşulu" value={listing.payment_terms} />
          </Section>
        ) : null}

        {/* İletişim */}
        {listing.contact_preference?.length > 0 && (
          <Section title="İletişim Tercihleri">
            <View style={styles.chipRow}>
              {listing.contact_preference.map(c => (
                <View key={c} style={styles.chip}>
                  <Text style={styles.chipText}>{CONTACT_LABELS[c] ?? c}</Text>
                </View>
              ))}
            </View>
          </Section>
        )}

        {/* Aksiyonlar */}
        {isOwner && <View style={styles.actions}>
          <TouchableOpacity
            style={styles.statusBtn}
            onPress={() => setMenuVisible(true)}
            disabled={statusLoading}
          >
            {statusLoading ? (
              <ActivityIndicator color={colors.business} />
            ) : (
              <>
                <Ionicons name="swap-horizontal-outline" size={18} color={colors.business} />
                <Text style={styles.statusBtnText}>Durumu Değiştir</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={18} color={colors.danger} />
            <Text style={styles.deleteBtnText}>İlanı Sil</Text>
          </TouchableOpacity>
        </View>}
      </ScrollView>

      {/* Durum Seçim Modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Durum Seç</Text>

          {(['active', 'passive', 'sold'] as const).map(st => {
            const info = STATUS_INFO[st];
            const isCurrent = listing.status === st;
            return (
              <TouchableOpacity
                key={st}
                style={[styles.sheetItem, isCurrent && { backgroundColor: info.bg }]}
                onPress={() => handleStatusChange(st)}
                disabled={isCurrent}
              >
                <View style={[styles.sheetDot, { backgroundColor: info.color }]} />
                <Text style={[styles.sheetItemText, { color: isCurrent ? info.color : colors.text.primary }]}>
                  {info.label}
                </Text>
                {isCurrent && <Ionicons name="checkmark" size={18} color={info.color} />}
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity style={styles.cancelBtn} onPress={() => setMenuVisible(false)}>
            <Text style={styles.cancelText}>İptal</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: colors.text.primary, flex: 1, textAlign: 'center' },

  content: { padding: 16, gap: 12, paddingBottom: 40 },

  titleCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 6 },
  ilanTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: colors.text.primary },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  ilanMeta: { fontSize: 12, color: colors.text.secondary },

  section: { gap: 6 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: colors.text.muted, paddingHorizontal: 4 },
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },

  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  infoLabel: { fontSize: 13, color: colors.text.secondary, flex: 1 },
  infoValue: { fontSize: 13, fontWeight: '600', color: colors.text.primary, textAlign: 'right', flex: 1.5 },

  descText: { fontSize: 14, color: colors.text.primary, lineHeight: 21 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.primaryLight,
    borderRadius: 20,
  },
  chipText: { fontSize: 13, color: colors.business, fontWeight: '500' },

  actions: { gap: 10, marginTop: 4 },
  statusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.business,
    backgroundColor: colors.primaryLight,
  },
  statusBtnText: { fontSize: 15, fontWeight: '600', color: colors.business },

  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 15,
    borderRadius: 12,
    backgroundColor: colors.errorLight,
  },
  deleteBtnText: { fontSize: 15, fontWeight: '600', color: colors.danger },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
    gap: 4,
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: colors.text.primary, marginBottom: 8 },
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 10,
    marginVertical: 2,
  },
  sheetDot: { width: 10, height: 10, borderRadius: 5 },
  sheetItemText: { flex: 1, fontSize: 15, fontWeight: '600' },
  cancelBtn: { alignItems: 'center', padding: 14, marginTop: 4 },
  cancelText: { fontSize: 15, color: colors.text.secondary, fontWeight: '500' },
});
