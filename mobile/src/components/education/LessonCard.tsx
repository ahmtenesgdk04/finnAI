import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { theme } from '../../constants/theme';
import Button from '../common/Button';

interface LessonCardProps {
  title: string;
  content: string;
  xp: number;
  onStart: () => void;
}

export default function LessonCard({ title, content, xp, onStart }: LessonCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.header} onPress={() => setExpanded(!expanded)} activeOpacity={0.8}>
        <View style={styles.headerLeft}>
          <View style={styles.iconBg}>
            <Ionicons name="book-outline" size={22} color={colors.personal} />
          </View>
          <View style={styles.titleBlock}>
            <Text style={styles.title}>{title}</Text>
            <View style={styles.xpRow}>
              <Ionicons name="star" size={12} color="#F59E0B" />
              <Text style={styles.xpText}>+{xp} XP</Text>
            </View>
          </View>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.text.secondary}
        />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.body}>
          <Text style={styles.content}>{content}</Text>
          <Button title="Derse Başla" onPress={onStart} style={styles.btn} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadow.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
  },
  iconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    flex: 1,
  },
  title: {
    ...theme.typography.body,
    fontWeight: '600',
    color: colors.text.primary,
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  xpText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '500',
  },
  body: {
    padding: theme.spacing.md,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  content: {
    ...theme.typography.body,
    color: colors.text.secondary,
    lineHeight: 22,
    marginBottom: theme.spacing.md,
  },
  btn: {
    alignSelf: 'flex-start',
    height: 40,
    paddingHorizontal: theme.spacing.md,
  },
});
