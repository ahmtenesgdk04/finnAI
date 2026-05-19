import React, { useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { theme } from '../../constants/theme';
import { personalAPI } from '../../services/api';
import { useApi } from '../../hooks/useApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const ICONS: Record<string, string> = {
  USD: '🇺🇸', EUR: '🇪🇺', GBP: '🇬🇧', CHF: '🇨🇭',
  JPY: '🇯🇵', CAD: '🇨🇦', AUD: '🇦🇺', SAR: '🇸🇦',
  CNY: '🇨🇳', NOK: '🇳🇴', GOLD: '🥇', BTC: '₿', ETH: 'Ξ',
};

const formatValue = (code: string, value: number): string => {
  if (code === 'BTC') {
    return value >= 1_000_000
      ? `₺${(value / 1_000_000).toFixed(2)} M`
      : `₺${value.toLocaleString('tr-TR')}`;
  }
  if (code === 'ETH' || code === 'GOLD') {
    return `₺${value.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`;
  }
  return `₺${value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
};

interface RateItem { code: string; name: string; value: number }
interface Section { title: string; items: RateItem[] }
interface RatesData { sections: Section[]; updatedAt: string }

export default function ExchangeRatesScreen({ navigation }: { navigation: any }) {
  const { data, loading, refetch } = useApi(
    useCallback(() => personalAPI.getExchangeRates(), [])
  );

  if (loading && !data) return <LoadingSpinner fullScreen text="Kurlar yükleniyor..." />;

  const ratesData = data as RatesData | null;
  const updatedAt = ratesData?.updatedAt
    ? new Date(ratesData.updatedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    : new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Döviz Kurları</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
      >
        <View style={styles.updatedRow}>
          <Ionicons name="time-outline" size={14} color={colors.text.muted} />
          <Text style={styles.updatedText}>Son güncelleme: {updatedAt} · Aşağı çekerek yenile</Text>
        </View>

        {ratesData?.sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item) => (
              <View key={item.code} style={styles.rateCard}>
                <Text style={styles.rateIcon}>{ICONS[item.code] || '💱'}</Text>
                <View style={styles.rateInfo}>
                  <Text style={styles.rateCode}>{item.code}</Text>
                  <Text style={styles.rateName}>{item.name}</Text>
                </View>
                <Text style={styles.rateValue}>{formatValue(item.code, item.value)}</Text>
              </View>
            ))}
          </View>
        ))}

        {!ratesData && !loading && (
          <View style={styles.empty}>
            <Ionicons name="trending-up-outline" size={48} color={colors.text.muted} />
            <Text style={styles.emptyText}>Kur verisi bulunamadı</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  back: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: colors.text.primary },
  scroll: { flex: 1 },
  content: { padding: theme.spacing.md, paddingBottom: 32 },
  updatedRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    justifyContent: 'flex-end', marginBottom: theme.spacing.md,
  },
  updatedText: { ...theme.typography.caption, color: colors.text.muted },
  section: { marginBottom: theme.spacing.lg },
  sectionTitle: {
    fontSize: 13, fontWeight: '600', color: colors.text.muted,
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginBottom: theme.spacing.sm, marginLeft: 4,
  },
  rateCard: {
    flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md,
    backgroundColor: colors.card, borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md, marginBottom: theme.spacing.sm,
    ...theme.shadow.card,
  },
  rateIcon: { fontSize: 26, width: 36, textAlign: 'center' },
  rateInfo: { flex: 1 },
  rateCode: { fontSize: 15, fontWeight: '700', color: colors.text.primary },
  rateName: { ...theme.typography.caption, color: colors.text.secondary, marginTop: 1 },
  rateValue: { fontSize: 16, fontWeight: '700', color: colors.primary },
  empty: { alignItems: 'center', paddingVertical: 48, gap: theme.spacing.sm },
  emptyText: { ...theme.typography.body, color: colors.text.muted },
});
