import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../../constants/colors';
import { businessAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

type Reminder = { id: string; title: string; date: string; time?: string; note?: string };

type MonthYear = { year: number; month: number };

interface Entry {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  label: string;
  date: string;
  note: string | null;
}

interface Collection {
  id: string;
  customer_name: string;
  amount: number;
  due_date: string;
  paid: boolean;
}

const MONTHS_TR = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const DAYS_TR = ['Pt','Sa','Ça','Pe','Cu','Ct','Pz'];

const nowMY = (): MonthYear => ({ year: new Date().getFullYear(), month: new Date().getMonth() });

const monthStart = ({ year, month }: MonthYear) =>
  `${year}-${String(month + 1).padStart(2, '0')}-01`;

const monthEnd = ({ year, month }: MonthYear) => {
  const last = new Date(year, month + 1, 0).getDate();
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(last).padStart(2, '0')}`;
};

const prevMY = ({ year, month }: MonthYear): MonthYear =>
  month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 };

const nextMY = ({ year, month }: MonthYear): MonthYear =>
  month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 };

const firstDayOffset = ({ year, month }: MonthYear): number => {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1; // Mon=0 ... Sun=6
};

const daysInMonth = ({ year, month }: MonthYear): number =>
  new Date(year, month + 1, 0).getDate();

const fmt = (n: number) =>
  n.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 });

const fmtStat = (n: number): string => {
  if (n >= 1_000_000) return `₺${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₺${(n / 1_000).toFixed(1)}K`;
  return `₺${Math.round(n)}`;
};

const fmtDate = (dateStr: string): string => {
  const d = (dateStr || '').split('T')[0];
  const parts = d.split('-');
  if (parts.length < 3) return d;
  return `${parseInt(parts[2], 10)} ${MONTHS_TR[parseInt(parts[1], 10) - 1]}`;
};

const dayFromDate = (dateStr: string): number => {
  const d = (dateStr || '').split('T')[0];
  return parseInt(d.split('-')[2], 10);
};

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const [curMonth, setCurMonth] = useState<MonthYear>(nowMY());
  const [summary, setSummary] = useState<{ totalIncome: number; totalExpense: number; entries: Entry[] } | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [dayModalVisible, setDayModalVisible] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>([]);

  const fetchAll = async (my: MonthYear) => {
    setLoading(true);
    try {
      const [sumRes, colRes] = await Promise.all([
        businessAPI.getSummaryByRange(monthStart(my), monthEnd(my)),
        businessAPI.getCollections(),
      ]);
      setSummary(sumRes.data);
      setCollections(colRes.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAll(curMonth);
      AsyncStorage.getItem('calendar_reminders').then(raw => {
        setReminders(raw ? JSON.parse(raw) : []);
      });
    }, [curMonth])
  );

  const goMonth = (my: MonthYear) => {
    setCurMonth(my);
    fetchAll(my);
  };

  const isNow = curMonth.year === nowMY().year && curMonth.month === nowMY().month;

  // Build day map from entries
  const dayMap: Record<number, { hasIncome: boolean; hasExpense: boolean; entries: Entry[] }> = {};
  if (summary) {
    for (const e of summary.entries) {
      const day = dayFromDate(e.date);
      if (!dayMap[day]) dayMap[day] = { hasIncome: false, hasExpense: false, entries: [] };
      dayMap[day].entries.push(e);
      if (e.type === 'income') dayMap[day].hasIncome = true;
      else dayMap[day].hasExpense = true;
    }
  }

  const today = new Date().toISOString().split('T')[0];
  const overdue = collections.filter(c => !c.paid && c.due_date < today);
  const pendingCount = collections.filter(c => !c.paid).length;

  const totalIncome = summary?.totalIncome ?? 0;
  const totalExpense = summary?.totalExpense ?? 0;
  const netBalance = totalIncome - totalExpense;

  // Calendar grid
  const offset = firstDayOffset(curMonth);
  const totalDays = daysInMonth(curMonth);
  const cells: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const monthPrefix = `${curMonth.year}-${String(curMonth.month + 1).padStart(2, '0')}-`;
  const reminderDayMap: Record<number, Reminder[]> = {};
  reminders
    .filter(r => r.date.startsWith(monthPrefix))
    .forEach(r => {
      const day = parseInt(r.date.split('-')[2], 10);
      if (!reminderDayMap[day]) reminderDayMap[day] = [];
      reminderDayMap[day].push(r);
    });

  const todayNum = isNow ? new Date().getDate() : -1;
  const selectedEntries = selectedDay != null ? (dayMap[selectedDay]?.entries ?? []) : [];
  const selectedReminders = selectedDay != null ? (reminderDayMap[selectedDay] ?? []) : [];

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hoş geldin 👋</Text>
          <Text style={styles.userName}>{user?.name || 'Kullanıcı'}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Çıkış</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Month Navigator */}
        <View style={styles.monthNav}>
          <TouchableOpacity style={styles.navBtn} onPress={() => goMonth(prevMY(curMonth))}>
            <Ionicons name="chevron-back" size={20} color={colors.business} />
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{MONTHS_TR[curMonth.month]} {curMonth.year}</Text>
          <TouchableOpacity
            style={[styles.navBtn, isNow && styles.navBtnDisabled]}
            onPress={() => !isNow && goMonth(nextMY(curMonth))}
          >
            <Ionicons name="chevron-forward" size={20} color={isNow ? colors.border : colors.business} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 48 }} color={colors.business} size="large" />
        ) : (
          <>
            {/* Hero card */}
            <View style={[styles.heroCard, { borderLeftColor: netBalance >= 0 ? colors.secondary : colors.danger }]}>
              <Text style={styles.heroLabel}>Net Bakiye</Text>
              <Text style={[styles.heroAmount, { color: netBalance >= 0 ? colors.secondary : colors.danger }]}>
                {fmt(netBalance)}
              </Text>
              <Text style={styles.heroSub}>{MONTHS_TR[curMonth.month]} {curMonth.year}</Text>
            </View>

            {/* Stats row */}
            <View style={styles.statsRow}>
              <View style={[styles.statCard, { borderTopColor: colors.secondary }]}>
                <Ionicons name="arrow-up-circle-outline" size={22} color={colors.secondary} />
                <Text style={styles.statLabel}>Gelir</Text>
                <Text style={[styles.statAmount, { color: colors.secondary }]}>{fmtStat(totalIncome)}</Text>
              </View>
              <View style={[styles.statCard, { borderTopColor: colors.danger }]}>
                <Ionicons name="arrow-down-circle-outline" size={22} color={colors.danger} />
                <Text style={styles.statLabel}>Gider</Text>
                <Text style={[styles.statAmount, { color: colors.danger }]}>{fmtStat(totalExpense)}</Text>
              </View>
              <View style={[styles.statCard, { borderTopColor: colors.warning }]}>
                <Ionicons name="time-outline" size={22} color={colors.warning} />
                <Text style={styles.statLabel}>Tahsilat</Text>
                <Text style={[styles.statAmount, { color: colors.warning }]}>{pendingCount} adet</Text>
              </View>
            </View>

            {/* Overdue alert */}
            {overdue.length > 0 && (
              <View style={styles.alert}>
                <Ionicons name="warning-outline" size={18} color={colors.danger} />
                <Text style={styles.alertText}>
                  {overdue.length} tahsilatın vadesi geçti — toplam {fmt(overdue.reduce((s, c) => s + Number(c.amount), 0))}
                </Text>
              </View>
            )}

            {/* Calendar */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Takvim</Text>
              <View style={styles.calendar}>
                <View style={styles.calRow}>
                  {DAYS_TR.map(d => (
                    <Text key={d} style={styles.calDayHeader}>{d}</Text>
                  ))}
                </View>
                {Array.from({ length: cells.length / 7 }, (_, row) => (
                  <View key={row} style={styles.calRow}>
                    {cells.slice(row * 7, row * 7 + 7).map((day, col) => {
                      const info = day ? dayMap[day] : undefined;
                      const isToday = day === todayNum;
                      return (
                        <TouchableOpacity
                          key={col}
                          style={[styles.calCell, isToday && styles.calCellToday]}
                          disabled={!day}
                          onPress={() => {
                            if (day) {
                              setSelectedDay(day);
                              setDayModalVisible(true);
                            }
                          }}
                        >
                          {day != null && (
                            <>
                              <Text style={[styles.calDayNum, isToday && styles.calDayNumToday]}>
                                {day}
                              </Text>
                              <View style={styles.calDots}>
                                {info?.hasIncome && (
                                  <View style={[styles.dot, { backgroundColor: colors.secondary }]} />
                                )}
                                {info?.hasExpense && (
                                  <View style={[styles.dot, { backgroundColor: colors.danger }]} />
                                )}
                                {reminderDayMap[day]?.length > 0 && (
                                  <View style={[styles.dot, { backgroundColor: colors.business }]} />
                                )}
                              </View>
                            </>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}
              </View>
            </View>

            {/* Son İşlemler */}
            <View style={[styles.section, { marginBottom: 32 }]}>
              <Text style={styles.sectionTitle}>Son İşlemler</Text>
              {(summary?.entries.length ?? 0) === 0 ? (
                <Text style={styles.emptyText}>Bu ay henüz işlem yok</Text>
              ) : (
                summary!.entries.slice(0, 5).map(e => (
                  <View key={e.id} style={styles.entryRow}>
                    <View style={[styles.entryIcon, {
                      backgroundColor: e.type === 'income' ? colors.successLight : colors.errorLight,
                    }]}>
                      <Ionicons
                        name={e.type === 'income' ? 'arrow-up' : 'arrow-down'}
                        size={16}
                        color={e.type === 'income' ? colors.secondary : colors.danger}
                      />
                    </View>
                    <View style={styles.entryInfo}>
                      <Text style={styles.entryLabel} numberOfLines={1}>{e.label}</Text>
                      <Text style={styles.entryDate}>{fmtDate(e.date)}</Text>
                    </View>
                    <Text style={[styles.entryAmount, {
                      color: e.type === 'income' ? colors.secondary : colors.danger,
                    }]}>
                      {e.type === 'income' ? '+' : '-'}{fmt(Number(e.amount))}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Day detail modal */}
      <Modal
        visible={dayModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDayModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.overlay}
            activeOpacity={1}
            onPress={() => setDayModalVisible(false)}
          />
          <View style={styles.daySheet}>
            <View style={styles.handle} />
            <Text style={styles.dayTitle}>
              {selectedDay} {MONTHS_TR[curMonth.month]} {curMonth.year}
            </Text>
            {selectedEntries.length === 0 && selectedReminders.length === 0 ? (
              <Text style={styles.emptyText}>Bu gün için kayıt yok</Text>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {selectedEntries.map(e => (
                  <View key={e.id} style={styles.entryRow}>
                    <View style={[styles.entryIcon, {
                      backgroundColor: e.type === 'income' ? colors.successLight : colors.errorLight,
                    }]}>
                      <Ionicons
                        name={e.type === 'income' ? 'arrow-up' : 'arrow-down'}
                        size={16}
                        color={e.type === 'income' ? colors.secondary : colors.danger}
                      />
                    </View>
                    <View style={styles.entryInfo}>
                      <Text style={styles.entryLabel} numberOfLines={1}>{e.label}</Text>
                      {e.note ? <Text style={styles.entryDate}>{e.note}</Text> : null}
                    </View>
                    <Text style={[styles.entryAmount, {
                      color: e.type === 'income' ? colors.secondary : colors.danger,
                    }]}>
                      {e.type === 'income' ? '+' : '-'}{fmt(Number(e.amount))}
                    </Text>
                  </View>
                ))}
                {selectedReminders.length > 0 && (
                  <>
                    {selectedEntries.length > 0 && <View style={styles.modalDivider} />}
                    <Text style={styles.modalSubTitle}>Hatırlatmalar</Text>
                    {selectedReminders.map(r => (
                      <View key={r.id} style={styles.entryRow}>
                        <View style={[styles.entryIcon, { backgroundColor: colors.primaryLight }]}>
                          <Ionicons name="notifications-outline" size={16} color={colors.business} />
                        </View>
                        <View style={styles.entryInfo}>
                          <Text style={styles.entryLabel}>{r.title}</Text>
                          {r.time ? <Text style={styles.entryDate}>{r.time}</Text> : null}
                          {r.note ? <Text style={styles.entryDate}>{r.note}</Text> : null}
                        </View>
                      </View>
                    ))}
                  </>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  greeting: { fontSize: 13, color: colors.text.secondary },
  userName: { fontSize: 18, fontWeight: '700', color: colors.text.primary },
  logoutBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  logoutText: { fontSize: 13, color: colors.text.secondary, fontWeight: '600' },

  scroll: { padding: 16, gap: 12 },

  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  navBtn: { padding: 8 },
  navBtnDisabled: { opacity: 0.3 },
  monthLabel: { fontSize: 16, fontWeight: '700', color: colors.text.primary },

  heroCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  heroLabel: { fontSize: 13, color: colors.text.secondary, fontWeight: '500' },
  heroAmount: { fontSize: 34, fontWeight: '800', marginTop: 6, letterSpacing: -0.5 },
  heroSub: { fontSize: 12, color: colors.text.muted, marginTop: 4 },

  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 4,
    borderTopWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statLabel: { fontSize: 11, color: colors.text.muted, fontWeight: '500' },
  statAmount: { fontSize: 14, fontWeight: '700', color: colors.text.primary },

  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.errorLight,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  alertText: { flex: 1, fontSize: 13, color: colors.danger, fontWeight: '500' },

  section: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text.primary, marginBottom: 14 },

  calendar: { gap: 4 },
  calRow: { flexDirection: 'row' },
  calDayHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.muted,
    paddingBottom: 6,
  },
  calCell: {
    flex: 1,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    gap: 2,
  },
  calCellToday: { backgroundColor: colors.businessLight },
  calDayNum: { fontSize: 13, fontWeight: '500', color: colors.text.primary },
  calDayNumToday: { fontWeight: '800', color: colors.business },
  calDots: { flexDirection: 'row', gap: 3, minHeight: 6 },
  dot: { width: 5, height: 5, borderRadius: 3 },

  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  entryIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryInfo: { flex: 1 },
  entryLabel: { fontSize: 14, fontWeight: '600', color: colors.text.primary },
  entryDate: { fontSize: 12, color: colors.text.muted, marginTop: 2 },
  entryAmount: { fontSize: 14, fontWeight: '700' },
  emptyText: { fontSize: 14, color: colors.text.muted, textAlign: 'center', paddingVertical: 16 },

  modalContainer: { flex: 1, justifyContent: 'flex-end' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  daySheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '60%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 20,
  },
  dayTitle: { fontSize: 17, fontWeight: '700', color: colors.text.primary, marginBottom: 16 },
  modalDivider: { height: 1, backgroundColor: colors.border, marginVertical: 12 },
  modalSubTitle: { fontSize: 13, fontWeight: '600', color: colors.text.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
});
