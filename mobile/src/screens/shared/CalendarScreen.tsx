import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { theme } from '../../constants/theme';

interface CalendarEvent {
  date: string;
  type: 'installment' | 'subscription' | 'debt' | 'goal';
  label: string;
  amount?: number;
}

const TYPE_CONFIG = {
  installment: { icon: 'card-outline' as const, color: colors.primary, label: 'Taksit' },
  subscription: { icon: 'refresh-outline' as const, color: colors.warning, label: 'Abonelik' },
  debt: { icon: 'people-outline' as const, color: colors.danger, label: 'Borç' },
  goal: { icon: 'flag-outline' as const, color: colors.secondary, label: 'Hedef' },
};

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const events: CalendarEvent[] = [];

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date().toISOString().split('T')[0];

  const days: (number | null)[] = [];
  for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const dateStr = (d: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  const eventsForDate = (d: number) =>
    events.filter((e) => e.date === dateStr(d));

  const shiftMonth = (dir: 1 | -1) => {
    setCurrentMonth((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + dir);
      return d;
    });
  };

  const selectedEvents = selectedDate
    ? events.filter((e) => e.date === selectedDate)
    : [];

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* Ay navigasyonu */}
      <View style={styles.monthRow}>
        <TouchableOpacity onPress={() => shiftMonth(-1)}>
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.monthLabel}>
          {currentMonth.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
        </Text>
        <TouchableOpacity onPress={() => shiftMonth(1)}>
          <Ionicons name="chevron-forward" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Haftanın günleri */}
      <View style={styles.weekRow}>
        {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((d) => (
          <Text key={d} style={styles.weekDay}>{d}</Text>
        ))}
      </View>

      {/* Günler grid */}
      <View style={styles.grid}>
        {days.map((day, idx) => {
          if (day === null) return <View key={`empty-${idx}`} style={styles.dayCell} />;
          const dStr = dateStr(day);
          const dayEvents = eventsForDate(day);
          const isToday = dStr === today;
          const isSelected = dStr === selectedDate;
          return (
            <TouchableOpacity
              key={dStr}
              style={[
                styles.dayCell,
                isToday && styles.todayCell,
                isSelected && styles.selectedCell,
              ]}
              onPress={() => setSelectedDate(isSelected ? null : dStr)}
            >
              <Text style={[
                styles.dayNum,
                isToday && styles.todayNum,
                isSelected && styles.selectedNum,
              ]}>
                {day}
              </Text>
              <View style={styles.dots}>
                {dayEvents.slice(0, 3).map((e, i) => (
                  <View
                    key={i}
                    style={[styles.dot, { backgroundColor: TYPE_CONFIG[e.type].color }]}
                  />
                ))}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Seçili gün olayları */}
      {selectedDate && (
        <View style={styles.eventsSection}>
          <Text style={styles.eventsTitle}>
            {new Date(selectedDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
          </Text>
          {selectedEvents.length === 0 ? (
            <Text style={styles.noEvents}>Bu gün için etkinlik yok</Text>
          ) : (
            selectedEvents.map((e, i) => {
              const cfg = TYPE_CONFIG[e.type];
              return (
                <View key={i} style={styles.eventCard}>
                  <Ionicons name={cfg.icon} size={18} color={cfg.color} />
                  <View style={styles.eventInfo}>
                    <Text style={styles.eventLabel}>{e.label}</Text>
                    <Text style={styles.eventType}>{cfg.label}</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      )}

      {/* Legend */}
      <View style={styles.legend}>
        {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
          <View key={key} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: cfg.color }]} />
            <Text style={styles.legendText}>{cfg.label}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { padding: theme.spacing.md, gap: theme.spacing.md, paddingBottom: 40 },
  monthRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.card, borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md, ...theme.shadow.card,
  },
  monthLabel: { ...theme.typography.h3, color: colors.text.primary },
  weekRow: {
    flexDirection: 'row',
    backgroundColor: colors.card, borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
  },
  weekDay: {
    flex: 1, textAlign: 'center', fontSize: 12,
    fontWeight: '600', color: colors.text.secondary,
  },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    backgroundColor: colors.card, borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.sm, ...theme.shadow.card,
  },
  dayCell: {
    width: '14.28%', aspectRatio: 1,
    alignItems: 'center', justifyContent: 'center',
    padding: 2,
  },
  todayCell: { backgroundColor: '#EDE9FE', borderRadius: 99 },
  selectedCell: { backgroundColor: colors.personal, borderRadius: 99 },
  dayNum: { fontSize: 13, fontWeight: '500', color: colors.text.primary },
  todayNum: { color: colors.personal, fontWeight: '700' },
  selectedNum: { color: '#fff', fontWeight: '700' },
  dots: { flexDirection: 'row', gap: 2, marginTop: 1 },
  dot: { width: 4, height: 4, borderRadius: 2 },
  eventsSection: {
    backgroundColor: colors.card, borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md, gap: theme.spacing.sm, ...theme.shadow.card,
  },
  eventsTitle: { ...theme.typography.h3, color: colors.text.primary },
  noEvents: { ...theme.typography.body, color: colors.text.muted, textAlign: 'center', paddingVertical: 16 },
  eventCard: {
    flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  eventInfo: { flex: 1 },
  eventLabel: { ...theme.typography.body, fontWeight: '600', color: colors.text.primary },
  eventType: { ...theme.typography.caption, color: colors.text.secondary },
  legend: {
    flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md,
    backgroundColor: colors.card, borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: colors.text.secondary },
});
