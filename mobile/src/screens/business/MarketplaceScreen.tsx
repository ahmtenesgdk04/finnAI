import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { theme } from '../../constants/theme';

const MENU_ITEMS = [
  {
    title: 'Pazaryeri',
    sub: 'Diğer işletmelerin ilanlarını incele',
    icon: 'storefront-outline' as const,
    bg: '#FFF7ED',
    color: '#F97316',
    route: 'PazaryeriListesi',
  },
  {
    title: 'İlan Ver',
    sub: 'Ürün veya hizmetini toplu sat',
    icon: 'add-circle-outline' as const,
    bg: colors.primaryLight,
    color: colors.business,
    route: 'IlanVer',
  },
  {
    title: 'İlanlarım',
    sub: 'Yayınladığın ilanları yönet',
    icon: 'list-outline' as const,
    bg: '#F5F3FF',
    color: '#8B5CF6',
    route: 'Ilanlarim',
  },
  {
    title: 'Siparişlerim',
    sub: 'Gelen ve giden siparişleri takip et',
    icon: 'bag-handle-outline' as const,
    bg: colors.successLight,
    color: colors.secondary,
    route: 'Siparislerim',
  },
];

export default function MarketplaceScreen({ navigation }: { navigation: any }) {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>B2B Pazaryeri</Text>
            <Text style={styles.subtitle}>İşletmeler arası toplu alım-satım platformu</Text>
          </View>
          <View style={[styles.iconBox, { backgroundColor: '#FFF7ED' }]}>
            <Ionicons name="storefront-outline" size={28} color="#F97316" />
          </View>
        </View>

        {/* Banner */}
        <View style={styles.banner}>
          <Ionicons name="trending-up-outline" size={20} color={colors.business} />
          <Text style={styles.bannerText}>
            Toplu satış yapın, yeni alıcılarla buluşun, işletmenizi büyütün.
          </Text>
        </View>

        {/* Menü */}
        <View style={styles.menuList}>
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.route}
              style={styles.menuItem}
              onPress={() => navigation.navigate(item.route)}
            >
              <View style={[styles.menuIcon, { backgroundColor: item.bg }]}>
                <Ionicons name={item.icon} size={26} color={item.color} />
              </View>
              <View style={styles.menuText}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSub}>{item.sub}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.text.muted} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { padding: theme.spacing.md, gap: theme.spacing.md, paddingBottom: 40 },

  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTextWrap: { flex: 1 },
  title: { fontSize: 22, fontWeight: '700', color: colors.text.primary },
  subtitle: { fontSize: 13, color: colors.text.secondary, marginTop: 2 },
  iconBox: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },

  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    padding: 14,
  },
  bannerText: { flex: 1, fontSize: 13, color: colors.business, fontWeight: '500', lineHeight: 19 },

  menuList: { gap: 12 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  menuIcon: { width: 50, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  menuText: { flex: 1 },
  menuTitle: { fontSize: 16, fontWeight: '700', color: colors.text.primary },
  menuSub: { fontSize: 12, color: colors.text.secondary, marginTop: 2 },
});
