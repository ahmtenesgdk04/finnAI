import React, { useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, FlatList, StyleSheet, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../constants/colors';
import { theme } from '../../constants/theme';
import { formatCurrency, formatDate, formatMonth } from '../../utils/formatters';
import { personalAPI } from '../../services/api';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';
import Card from '../../components/common/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function DashboardScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const month = formatMonth();

  const { data: summary, loading, refetch } = useApi(
    useCallback(() => personalAPI.getSummary(month), [month])
  );

  const { data: goals } = useApi(useCallback(() => personalAPI.getGoals(), []));
  const { data: rates } = useApi(useCallback(() => personalAPI.getExchangeRates(), []));

  const totalSpent = summary?.total || 0;
  const budget = summary?.budget || 10000;
  const remaining = budget - totalSpent;
  const recentEntries = summary?.entries?.slice(0, 5) || [];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Merhaba, {user?.name?.split(' ')[0]} 👋</Text>
            <Text style={styles.date}>{formatDate(new Date())}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={() => navigation.navigate('Tools', { screen: 'HealthScore' })}>
              <Ionicons name="heart-circle-outline" size={32} color={colors.personal} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Döviz şeridi */}
        {rates && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.ratesScroll}>
            {Object.entries(rates).map(([key, val]: any) => (
              <View key={key} style={styles.rateChip}>
                <Text style={styles.rateKey}>{key}</Text>
                <Text style={styles.rateVal}>{formatCurrency(val)}</Text>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Özet kartlar */}
        <View style={styles.cardsRow}>
          <Card
            title="Bu Ay Harcama"
            value={formatCurrency(totalSpent)}
            color={colors.danger}
            style={styles.halfCard}
          />
          <Card
            title="Kalan Bütçe"
            value={formatCurrency(remaining)}
            color={remaining >= 0 ? colors.secondary : colors.danger}
            style={styles.halfCard}
          />
        </View>

        <Card
          title="Aktif Hedef"
          value={`${(goals as any)?.length || 0} Hedef`}
          subtitle="Birikim hedefleriniz"
          color={colors.personal}
          onPress={() => navigation.navigate('Goals')}
        />

        {/* Hızlı aksiyonlar */}
        <Text style={styles.sectionTitle}>Hızlı İşlemler</Text>
        <View style={styles.actions}>
          {[
            { icon: 'add-circle-outline', label: '+ Harcama', screen: 'Budget' },
            { icon: 'flag-outline', label: '+ Hedef', screen: 'Goals' },
            { icon: 'school-outline', label: "Koç'a Sor", screen: 'Coach' },
          ].map((a) => (
            <TouchableOpacity
              key={a.label}
              style={styles.actionBtn}
              onPress={() => navigation.navigate(a.screen)}
            >
              <Ionicons name={a.icon as any} size={26} color={colors.personal} />
              <Text style={styles.actionLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Son işlemler */}
        <Text style={styles.sectionTitle}>Son İşlemler</Text>
        {loading ? (
          <LoadingSpinner />
        ) : recentEntries.length === 0 ? (
          <Text style={styles.empty}>Henüz işlem yok</Text>
        ) : (
          recentEntries.map((entry: any) => (
            <View key={entry.id} style={styles.entryRow}>
              <View style={styles.entryLeft}>
                <Text style={styles.entryCategory}>{entry.category}</Text>
                <Text style={styles.entryNote}>{entry.note || entry.date}</Text>
              </View>
              <Text style={styles.entryAmount}>-{formatCurrency(entry.amount)}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { padding: theme.spacing.md, gap: theme.spacing.md, paddingBottom: 32 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  greeting: { ...theme.typography.h2, color: colors.text.primary },
  date: { ...theme.typography.caption, color: colors.text.secondary, marginTop: 2 },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },

  ratesScroll: { marginHorizontal: -theme.spacing.md, paddingHorizontal: theme.spacing.md },
  rateChip: {
    backgroundColor: colors.card,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    ...theme.shadow.card,
  },
  rateKey: { fontSize: 11, color: colors.text.secondary, fontWeight: '600' },
  rateVal: { fontSize: 14, fontWeight: '700', color: colors.text.primary },
  cardsRow: { flexDirection: 'row', gap: theme.spacing.sm },
  halfCard: { flex: 1 },
  sectionTitle: { ...theme.typography.h3, color: colors.text.primary, marginTop: theme.spacing.sm },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
    gap: theme.spacing.xs,
    ...theme.shadow.card,
  },
  actionLabel: { fontSize: 12, color: colors.text.secondary, textAlign: 'center' },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    ...theme.shadow.card,
  },
  entryLeft: { flex: 1 },
  entryCategory: { ...theme.typography.body, fontWeight: '600', color: colors.text.primary },
  entryNote: { ...theme.typography.caption, color: colors.text.secondary },
  entryAmount: { ...theme.typography.body, fontWeight: '700', color: colors.danger },
  empty: { ...theme.typography.body, color: colors.text.muted, textAlign: 'center', paddingVertical: 24 },
});
