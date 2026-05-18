import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, G, Text as SvgText } from 'react-native-svg';
import { colors } from '../../constants/colors';
import { theme } from '../../constants/theme';
import { formatCurrency } from '../../utils/formatters';

interface PieData {
  category: string;
  amount: number;
  color?: string;
}

const PALETTE = [
  '#6366F1', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#06B6D4', '#84CC16',
];
const INCOME_COLOR = '#10B981';
const MIN_DEG = 6;
const SIZE = 220;
const CX = SIZE / 2;
const CY = SIZE / 2;
const OUTER_R = 90;
const INNER_R = 56;

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function slicePath(startDeg: number, endDeg: number): string {
  // Full circle special case
  if (endDeg - startDeg >= 359.9) {
    return [
      `M ${CX} ${CY - OUTER_R}`,
      `A ${OUTER_R} ${OUTER_R} 0 1 1 ${CX - 0.01} ${CY - OUTER_R}`,
      `L ${CX - 0.01} ${CY - INNER_R}`,
      `A ${INNER_R} ${INNER_R} 0 1 0 ${CX} ${CY - INNER_R}`,
      'Z',
    ].join(' ');
  }
  const large = endDeg - startDeg > 180 ? 1 : 0;
  const os = polar(CX, CY, OUTER_R, startDeg);
  const oe = polar(CX, CY, OUTER_R, endDeg);
  const ie = polar(CX, CY, INNER_R, endDeg);
  const is_ = polar(CX, CY, INNER_R, startDeg);
  return [
    `M ${os.x} ${os.y}`,
    `A ${OUTER_R} ${OUTER_R} 0 ${large} 1 ${oe.x} ${oe.y}`,
    `L ${ie.x} ${ie.y}`,
    `A ${INNER_R} ${INNER_R} 0 ${large} 0 ${is_.x} ${is_.y}`,
    'Z',
  ].join(' ');
}

export default function ExpensePieChart({ data }: { data: PieData[] }) {
  if (!data || data.length === 0) return null;

  const positive = data.filter((d) => d.amount > 0);
  const negative = data.filter((d) => d.amount < 0);
  const total = positive.reduce((s, d) => s + d.amount, 0);
  if (total <= 0) return null;

  // Enforce minimum slice angle
  const raw = positive.map((d) => (d.amount / total) * 360);
  const needsBoost = raw.map((a) => a < MIN_DEG);
  const boostNeeded = needsBoost.reduce((s, b, i) => s + (b ? MIN_DEG - raw[i] : 0), 0);
  const largeSum = raw.reduce((s, a, i) => s + (!needsBoost[i] ? a : 0), 0);
  const adjusted = raw.map((a, i) =>
    needsBoost[i] ? MIN_DEG : a - (largeSum > 0 ? (boostNeeded * a) / largeSum : 0)
  );

  let cursor = 0;
  const slices = positive.map((item, idx) => {
    const color = item.color || PALETTE[idx % PALETTE.length];
    const start = cursor;
    const sweep = adjusted[idx];
    const end = start + sweep;
    const mid = start + sweep / 2;
    const pct = Math.round((item.amount / total) * 100);
    cursor = end;
    return { ...item, color, start, end, mid, pct };
  });

  const legendItems = [
    ...slices.map((s) => ({ category: s.category, amount: s.amount, color: s.color, pct: s.pct })),
    ...negative.map((d) => ({ category: d.category, amount: d.amount, color: INCOME_COLOR, pct: null as number | null })),
  ];

  return (
    <View style={styles.container}>
      <Svg width={SIZE} height={SIZE}>
        <G>
          {slices.map((s, i) => (
            <Path key={i} d={slicePath(s.start, s.end)} fill={s.color} />
          ))}
          {slices.map((s, i) => {
            if (s.pct < 7) return null;
            const lp = polar(CX, CY, (OUTER_R + INNER_R) / 2, s.mid);
            return (
              <SvgText
                key={`lbl-${i}`}
                x={lp.x}
                y={lp.y}
                fill="#fff"
                fontSize={11}
                fontWeight="700"
                textAnchor="middle"
                alignmentBaseline="middle"
              >
                {s.pct}%
              </SvgText>
            );
          })}
          <SvgText x={CX} y={CY - 9} fill={colors.text.secondary} fontSize={10} textAnchor="middle">
            Toplam
          </SvgText>
          <SvgText x={CX} y={CY + 9} fill={colors.text.primary} fontSize={11} fontWeight="700" textAnchor="middle">
            {formatCurrency(total)}
          </SvgText>
        </G>
      </Svg>

      <View style={styles.legend}>
        {legendItems.map((item) => (
          <View key={item.category} style={styles.row}>
            <View style={[styles.dot, { backgroundColor: item.color }]} />
            <Text style={styles.name} numberOfLines={1}>{item.category}</Text>
            {item.pct !== null && (
              <Text style={styles.pct}>{item.pct}%</Text>
            )}
            <Text style={[styles.amount, item.amount < 0 && styles.income]}>
              {item.amount < 0
                ? `+${formatCurrency(-item.amount)}`
                : formatCurrency(item.amount)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  legend: { width: '100%', gap: 8, marginTop: theme.spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  name: { flex: 1, fontSize: 13, color: colors.text.secondary },
  pct: { fontSize: 12, color: colors.text.muted, minWidth: 32, textAlign: 'right' },
  amount: { fontSize: 13, fontWeight: '700', color: colors.text.primary },
  income: { color: '#10B981' },
});
