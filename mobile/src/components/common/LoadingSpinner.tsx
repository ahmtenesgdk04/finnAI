import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import { theme } from '../../constants/theme';

interface LoadingSpinnerProps {
  text?: string;
  fullScreen?: boolean;
}

export default function LoadingSpinner({ text, fullScreen = false }: LoadingSpinnerProps) {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <ActivityIndicator size="large" color={colors.primary} />
      {text ? <Text style={styles.text}>{text}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  text: {
    ...theme.typography.body,
    color: colors.text.secondary,
  },
});
