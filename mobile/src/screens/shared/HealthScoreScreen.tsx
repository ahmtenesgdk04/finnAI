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
  const insights: string[] = (data as any)?.insights || [];
  const warnings: string[] = (data as any)?.warnings || [];

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
});
