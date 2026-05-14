import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getScoreColor } from '../../utils/formatters';
import { theme } from '../../constants/theme';

interface ScoreGaugeProps {
  score: number;
  label: string;
  size?: number;
}

export default function ScoreGauge({ score, label, size = 120 }: ScoreGaugeProps) {
  const color = getScoreColor(score);
  return (
    <View style={styles.container}>
      <View
        style={[
          styles.circle,
          { width: size, height: size, borderRadius: size / 2, borderColor: color },
        ]}
      >
        <Text style={[styles.score, { color }]}>{Math.round(score)}</Text>
        <Text style={styles.outOf}>/100</Text>
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  circle: {
    borderWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  score: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 36,
  },
  outOf: {
    fontSize: 12,
    color: '#94A3B8',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },
});
