import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../../constants/colors';
import { marketplaceAPI, messagesAPI, ordersAPI } from '../../services/api';

const CONTACTS_KEY = 'business_contacts';

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
  user_id?: string;
  seller_name?: string;
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
  const [msgLoading, setMsgLoading] = useState(false);
  const [orderModal, setOrderModal] = useState(false);
  const [orderStep, setOrderStep] = useState<1 | 2 | 3>(1);
  const [orderQty, setOrderQty] = useState('');
  const [orderNote, setOrderNote] = useState('');
  const [orderPayMethod, setOrderPayMethod] = useState<'havale' | 'kart' | 'kapida'>('havale');
  const [orderSaving, setOrderSaving] = useState(false);
  const [addedToContacts, setAddedToContacts] = useState(false);
  const isOwner = route.params.isOwner !== false;

  useEffect(() => {
    if (!listing.seller_name || isOwner) return;
    AsyncStorage.getItem(CONTACTS_KEY).then(raw => {
      if (!raw) return;
      const list = JSON.parse(raw);
      const exists = list.some(
        (c: { type: string; name: string }) =>
          c.type === 'tedarikci' && c.name === listing.seller_name
      );
      setAddedToContacts(exists);
    });
  }, []);

  const handleAddToContacts = async () => {
    try {
      const raw = await AsyncStorage.getItem(CONTACTS_KEY);
      const list = raw ? JSON.parse(raw) : [];
      const exists = list.some(
        (c: { type: string; name: string }) =>
          c.type === 'tedarikci' && c.name === listing.seller_name
      );
      if (exists) {
        Alert.alert('Zaten Rehberde', `"${listing.seller_name}" rehberinizde tedarikçi olarak kayıtlı.`);
        return;
      }
      Alert.alert(
        'Rehbere Ekle',
        `"${listing.seller_name}" kişisini tedarikçi olarak rehberinize eklemek istiyor musunuz?\n\nTelefon ve e-posta bilgileri görüntülenemediği için boş kalacaktır.`,
        [
          { text: 'İptal', style: 'cancel' },
          {
            text: 'Ekle',
            onPress: async () => {
              try {
                const newContact = {
                  id: Date.now().toString(),
                  name: listing.seller_name || 'Bilinmiyor',
                  company: listing.title,
                  phone: '',
                  email: '',
                  note: `${listing.category} · ${listing.city}`,
                  type: 'tedarikci',
                  createdAt: new Date().toISOString(),
                };
                list.unshift(newContact);
                await AsyncStorage.setItem(CONTACTS_KEY, JSON.stringify(list));
                setAddedToContacts(true);
                Alert.alert('Eklendi', `"${listing.seller_name}" rehberinize kaydedildi.`);
              } catch {
                Alert.alert('Hata', 'Rehbere eklenemedi.');
              }
            },
          },
        ]
      );
    } catch {
      Alert.alert('Hata', 'Rehbere eklenemedi.');
    }
  };

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

  const handleMessage = async () => {
    if (!listing.user_id) return;
    setMsgLoading(true);
    try {
      const res = await messagesAPI.startOrGetConversation(listing.id, listing.user_id);
      navigation.navigate('Mesajlar', {
        screen: 'Chat',
        params: {
          conversationId: res.data.id,
          listingTitle: listing.title,
          otherName: listing.seller_name || 'Satıcı',
        },
      });
    } catch {
      Alert.alert('Hata', 'Mesaj başlatılamadı, tekrar deneyin.');
    } finally {
      setMsgLoading(false);
    }
  };

  const PAY_LABELS: Record<string, string> = {
    havale: 'Banka Havalesi / EFT',
    kart: 'Kredi / Banka Kartı',
    kapida: 'Kapıda Ödeme',
  };

  const resetOrder = () => {
    setOrderModal(false);
    setOrderStep(1);
    setOrderQty('');
    setOrderNote('');
    setOrderPayMethod('havale');
  };

  const handleStep1Next = () => {
    const qty = Number(orderQty);
    if (!orderQty || qty <= 0) {
      Alert.alert('Hata', 'Geçerli bir miktar giriniz.');
      return;
    }
    if (qty < Number(listing.min_order_qty)) {
      Alert.alert(
        'Yetersiz Miktar',
        `Minimum sipariş miktarı ${listing.min_order_qty} ${listing.unit}'dir.`
      );
      return;
    }
    setOrderStep(2);
  };

  const handleCreateOrder = async () => {
    const qty = Number(orderQty);
    const noteparts = [orderNote.trim(), `Ödeme: ${PAY_LABELS[orderPayMethod]}`].filter(Boolean);
    setOrderSaving(true);
    try {
      await ordersAPI.create({
        role: 'buyer',
        otherPartyName: listing.seller_name || 'Satıcı',
        productName: listing.title,
        quantity: qty,
        unit: listing.unit,
        unitPrice: Number(listing.unit_price),
        currency: listing.currency,
        note: noteparts.join(' — '),
      });
      resetOrder();
      Alert.alert('Sipariş Oluşturuldu', '"Siparişlerim" bölümünden takip edebilirsiniz.');
    } catch {
      Alert.alert('Hata', 'Sipariş oluşturulamadı, tekrar deneyin.');
    } finally {
      setOrderSaving(false);
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

        {/* Aksiyonlar — alıcı */}
        {!isOwner && listing.user_id && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.orderBtn}
              onPress={() => setOrderModal(true)}
            >
              <Ionicons name="bag-add-outline" size={18} color="#fff" />
              <Text style={styles.orderBtnText}>Sipariş Ver</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.msgBtn}
              onPress={handleMessage}
              disabled={msgLoading}
            >
              {msgLoading ? (
                <ActivityIndicator color={colors.business} />
              ) : (
                <>
                  <Ionicons name="chatbubble-outline" size={18} color={colors.business} />
                  <Text style={styles.msgBtnText}>Mesaj Gönder</Text>
                </>
              )}
            </TouchableOpacity>
            {listing.seller_name ? (
              <TouchableOpacity
                style={[styles.contactSaveBtn, addedToContacts && styles.contactSaveBtnDone]}
                onPress={handleAddToContacts}
              >
                <Ionicons
                  name={addedToContacts ? 'checkmark-circle-outline' : 'person-add-outline'}
                  size={18}
                  color={addedToContacts ? '#16A34A' : colors.text.secondary}
                />
                <Text style={[styles.contactSaveBtnText, addedToContacts && { color: '#16A34A' }]}>
                  {addedToContacts ? 'Rehberde Kayıtlı' : 'Rehbere Ekle'}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}

        {/* Aksiyonlar — ilan sahibi */}
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

      {/* Sipariş Ver Modal — 3 adım */}
      <Modal
        visible={orderModal}
        animationType="slide"
        transparent
        onRequestClose={resetOrder}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={resetOrder} />
          <View style={[styles.sheet, { maxHeight: '92%', gap: 0 }]}>
            <View style={styles.sheetHandle} />

            {/* Adım göstergesi */}
            <View style={styles.stepRow}>
              {(['Bilgiler', 'Özet', 'Ödeme'] as const).map((label, i) => {
                const step = i + 1;
                const done = orderStep > step;
                const active = orderStep >= step;
                return (
                  <React.Fragment key={step}>
                    <View style={styles.stepItem}>
                      <View style={[styles.stepCircle, active && styles.stepCircleActive]}>
                        {done
                          ? <Ionicons name="checkmark" size={11} color="#fff" />
                          : <Text style={[styles.stepNum, active && styles.stepNumActive]}>{step}</Text>
                        }
                      </View>
                      <Text style={[styles.stepLabel, active && styles.stepLabelActive]}>{label}</Text>
                    </View>
                    {i < 2 && <View style={[styles.stepLine, done && styles.stepLineActive]} />}
                  </React.Fragment>
                );
              })}
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 16 }}>

              {/* ADIM 1 — Sipariş Bilgileri */}
              {orderStep === 1 && (
                <View>
                  <View style={styles.orderSummary}>
                    <Text style={styles.orderSummaryTitle} numberOfLines={2}>{listing.title}</Text>
                    <Text style={styles.orderSummaryMeta}>Satıcı: {listing.seller_name || 'Bilinmiyor'}</Text>
                    <Text style={styles.orderSummaryPrice}>
                      {Number(listing.unit_price).toLocaleString('tr-TR')} {listing.currency} / {listing.unit}
                    </Text>
                  </View>

                  <Text style={styles.orderFieldLabel}>
                    Miktar ({listing.unit}) · Min: {listing.min_order_qty}
                  </Text>
                  <TextInput
                    style={styles.orderInput}
                    placeholder={`En az ${listing.min_order_qty} ${listing.unit}`}
                    placeholderTextColor={colors.text.muted}
                    keyboardType="numeric"
                    value={orderQty}
                    onChangeText={setOrderQty}
                  />

                  {orderQty && Number(orderQty) > 0 ? (
                    Number(orderQty) < Number(listing.min_order_qty) ? (
                      <Text style={[styles.orderTotal, { color: colors.danger }]}>
                        Min. {listing.min_order_qty} {listing.unit} sipariş verebilirsiniz
                      </Text>
                    ) : (
                      <Text style={styles.orderTotal}>
                        Toplam: {(Number(orderQty) * Number(listing.unit_price)).toLocaleString('tr-TR')} {listing.currency}
                      </Text>
                    )
                  ) : null}

                  <Text style={styles.orderFieldLabel}>Not (opsiyonel)</Text>
                  <TextInput
                    style={[styles.orderInput, { height: 72, textAlignVertical: 'top' }]}
                    placeholder="Teslimat adresi, özel istek..."
                    placeholderTextColor={colors.text.muted}
                    multiline
                    value={orderNote}
                    onChangeText={setOrderNote}
                  />

                  <TouchableOpacity style={styles.orderNextBtn} onPress={handleStep1Next}>
                    <Text style={styles.orderSaveBtnText}>Devam Et</Text>
                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}

              {/* ADIM 2 — Sipariş Özeti */}
              {orderStep === 2 && (
                <View>
                  <Text style={styles.summaryHeading}>Sipariş Özeti</Text>
                  {([
                    ['Ürün / Hizmet', listing.title],
                    ['Satıcı', listing.seller_name || 'Bilinmiyor'],
                    ['Miktar', `${Number(orderQty).toLocaleString('tr-TR')} ${listing.unit}`],
                    ['Birim Fiyat', `${Number(listing.unit_price).toLocaleString('tr-TR')} ${listing.currency}`],
                    ['Toplam', `${(Number(orderQty) * Number(listing.unit_price)).toLocaleString('tr-TR')} ${listing.currency}`],
                  ] as [string, string][]).map(([label, value]) => (
                    <View key={label} style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>{label}</Text>
                      <Text style={[styles.summaryValue, label === 'Toplam' && styles.summaryTotal]}>
                        {value}
                      </Text>
                    </View>
                  ))}
                  {orderNote ? (
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Not</Text>
                      <Text style={[styles.summaryValue, { flex: 2 }]}>{orderNote}</Text>
                    </View>
                  ) : null}

                  <View style={styles.stepBtnRow}>
                    <TouchableOpacity style={styles.backStepBtn} onPress={() => setOrderStep(1)}>
                      <Ionicons name="arrow-back" size={18} color={colors.business} />
                      <Text style={styles.backStepBtnText}>Geri</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.orderNextBtn, { flex: 1 }]} onPress={() => setOrderStep(3)}>
                      <Text style={styles.orderSaveBtnText}>Ödemeye Geç</Text>
                      <Ionicons name="arrow-forward" size={18} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* ADIM 3 — Ödeme */}
              {orderStep === 3 && (
                <View>
                  <Text style={styles.summaryHeading}>Ödeme Yöntemi</Text>
                  {([
                    { key: 'havale', label: 'Banka Havalesi / EFT', icon: 'business-outline' },
                    { key: 'kart',   label: 'Kredi / Banka Kartı',  icon: 'card-outline' },
                    { key: 'kapida', label: 'Kapıda Ödeme',         icon: 'cash-outline' },
                  ] as const).map(opt => (
                    <TouchableOpacity
                      key={opt.key}
                      style={[styles.payOption, orderPayMethod === opt.key && styles.payOptionActive]}
                      onPress={() => setOrderPayMethod(opt.key)}
                    >
                      <Ionicons
                        name={opt.icon}
                        size={22}
                        color={orderPayMethod === opt.key ? colors.business : colors.text.secondary}
                      />
                      <Text style={[styles.payOptionText, orderPayMethod === opt.key && { color: colors.business }]}>
                        {opt.label}
                      </Text>
                      <View style={[styles.payRadio, orderPayMethod === opt.key && styles.payRadioActive]}>
                        {orderPayMethod === opt.key && <View style={styles.payRadioDot} />}
                      </View>
                    </TouchableOpacity>
                  ))}

                  <View style={styles.payNote}>
                    <Ionicons name="information-circle-outline" size={15} color={colors.text.muted} />
                    <Text style={styles.payNoteText}>
                      Ödeme detayları satıcıya iletilecektir. Detaylar için satıcıyla iletişime geçin.
                    </Text>
                  </View>

                  <View style={styles.stepBtnRow}>
                    <TouchableOpacity style={styles.backStepBtn} onPress={() => setOrderStep(2)}>
                      <Ionicons name="arrow-back" size={18} color={colors.business} />
                      <Text style={styles.backStepBtnText}>Geri</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.orderNextBtn, { flex: 1 }, orderSaving && { opacity: 0.6 }]}
                      onPress={handleCreateOrder}
                      disabled={orderSaving}
                    >
                      {orderSaving ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <>
                          <Text style={styles.orderSaveBtnText}>Siparişi Tamamla</Text>
                          <Ionicons name="checkmark-circle" size={18} color="#fff" />
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <View style={{ height: 32 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

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
  orderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 15,
    borderRadius: 12,
    backgroundColor: colors.business,
  },
  orderBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  msgBtn: {
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
  msgBtnText: { fontSize: 15, fontWeight: '600', color: colors.business },
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

  contactSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 13,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  contactSaveBtnDone: {
    borderColor: '#86EFAC',
    backgroundColor: '#F0FDF4',
  },
  contactSaveBtnText: { fontSize: 14, fontWeight: '600', color: colors.text.secondary },

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

  orderSummary: {
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    gap: 4,
  },
  orderSummaryTitle: { fontSize: 15, fontWeight: '700', color: colors.text.primary },
  orderSummaryMeta: { fontSize: 13, color: colors.text.secondary },
  orderSummaryPrice: { fontSize: 14, fontWeight: '600', color: colors.business, marginTop: 2 },
  orderSummaryMin: { fontSize: 12, color: colors.text.muted },
  orderFieldLabel: { fontSize: 12, fontWeight: '600', color: colors.text.muted, marginBottom: 6 },
  orderInput: {
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  orderTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.business,
    textAlign: 'right',
    marginBottom: 12,
    marginTop: -4,
  },
  orderNextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.business,
    borderRadius: 12,
    padding: 15,
    marginTop: 4,
  },
  orderSaveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  stepItem: { alignItems: 'center', gap: 4 },
  stepCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  stepCircleActive: { borderColor: colors.business, backgroundColor: colors.business },
  stepNum: { fontSize: 11, fontWeight: '700', color: colors.text.muted },
  stepNumActive: { color: '#fff' },
  stepLabel: { fontSize: 10, fontWeight: '600', color: colors.text.muted },
  stepLabelActive: { color: colors.business },
  stepLine: { flex: 1, height: 2, backgroundColor: colors.border, marginBottom: 16, marginHorizontal: 4 },
  stepLineActive: { backgroundColor: colors.business },

  summaryHeading: { fontSize: 15, fontWeight: '700', color: colors.text.primary, marginBottom: 14 },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryLabel: { fontSize: 13, color: colors.text.secondary, flex: 1 },
  summaryValue: { fontSize: 13, fontWeight: '600', color: colors.text.primary, textAlign: 'right', flex: 1.5 },
  summaryTotal: { color: colors.business, fontSize: 15, fontWeight: '700' },

  stepBtnRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  backStepBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: colors.business,
    borderRadius: 12,
    padding: 15,
    paddingHorizontal: 18,
  },
  backStepBtnText: { fontSize: 14, fontWeight: '600', color: colors.business },

  payOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
    marginBottom: 10,
  },
  payOptionActive: { borderColor: colors.business, backgroundColor: colors.primaryLight },
  payOptionText: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.text.secondary },
  payRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payRadioActive: { borderColor: colors.business },
  payRadioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.business },

  payNote: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    marginBottom: 4,
    alignItems: 'flex-start',
  },
  payNoteText: { flex: 1, fontSize: 12, color: colors.text.muted, lineHeight: 18 },
});
