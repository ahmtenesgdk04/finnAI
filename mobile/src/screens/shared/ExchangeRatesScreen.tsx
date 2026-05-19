import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl,
  TouchableOpacity, Modal, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Line, Circle, Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';
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
interface HistoryPoint { date: string; value: number }

const CHART_W = 300;
const CHART_H = 110;
const PAD = { top: 8, right: 8, bottom: 22, left: 8 };

function RateLineChart({ data, color }: { data: HistoryPoint[]; color: string }) {
  if (data.length < 2) return null;

  const vals = data.map((d) => d.value);
  const minV = Math.min(...vals);
  const maxV = Math.max(...vals);
  const range = maxV - minV || 1;
  const plotW = CHART_W - PAD.left - PAD.right;
  const plotH = CHART_H - PAD.top - PAD.bottom;

  const px = (i: number) => PAD.left + (i / (data.length - 1)) * plotW;
  const py = (v: number) => PAD.top + (1 - (v - minV) / range) * plotH;

  const pts = data.map((d, i) => ({ x: px(i), y: py(d.value) }));
  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${pts[pts.length - 1].x} ${PAD.top + plotH} L ${pts[0].x} ${PAD.top + plotH} Z`;

  const first = data[0];
  const last = data[data.length - 1];
  const startLabel = new Date(first.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  const endLabel = new Date(last.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });

  return (
    <Svg width={CHART_W} height={CHART_H}>
      <Defs>
        <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity="0.25" />
          <Stop offset="1" stopColor={color} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      {[0.25, 0.5, 0.75].map((t) => (
        <Line
          key={t}
          x1={PAD.left} y1={PAD.top + t * plotH}
          x2={CHART_W - PAD.right} y2={PAD.top + t * plotH}
          stroke="#E2E8F0" strokeWidth={1}
        />
      ))}
      <Path d={areaPath} fill="url(#grad)" />
      <Path d={linePath} stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r={4} fill={color} />
      <SvgText x={PAD.left} y={CHART_H - 4} fontSize={10} fill="#94A3B8">{startLabel}</SvgText>
      <SvgText x={CHART_W - PAD.right} y={CHART_H - 4} fontSize={10} fill="#94A3B8" textAnchor="end">{endLabel}</SvgText>
    </Svg>
  );
}

function RateDetailModal({
  item, onClose,
}: {
  item: RateItem | null;
  onClose: () => void;
}) {
  const [history, setHistory] = useState<HistoryPoint[] | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState(false);

  React.useEffect(() => {
    if (!item) return;
    setHistory(null);
    setError(false);
    setLoadingHistory(true);
    personalAPI.getExchangeRateHistory(item.code)
      .then((res) => setHistory((res as any).data))
      .catch(() => setError(true))
      .finally(() => setLoadingHistory(false));
  }, [item?.code]);

  if (!item) return null;

  const change = history && history.length >= 2
    ? item.value - history[0].value
    : null;
  const changePct = change !== null && history
    ? (change / history[0].value) * 100
    : null;
  const isUp = change !== null && change >= 0;
  const chartColor = isUp ? '#10B981' : '#EF4444';

  return (
    <Modal visible={!!item} transparent animationType="slide" onRequestClose={onClose}>
      <View style={modal.overlay}>
        <View style={modal.sheet}>
          <View style={modal.header}>
            <View style={modal.headerLeft}>
              <Text style={modal.icon}>{ICONS[item.code] || '💱'}</Text>
              <View>
                <Text style={modal.code}>{item.code}</Text>
                <Text style={modal.name}>{item.name}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <View style={modal.valueRow}>
            <Text style={modal.value}>{formatValue(item.code, item.value)}</Text>
            {changePct !== null && (
              <View style={[modal.badge, { backgroundColor: isUp ? '#D1FAE5' : '#FEE2E2' }]}>
                <Ionicons
                  name={isUp ? 'trending-up' : 'trending-down'}
                  size={14}
                  color={chartColor}
                />
                <Text style={[modal.badgeText, { color: chartColor }]}>
                  {isUp ? '+' : ''}{changePct.toFixed(2)}%
                </Text>
              </View>
            )}
          </View>
          {history && history.length >= 2 && (
            <Text style={modal.period}>Son 30 gün</Text>
          )}

          <View style={modal.chartArea}>
            {loadingHistory && <ActivityIndicator color={colors.personal} />}
            {error && <Text style={modal.errorText}>Geçmiş verisi yüklenemedi</Text>}
            {history && <RateLineChart data={history} color={chartColor} />}
          </View>

          {history && history.length >= 2 && (
            <View style={modal.statsRow}>
              <View style={modal.stat}>
                <Text style={modal.statLabel}>30g En Düşük</Text>
                <Text style={modal.statVal}>
                  {formatValue(item.code, Math.min(...history.map((h) => h.value)))}
                </Text>
              </View>
              <View style={modal.stat}>
                <Text style={modal.statLabel}>30g En Yüksek</Text>
                <Text style={modal.statVal}>
                  {formatValue(item.code, Math.max(...history.map((h) => h.value)))}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

export default function ExchangeRatesScreen({ navigation }: { navigation: any }) {
  const { data, loading, refetch } = useApi(
    useCallback(() => personalAPI.getExchangeRates(), [])
  );
  const [selected, setSelected] = useState<RateItem | null>(null);

  if (loading && !data) return <LoadingSpinner fullScreen text="Kurlar yükleniyor..." />;

  const ratesData = data as RatesData | null;
  const updatedAt = ratesData?.updatedAt
    ? new Date(ratesData.updatedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    : new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topHeader}>
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
        <Text style={styles.hint}>Grafiği görmek için bir kura tıkla</Text>

        {ratesData?.sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item) => (
              <TouchableOpacity
                key={item.code}
                style={styles.rateCard}
                onPress={() => setSelected(item)}
                activeOpacity={0.7}
              >
                <Text style={styles.rateIcon}>{ICONS[item.code] || '💱'}</Text>
                <View style={styles.rateInfo}>
                  <Text style={styles.rateCode}>{item.code}</Text>
                  <Text style={styles.rateName}>{item.name}</Text>
                </View>
                <Text style={styles.rateValue}>{formatValue(item.code, item.value)}</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
              </TouchableOpacity>
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

      <RateDetailModal item={selected} onClose={() => setSelected(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topHeader: {
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
    justifyContent: 'flex-end', marginBottom: 4,
  },
  updatedText: { ...theme.typography.caption, color: colors.text.muted },
  hint: { ...theme.typography.caption, color: colors.text.muted, textAlign: 'center', marginBottom: theme.spacing.md },
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

const modal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: theme.spacing.lg, paddingBottom: 36,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  icon: { fontSize: 32 },
  code: { fontSize: 18, fontWeight: '700', color: colors.text.primary },
  name: { fontSize: 13, color: colors.text.secondary },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, marginBottom: 4 },
  value: { fontSize: 28, fontWeight: '700', color: colors.text.primary },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4,
  },
  badgeText: { fontSize: 13, fontWeight: '700' },
  period: { fontSize: 11, color: colors.text.muted, marginBottom: theme.spacing.md },
  chartArea: {
    alignItems: 'center', justifyContent: 'center',
    minHeight: 110, marginBottom: theme.spacing.md,
  },
  errorText: { fontSize: 13, color: colors.text.muted },
  statsRow: { flexDirection: 'row', gap: theme.spacing.sm },
  stat: {
    flex: 1, backgroundColor: colors.card, borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md, alignItems: 'center', gap: 4,
    ...theme.shadow.card,
  },
  statLabel: { fontSize: 11, color: colors.text.muted },
  statVal: { fontSize: 14, fontWeight: '700', color: colors.text.primary },
});
