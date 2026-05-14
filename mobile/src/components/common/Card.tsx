import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../constants/colors';
import { theme } from '../../constants/theme';

interface CardProps {
  title: string;
  value: string;
  subtitle?: string;
  color?: string;
  onPress?: () => void;
  style?: ViewStyle;
  children?: React.ReactNode;
}

export default function Card({ title, value, subtitle, color, onPress, style, children }: CardProps) {
  const Container = onPress ? TouchableOpacity : View;
  return (
    <Container
      style={[styles.card, style]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {color && <View style={[styles.accent, { backgroundColor: color }]} />}
      <Text style={styles.title}>{title}</Text>
      <Text style={[styles.value, color ? { color } : {}]}>{value}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {children}
    </Container>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    ...theme.shadow.card,
    overflow: 'hidden',
  },
  accent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  title: {
    ...theme.typography.caption,
    color: colors.text.secondary,
    marginTop: 4,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    ...theme.typography.h2,
    color: colors.text.primary,
  },
  subtitle: {
    ...theme.typography.caption,
    color: colors.text.muted,
    marginTop: 4,
  },
});
