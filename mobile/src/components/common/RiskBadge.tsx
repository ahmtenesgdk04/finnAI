import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';

interface RiskBadgeProps {
  level: 'green' | 'yellow' | 'red';
  score: number;
}

const LEVEL_CONFIG = {
  green: { bg: '#D1FAE5', text: '#065F46', label: 'Güvenli' },
  yellow: { bg: '#FEF3C7', text: '#92400E', label: 'Dikkatli Ol' },
  red: { bg: '#FEE2E2', text: '#991B1B', label: 'Riskli' },
};

export default function RiskBadge({ level, score }: RiskBadgeProps) {
  const config = LEVEL_CONFIG[level];
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <View style={[styles.score, { borderColor: config.text }]}>
        <Text style={[styles.scoreText, { color: config.text }]}>{score}</Text>
      </View>
      <Text style={[styles.label, { color: config.text }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.xl,
    gap: theme.spacing.sm,
    alignSelf: 'center',
  },
  score: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '700',
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
  },
});
