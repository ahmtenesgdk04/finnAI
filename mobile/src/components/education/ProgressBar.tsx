import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import { theme } from '../../constants/theme';

interface ProgressBarProps {
  current: number;
  total: number;
  color?: string;
  showLabel?: boolean;
  height?: number;
}

export default function ProgressBar({ current, total, color = colors.primary, showLabel = true, height = 10 }: ProgressBarProps) {
  const progress = useRef(new Animated.Value(0)).current;
  const pct = Math.min((current / total) * 100, 100);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: pct,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [pct]);

  const width = progress.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <View style={[styles.track, { height }]}>
        <Animated.View style={[styles.fill, { width, backgroundColor: color, height }]} />
      </View>
      {showLabel && (
        <Text style={styles.label}>{current}/{total}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  track: {
    flex: 1,
    backgroundColor: '#E2E8F0',
    borderRadius: 99,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 99,
  },
  label: {
    ...theme.typography.caption,
    color: colors.text.secondary,
    minWidth: 36,
    textAlign: 'right',
  },
});
