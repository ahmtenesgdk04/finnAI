import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
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
  status: string;
  created_at: string;
  seller_name: string;
  user_id: string;
};

const CATEGORIES = [
  'Tümü', 'Tekstil', 'Gıda & İçecek', 'İnşaat Malzemesi', 'Elektronik',
  'Hammadde', 'Lojistik & Taşımacılık', 'Kimya & Plastik',
  'Ambalaj', 'Makine & Ekipman', 'Tarım & Hayvancılık', 'Diğer',
];

export default function PazaryeriListesiScreen({ navigation }: { navigation: any }) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('Tümü');

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (selectedCat !== 'Tümü') params.category = selectedCat;
      if (search.trim()) params.search = search.trim();
      const res = await marketplaceAPI.getAll(params);
      setListings(res.data);
    } catch {
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCat, search]);

  useFocusEffect(
    useCallback(() => {
      fetchListings();
    }, [fetchListings])
  );

  const renderCard = ({ item }: { item: Listing }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('IlanDetay', { listing: item, isOwner: false })}
      activeOpacity={0.75}
    >
      <View style={styles.cardTop}>
        <View style={styles.catBadge}>
          <Text style={styles.catBadgeText}>{item.category}</Text>
        </View>
        <Text style={styles.city}>
          <Ionicons name="location-outline" size={12} color={colors.text.muted} /> {item.city}
        </Text>
      </View>

      <Text style={styles.title} numberOfLines={2}>{item.title}</Text>

      {item.description ? (
        <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
      ) : null}

      <View style={styles.cardBottom}>
        <View>
          <Text style={styles.price}>
            {Number(item.unit_price).toLocaleString('tr-TR')} {item.currency}
          </Text>
          <Text style={styles.unit}>/ {item.unit} · min {item.min_order_qty} {item.unit}</Text>
        </View>
        <View style={styles.sellerWrap}>
          <Ionicons name="business-outline" size={13} color={colors.text.muted} />
          <Text style={styles.seller} numberOfLines={1}>{item.seller_name}</Text>
        </View>
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
        <Text style={styles.headerTitle}>Pazaryeri İlanları</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Arama */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={colors.text.muted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="İlan ara..."
          placeholderTextColor={colors.text.muted}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={fetchListings}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => { setSearch(''); }}>
            <Ionicons name="close-circle" size={18} color={colors.text.muted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Kategori filtresi */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.catScroll}
      >
        <View style={styles.catContent}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.catChip, selectedCat === cat && styles.catChipActive]}
              onPress={() => setSelectedCat(cat)}
            >
              <Text style={[styles.catChipText, selectedCat === cat && styles.catChipTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.business} />
        </View>
      ) : listings.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="storefront-outline" size={48} color={colors.text.muted} />
          <Text style={styles.emptyText}>İlan bulunamadı</Text>
        </View>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={i => i.id}
          renderItem={renderCard}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
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

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
    height: 44,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: colors.text.primary },

  catScroll: { marginTop: 10, flexGrow: 0, flexShrink: 0 },
  catContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 8,
  },
  catChip: {
    flexShrink: 0,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  catChipActive: { backgroundColor: colors.business, borderColor: colors.business },
  catChipText: { fontSize: 13, color: colors.text.secondary, fontWeight: '500' },
  catChipTextActive: { color: '#fff' },

  list: { padding: 16, gap: 12, paddingBottom: 40 },

  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  catBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  catBadgeText: { fontSize: 11, fontWeight: '600', color: colors.business },
  city: { fontSize: 12, color: colors.text.muted },

  title: { fontSize: 15, fontWeight: '700', color: colors.text.primary, lineHeight: 21 },
  desc: { fontSize: 13, color: colors.text.secondary, lineHeight: 19 },

  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 4 },
  price: { fontSize: 17, fontWeight: '700', color: colors.business },
  unit: { fontSize: 12, color: colors.text.muted, marginTop: 2 },
  sellerWrap: { flexDirection: 'row', alignItems: 'center', gap: 4, maxWidth: '45%' },
  seller: { fontSize: 12, color: colors.text.secondary, flexShrink: 1 },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { fontSize: 16, color: colors.text.muted },
});
