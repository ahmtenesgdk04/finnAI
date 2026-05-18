import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
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

export default function IlanlarimScreen({ navigation }: { navigation: any }) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchListings = async () => {
    try {
      const res = await marketplaceAPI.getMine();
      setListings(res.data);
    } catch {
      Alert.alert('Hata', 'İlanlar yüklenemedi.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchListings();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchListings();
  };

  const renderItem = ({ item }: { item: Listing }) => {
    const s = STATUS_INFO[item.status];
    const dateStr = new Date(item.created_at).toLocaleDateString('tr-TR', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('IlanDetay', { listing: item })}
        activeOpacity={0.75}
      >
        <View style={styles.cardTop}>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.cardMeta}>{item.category} · {item.city}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: s.bg }]}>
            <Text style={[styles.badgeText, { color: s.color }]}>{s.label}</Text>
          </View>
        </View>

        <View style={styles.cardBottom}>
          <View>
            <Text style={styles.price}>
              {Number(item.unit_price).toLocaleString('tr-TR')} {item.currency} / {item.unit}
            </Text>
            <Text style={styles.minQty}>Min. {item.min_order_qty} {item.unit} · {dateStr}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.text.muted} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>İlanlarım</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color={colors.business} size="large" />
      ) : (
        <FlatList
          data={listings}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={listings.length === 0 ? styles.emptyContainer : styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.business} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="list-outline" size={56} color={colors.border} />
              <Text style={styles.emptyTitle}>Henüz ilanınız yok</Text>
              <Text style={styles.emptySub}>İlan Ver'e tıklayarak ilk ilanınızı oluşturun</Text>
            </View>
          }
        />
      )}
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
  headerTitle: { fontSize: 17, fontWeight: '700', color: colors.text.primary },

  listContent: { padding: 16, gap: 12 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },

  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  cardInfo: { flex: 1, marginRight: 8 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text.primary, marginBottom: 3 },
  cardMeta: { fontSize: 12, color: colors.text.secondary },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: '600' },

  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  price: { fontSize: 14, fontWeight: '700', color: colors.business },
  minQty: { fontSize: 11, color: colors.text.muted, marginTop: 2 },

  empty: { alignItems: 'center', gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.text.primary },
  emptySub: { fontSize: 13, color: colors.text.secondary, textAlign: 'center' },
});
