import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { ordersAPI } from '../../services/api';

type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

type Order = {
  id: string;
  user_id: string;
  role: 'buyer' | 'seller';
  other_party_name: string;
  product_name: string;
  quantity: string;
  unit: string | null;
  unit_price: string;
  currency: string;
  total_price: string;
  status: OrderStatus;
  note: string | null;
  created_at: string;
};

const STATUS_INFO: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  pending:   { label: 'Beklemede',     color: '#94A3B8', bg: '#F1F5F9' },
  confirmed: { label: 'Onaylandı',     color: '#3B82F6', bg: '#EFF6FF' },
  shipped:   { label: 'Kargoda',       color: '#F97316', bg: '#FFF7ED' },
  delivered: { label: 'Teslim Edildi', color: '#10B981', bg: '#ECFDF5' },
  cancelled: { label: 'İptal Edildi',  color: '#EF4444', bg: '#FEF2F2' },
};

const STATUS_ORDER: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

export default function SiparislerimScreen({ navigation }: { navigation: any }) {
  const [activeTab, setActiveTab] = useState<'buyer' | 'seller'>('buyer');
  const [buyerOrders, setBuyerOrders] = useState<Order[]>([]);
  const [sellerOrders, setSellerOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const [statusModal, setStatusModal] = useState<{ visible: boolean; order: Order | null }>({
    visible: false,
    order: null,
  });

  const orders = activeTab === 'buyer' ? buyerOrders : sellerOrders;

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const [buyerRes, sellerRes] = await Promise.all([
        ordersAPI.getOrders('buyer'),
        ordersAPI.getOrders('seller'),
      ]);
      setBuyerOrders(buyerRes.data);
      setSellerOrders(sellerRes.data);
    } catch {
      // sessizce geç
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    fetchOrders();
  }, [fetchOrders]));

  const handleLongPress = (order: Order) => {
    Alert.alert(
      order.product_name,
      'Ne yapmak istiyorsunuz?',
      [
        ...(order.role === 'seller'
          ? [{ text: 'Durumu Güncelle', onPress: () => setStatusModal({ visible: true, order }) }]
          : []),
        { text: 'Sil', style: 'destructive' as const, onPress: () => confirmDelete(order) },
        { text: 'İptal', style: 'cancel' as const },
      ]
    );
  };

  const confirmDelete = (order: Order) => {
    Alert.alert(
      'Siparişi Sil',
      `"${order.product_name}" siparişini silmek istiyor musunuz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await ordersAPI.deleteOrder(order.id);
              if (order.role === 'buyer') {
                setBuyerOrders(prev => prev.filter(o => o.id !== order.id));
              } else {
                setSellerOrders(prev => prev.filter(o => o.id !== order.id));
              }
            } catch {
              Alert.alert('Hata', 'Sipariş silinemedi.');
            }
          },
        },
      ]
    );
  };

  const handleStatusUpdate = async (status: OrderStatus) => {
    if (!statusModal.order) return;
    try {
      const res = await ordersAPI.updateStatus(statusModal.order.id, status);
      const updated: Order = res.data;
      if (updated.role === 'buyer') {
        setBuyerOrders(prev => prev.map(o => (o.id === updated.id ? updated : o)));
      } else {
        setSellerOrders(prev => prev.map(o => (o.id === updated.id ? updated : o)));
      }
      setStatusModal({ visible: false, order: null });
    } catch {
      Alert.alert('Hata', 'Durum güncellenemedi.');
    }
  };

  const renderOrder = ({ item }: { item: Order }) => {
    const st = STATUS_INFO[item.status];
    const total = Number(item.total_price).toLocaleString('tr-TR', { minimumFractionDigits: 2 });
    const date = new Date(item.created_at).toLocaleDateString('tr-TR', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
    return (
      <TouchableOpacity
        style={styles.card}
        onLongPress={() => handleLongPress(item)}
        delayLongPress={500}
        activeOpacity={0.85}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.productName} numberOfLines={1}>{item.product_name}</Text>
          <View style={[styles.badge, { backgroundColor: st.bg }]}>
            <Text style={[styles.badgeText, { color: st.color }]}>{st.label}</Text>
          </View>
        </View>
        <Text style={styles.partyLabel}>
          {activeTab === 'buyer' ? 'Satıcı: ' : 'Alıcı: '}
          <Text style={styles.partyName}>{item.other_party_name}</Text>
        </Text>
        <View style={styles.cardFooter}>
          <Text style={styles.qty}>
            {Number(item.quantity).toLocaleString('tr-TR')}
            {item.unit ? ` ${item.unit}` : ''} × {Number(item.unit_price).toLocaleString('tr-TR')} {item.currency}
          </Text>
          <Text style={styles.total}>{total} {item.currency}</Text>
        </View>
        {item.note ? (
          <Text style={styles.noteText} numberOfLines={1}>{item.note}</Text>
        ) : null}
        <Text style={styles.dateText}>{date}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Siparişlerim</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['buyer', 'seller'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'buyer' ? 'Verdiğim' : 'Aldığım'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.business} />
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons
            name={activeTab === 'buyer' ? 'storefront-outline' : 'cube-outline'}
            size={52}
            color={colors.text.muted}
          />
          <Text style={styles.emptyTitle}>
            {activeTab === 'buyer' ? 'Verilen sipariş yok' : 'Alınan sipariş yok'}
          </Text>
          <Text style={styles.emptyDesc}>
            {activeTab === 'buyer'
              ? 'Pazaryerinde bir ilana girerek sipariş ver.'
              : 'Pazaryerinden gelen siparişler burada görünür.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={i => i.id}
          renderItem={renderOrder}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      )}

      {/* Durum Güncelle Modal */}
      <Modal
        visible={statusModal.visible}
        animationType="slide"
        transparent
        onRequestClose={() => setStatusModal({ visible: false, order: null })}
      >
        <TouchableOpacity
          style={styles.overlay}
          onPress={() => setStatusModal({ visible: false, order: null })}
        />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Durum Güncelle</Text>
          {STATUS_ORDER.map(st => {
            const info = STATUS_INFO[st];
            const isCurrent = statusModal.order?.status === st;
            return (
              <TouchableOpacity
                key={st}
                style={[styles.statusItem, isCurrent && { backgroundColor: info.bg }]}
                onPress={() => handleStatusUpdate(st)}
                disabled={isCurrent}
              >
                <View style={[styles.statusDot, { backgroundColor: info.color }]} />
                <Text style={[styles.statusItemText, { color: isCurrent ? info.color : colors.text.primary }]}>
                  {info.label}
                </Text>
                {isCurrent && <Ionicons name="checkmark" size={18} color={info.color} />}
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => setStatusModal({ visible: false, order: null })}
          >
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
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 13,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: colors.business },
  tabText: { fontSize: 14, fontWeight: '600', color: colors.text.muted },
  tabTextActive: { color: colors.business },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 32 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.text.primary },
  emptyDesc: { fontSize: 13, color: colors.text.secondary, textAlign: 'center' },

  list: { padding: 16, paddingBottom: 32 },

  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  productName: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.text.primary },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  partyLabel: { fontSize: 13, color: colors.text.secondary },
  partyName: { fontWeight: '600', color: colors.text.primary },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  qty: { fontSize: 13, color: colors.text.secondary },
  total: { fontSize: 15, fontWeight: '700', color: colors.business },
  noteText: { fontSize: 12, color: colors.text.muted, fontStyle: 'italic' },
  dateText: { fontSize: 11, color: colors.text.muted },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetTitle: { fontSize: 17, fontWeight: '700', color: colors.text.primary, marginBottom: 16 },

  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 10,
    marginVertical: 2,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusItemText: { flex: 1, fontSize: 15, fontWeight: '600' },
  cancelBtn: { alignItems: 'center', padding: 14, marginTop: 4 },
  cancelText: { fontSize: 15, color: colors.text.secondary, fontWeight: '500' },
});
