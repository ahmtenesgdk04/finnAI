import React, { useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { theme } from '../../constants/theme';
import { formatCurrency } from '../../utils/formatters';
import { personalAPI } from '../../services/api';
import { useApi } from '../../hooks/useApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const RATE_ICONS: Record<string, string> = {
  USD: '🇺🇸',
  EUR: '🇪🇺',
  GBP: '🇬🇧',
  GOLD: '🥇',
  BTC: '₿',
};

export default function ExchangeRatesScreen() {
  const { data, loading, refetch } = useApi(
    useCallback(() => personalAPI.getExchangeRates(), [])
  );

  if (loading) return <LoadingSpinner fullScreen text="Kurlar yükleniyor..." />;

  const rates = data ? Object.entries(data as Record<string, number>) : [];
  const updatedAt = new Date().toLocaleTimeString('tr-TR');

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
    >
      <View style={styles.header}>
        <Ionicons name="time-outline" size={14} color={colors.text.muted} />
        <Text style={styles.updatedText}>Son güncelleme: {updatedAt}</Text>
      </View>

      {rates.map(([key, val]) => (
        <View key={key} style={styles.rateCard}>
          <Text style={styles.rateFlag}>{RATE_ICONS[key] || '💱'}</Text>
          <View style={styles.rateInfo}>
            <Text style={styles.rateKey}>{key}</Text>
            <Text style={styles.rateLabel}>{key === 'GOLD' ? 'Altın (gram)' : key === 'BTC' ? 'Bitcoin' : `${key}/TRY`}</Text>
          </View>
          <Text style={styles.rateValue}>{formatCurrency(val)}</Text>
        </View>
      ))}

      {rates.length === 0 && (
        <View style={styles.empty}>
          <Ionicons name="trending-up-outline" size={48} color={colors.text.muted} />
          <Text style={styles.emptyText}>Kur verisi bulunamadı</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { padding: theme.spacing.md, gap: theme.spacing.sm, paddingBottom: 32 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    justifyContent: 'flex-end', marginBottom: theme.spacing.sm,
  },
  updatedText: { ...theme.typography.caption, color: colors.text.muted },
  rateCard: {
    flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md,
    backgroundColor: colors.card, borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md, ...theme.shadow.card,
  },
  rateFlag: { fontSize: 28 },
  rateInfo: { flex: 1 },
  rateKey: { fontSize: 16, fontWeight: '700', color: colors.text.primary },
  rateLabel: { ...theme.typography.caption, color: colors.text.secondary },
  rateValue: { fontSize: 18, fontWeight: '700', color: colors.primary },
  empty: { alignItems: 'center', paddingVertical: 48, gap: theme.spacing.sm },
  emptyText: { ...theme.typography.body, color: colors.text.muted },
});
