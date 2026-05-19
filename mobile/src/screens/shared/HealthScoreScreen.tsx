import React, { useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../constants/colors';
import { theme } from '../../constants/theme';
import { personalAPI } from '../../services/api';
import { useApi } from '../../hooks/useApi';
import ScoreGauge from '../../components/common/ScoreGauge';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function HealthScoreScreen() {
  const navigation = useNavigation<any>();
  const { data, loading, refetch } = useApi(
    useCallback(() => personalAPI.getHealthScore(), [])
  );

  const score = (data as any)?.personal || 0;
  const breakdown = (data as any)?.breakdown || {};
  const insights: string[] = (data as any)?.insights || [];
  const warnings: string[] = (data as any)?.warnings || [];

  const BREAKDOWN_ITEMS = [
    { key: 'budget', label: 'Bütçeleme', icon: 'wallet-outline' as const },
    { key: 'limits', label: 'Limit Kontrolü', icon: 'shield-checkmark-outline' as const },
    { key: 'goals', label: 'Birikim Hedefleri', icon: 'flag-outline' as const },
    { key: 'education', label: 'Finansal Eğitim', icon: 'school-outline' as const },
  ];

  if (loading) return <LoadingSpinner fullScreen text="Finansal sağlık analiz ediliyor..." />;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
    >
      {/* Ana skor */}
      <View style={styles.scoreCard}>
        <ScoreGauge score={score} label="Finansal Sağlık Skoru" size={160} />
        <Text style={styles.scoreDesc}>
          {score >= 70
            ? 'Finansal durumunuz oldukça iyi!'
            : score >= 40
              ? 'Bazı alanlarda iyileştirme yapılabilir.'
              : 'Acil aksiyon almanız öneriliyor.'}
        </Text>
      </View>

      {/* Puan dağılımı */}
      <Text style={styles.sectionTitle}>Puan Dağılımı</Text>
      <View style={styles.breakdownCard}>
        {BREAKDOWN_ITEMS.map((item, idx) => {
          const val = Math.round(breakdown[item.key] ?? 0);
          const pct = val / 25;
          const barColor = pct >= 0.8 ? colors.secondary : pct >= 0.48 ? colors.warning : colors.danger;
          return (
            <View key={item.key} style={[styles.breakdownRow, idx < BREAKDOWN_ITEMS.length - 1 && styles.breakdownDivider]}>
              <View style={styles.breakdownLeft}>
                <Ionicons name={item.icon} size={18} color={barColor} />
                <Text style={styles.breakdownLabel}>{item.label}</Text>
              </View>
              <View style={styles.breakdownRight}>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${Math.round(pct * 100)}%`, backgroundColor: barColor }]} />
                </View>
                <Text style={[styles.breakdownScore, { color: barColor }]}>{val}<Text style={styles.breakdownMax}>/25</Text></Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Uyarılar */}
      {warnings.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Önemli Uyarılar</Text>
          {warnings.map((w, i) => (
            <View key={i} style={styles.warningCard}>
              <Ionicons name="warning" size={18} color={colors.warning} />
              <Text style={styles.warningText}>{w}</Text>
            </View>
          ))}
        </>
      )}

      {/* İçgörüler */}
      {insights.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Öneriler</Text>
          {insights.map((ins, i) => (
            <View key={i} style={styles.insightCard}>
              <Ionicons name="bulb-outline" size={18} color={colors.secondary} />
              <Text style={styles.insightText}>{ins}</Text>
            </View>
          ))}
        </>
      )}

      {/* FinansKoç linki */}
      <TouchableOpacity
        style={styles.coachLink}
        onPress={() => navigation.navigate('Coach')}
      >
        <Ionicons name="school-outline" size={22} color={colors.personal} />
        <Text style={styles.coachLinkText}>FinansKoç ile skorunu yükselt</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.personal} />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { padding: theme.spacing.md, gap: theme.spacing.md, paddingBottom: 40 },
  scoreCard: {
    backgroundColor: colors.card, borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl, alignItems: 'center', gap: theme.spacing.md, ...theme.shadow.elevated,
  },
  scoreDesc: { ...theme.typography.body, color: colors.text.secondary, textAlign: 'center' },
  sectionTitle: { ...theme.typography.h3, color: colors.text.primary },
  warningCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.sm,
    backgroundColor: '#FEF3C7', borderRadius: theme.borderRadius.md, padding: theme.spacing.md,
  },
  warningText: { flex: 1, ...theme.typography.body, color: '#92400E', lineHeight: 20 },
  insightCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.sm,
    backgroundColor: '#D1FAE5', borderRadius: theme.borderRadius.md, padding: theme.spacing.md,
  },
  insightText: { flex: 1, ...theme.typography.body, color: '#065F46', lineHeight: 20 },
  coachLink: {
    flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm,
    backgroundColor: '#EDE9FE', borderRadius: theme.borderRadius.lg, padding: theme.spacing.md,
  },
  coachLinkText: { flex: 1, ...theme.typography.body, fontWeight: '600', color: colors.personal },
  breakdownCard: {
    backgroundColor: colors.card, borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md, ...theme.shadow.card,
  },
  breakdownRow: { paddingVertical: 10, gap: 8 },
  breakdownDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  breakdownLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  breakdownLabel: { fontSize: 14, fontWeight: '600', color: colors.text.primary },
  breakdownRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  barTrack: { flex: 1, height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  breakdownScore: { fontSize: 15, fontWeight: '700', minWidth: 44, textAlign: 'right' },
  breakdownMax: { fontSize: 11, fontWeight: '400', color: colors.text.muted },
});
