import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Modal, TextInput, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../../constants/colors';

const STORAGE_KEY = 'calendar_reminders';

const DAY_NAMES = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const MONTH_NAMES = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

type Reminder = {
  id: string;
  title: string;
  date: string;
  time?: string;
  note?: string;
};

function dateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function todayKey(): string {
  const d = new Date();
  return dateKey(d.getFullYear(), d.getMonth(), d.getDate());
}

function formatDisplayDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${parseInt(d)} ${MONTH_NAMES[parseInt(m) - 1]} ${y}`;
}

export default function DueDateCalendarScreen({ navigation }: { navigation: any }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editNote, setEditNote] = useState('');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw) setReminders(JSON.parse(raw));
    });
  }, []);

  const persist = useCallback(async (updated: Reminder[]) => {
    setReminders(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const addReminder = async () => {
    if (!editTitle.trim()) return;
    const item: Reminder = {
      id: Date.now().toString(),
      title: editTitle.trim(),
      date: selectedDate,
      time: editTime.trim() || undefined,
      note: editNote.trim() || undefined,
    };
    await persist([...reminders, item]);
    setModalVisible(false);
    setEditTitle('');
    setEditTime('');
    setEditNote('');
  };

  const deleteReminder = (id: string) => {
    Alert.alert('Hatırlatmayı Sil', 'Bu hatırlatmayı silmek istiyor musunuz?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => persist(reminders.filter(r => r.id !== id)) },
    ]);
  };

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  const firstDayOffset = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDayOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const remindersByDate: Record<string, Reminder[]> = {};
  reminders.forEach(r => {
    if (!remindersByDate[r.date]) remindersByDate[r.date] = [];
    remindersByDate[r.date].push(r);
  });

  const todayStr = todayKey();
  const selectedReminders = remindersByDate[selectedDate] || [];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Ajanda</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Month navigation */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
            <Ionicons name="chevron-back" size={22} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.monthTitle}>{MONTH_NAMES[month]} {year}</Text>
          <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
            <Ionicons name="chevron-forward" size={22} color={colors.text.primary} />
          </TouchableOpacity>
        </View>

        {/* Calendar grid */}
        <View style={styles.calendar}>
          <View style={styles.dayNamesRow}>
            {DAY_NAMES.map(d => (
              <View key={d} style={styles.dayNameCell}>
                <Text style={styles.dayNameText}>{d}</Text>
              </View>
            ))}
          </View>

          {Array.from({ length: cells.length / 7 }, (_, week) => (
            <View key={week} style={styles.weekRow}>
              {cells.slice(week * 7, week * 7 + 7).map((day, idx) => {
                if (day === null) return <View key={idx} style={styles.dayCell} />;
                const key = dateKey(year, month, day);
                const isToday = key === todayStr;
                const isSelected = key === selectedDate;
                const hasEvents = !!remindersByDate[key]?.length;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={styles.dayCell}
                    onPress={() => setSelectedDate(key)}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.dayInner,
                      isSelected && styles.daySelected,
                      isToday && !isSelected && styles.dayToday,
                    ]}>
                      <Text style={[
                        styles.dayText,
                        isSelected && styles.dayTextSelected,
                        isToday && !isSelected && styles.dayTextToday,
                      ]}>
                        {day}
                      </Text>
                      {hasEvents && <View style={[styles.dot, isSelected && styles.dotSelected]} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        {/* Selected day */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{formatDisplayDate(selectedDate)}</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={styles.addBtnText}>Ekle</Text>
            </TouchableOpacity>
          </View>

          {selectedReminders.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="calendar-outline" size={32} color={colors.text.muted} />
              <Text style={styles.emptyText}>Bu gün için hatırlatma yok</Text>
            </View>
          ) : (
            selectedReminders.map(r => (
              <View key={r.id} style={styles.reminderCard}>
                <View style={styles.reminderAccent} />
                <View style={styles.reminderContent}>
                  <Text style={styles.reminderTitle}>{r.title}</Text>
                  {r.time && (
                    <View style={styles.reminderMeta}>
                      <Ionicons name="time-outline" size={13} color={colors.text.muted} />
                      <Text style={styles.reminderMetaText}>{r.time}</Text>
                    </View>
                  )}
                  {r.note ? <Text style={styles.reminderNote}>{r.note}</Text> : null}
                </View>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteReminder(r.id)}>
                  <Ionicons name="trash-outline" size={18} color={colors.danger} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Add Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Hatırlatma Ekle</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.text.primary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalDateLabel}>{formatDisplayDate(selectedDate)}</Text>

            <Text style={styles.inputLabel}>Başlık *</Text>
            <TextInput
              style={styles.input}
              placeholder="Hatırlatma başlığı"
              placeholderTextColor={colors.text.muted}
              value={editTitle}
              onChangeText={setEditTitle}
              autoFocus
            />

            <Text style={styles.inputLabel}>Saat (isteğe bağlı)</Text>
            <TextInput
              style={styles.input}
              placeholder="09:00"
              placeholderTextColor={colors.text.muted}
              value={editTime}
              onChangeText={setEditTime}
              keyboardType="numbers-and-punctuation"
            />

            <Text style={styles.inputLabel}>Not (isteğe bağlı)</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder="Ek notlar..."
              placeholderTextColor={colors.text.muted}
              value={editNote}
              onChangeText={setEditNote}
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity
              style={[styles.saveBtn, !editTitle.trim() && styles.saveBtnDisabled]}
              onPress={addReminder}
              disabled={!editTitle.trim()}
            >
              <Text style={styles.saveBtnText}>Kaydet</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  back: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 17, fontWeight: '700', color: colors.text.primary },

  monthNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: colors.card,
  },
  navBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  monthTitle: { fontSize: 17, fontWeight: '700', color: colors.text.primary },

  calendar: {
    backgroundColor: colors.card, paddingHorizontal: 12, paddingBottom: 16, marginBottom: 8,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  dayNamesRow: { flexDirection: 'row', marginBottom: 4 },
  dayNameCell: { flex: 1, alignItems: 'center', paddingVertical: 6 },
  dayNameText: { fontSize: 12, fontWeight: '600', color: colors.text.muted },

  weekRow: { flexDirection: 'row' },
  dayCell: { flex: 1, alignItems: 'center', paddingVertical: 3 },
  dayInner: { width: 36, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  daySelected: { backgroundColor: colors.business },
  dayToday: { backgroundColor: colors.primaryLight, borderWidth: 1.5, borderColor: colors.business },
  dayText: { fontSize: 14, fontWeight: '500', color: colors.text.primary },
  dayTextSelected: { color: '#fff', fontWeight: '700' },
  dayTextToday: { color: colors.business, fontWeight: '700' },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.business, marginTop: 2 },
  dotSelected: { backgroundColor: '#fff' },

  section: { paddingHorizontal: 16, paddingBottom: 40 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text.primary },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.business, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
  },
  addBtnText: { fontSize: 13, fontWeight: '600', color: '#fff' },

  emptyBox: {
    paddingVertical: 36, alignItems: 'center', gap: 10,
    backgroundColor: colors.card, borderRadius: 14,
    borderWidth: 1, borderColor: colors.border,
  },
  emptyText: { fontSize: 14, color: colors.text.muted },

  reminderCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card, borderRadius: 14,
    marginBottom: 10, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  reminderAccent: { width: 4, alignSelf: 'stretch', backgroundColor: colors.business },
  reminderContent: { flex: 1, padding: 14 },
  reminderTitle: { fontSize: 15, fontWeight: '600', color: colors.text.primary },
  reminderMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  reminderMetaText: { fontSize: 12, color: colors.text.muted },
  reminderNote: { fontSize: 12, color: colors.text.secondary, marginTop: 4, lineHeight: 18 },
  deleteBtn: { padding: 16 },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  modalSheet: {
    backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border,
    alignSelf: 'center', marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text.primary },
  modalDateLabel: { fontSize: 13, color: colors.text.muted, marginBottom: 20 },

  inputLabel: { fontSize: 13, fontWeight: '600', color: colors.text.secondary, marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
    color: colors.text.primary, backgroundColor: colors.background, marginBottom: 14,
  },
  inputMultiline: { height: 80, textAlignVertical: 'top' },

  saveBtn: {
    backgroundColor: colors.business, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginTop: 4,
  },
  saveBtnDisabled: { opacity: 0.45 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
