import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  Modal, StyleSheet, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../../constants/colors';
import { theme } from '../../constants/theme';
import { formatDate } from '../../utils/formatters';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';

const CATEGORIES = ['Vergi', 'Toplantı', 'Ödeme', 'Yatırım', 'Genel'];

interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  date: string;
  reminder?: string;
}

const STORAGE_KEY = 'fin_notes';

export default function NotesScreen() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Genel');
  const [reminder, setReminder] = useState('');
  const [showCatModal, setShowCatModal] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      AsyncStorage.getItem(STORAGE_KEY).then((val) => {
        if (val) setNotes(JSON.parse(val));
      });
    }, [])
  );

  const save = async (list: Note[]) => {
    setNotes(list);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  };

  const handleAdd = async () => {
    if (!title.trim()) {
      Alert.alert('Uyarı', 'Başlık zorunludur');
      return;
    }
    const note: Note = {
      id: Date.now().toString(),
      title, content, category,
      date: new Date().toISOString().split('T')[0],
      reminder: reminder || undefined,
    };
    await save([note, ...notes]);
    setTitle(''); setContent(''); setCategory('Genel'); setReminder('');
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Sil', 'Bu notu silmek istiyor musunuz?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => save(notes.filter((n) => n.id !== id)) },
    ]);
  };

  const CAT_COLORS: Record<string, string> = {
    Vergi: '#FEE2E2', Toplantı: '#DBEAFE', Ödeme: '#FEF3C7',
    Yatırım: '#D1FAE5', Genel: '#F3F4F6',
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={notes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            icon="document-text-outline"
            title="Not yok"
            description="Finansal notlar ve hatırlatmalar ekleyin"
            actionLabel="Not Ekle"
            onAction={() => setShowForm(true)}
          />
        }
        ListHeaderComponent={
          notes.length > 0 ? (
            <TouchableOpacity style={styles.addRow} onPress={() => setShowForm(true)}>
              <Ionicons name="add-circle" size={22} color={colors.personal} />
              <Text style={styles.addRowText}>Not Ekle</Text>
            </TouchableOpacity>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={[styles.noteCard, { borderLeftColor: CAT_COLORS[item.category] || '#F3F4F6' }]}>
            <View style={styles.noteHeader}>
              <View style={[styles.catBadge, { backgroundColor: CAT_COLORS[item.category] || '#F3F4F6' }]}>
                <Text style={styles.catBadgeText}>{item.category}</Text>
              </View>
              <TouchableOpacity onPress={() => handleDelete(item.id)}>
                <Ionicons name="trash-outline" size={16} color={colors.text.muted} />
              </TouchableOpacity>
            </View>
            <Text style={styles.noteTitle}>{item.title}</Text>
            {item.content ? <Text style={styles.noteContent}>{item.content}</Text> : null}
            <View style={styles.noteMeta}>
              <Text style={styles.noteDate}>{formatDate(item.date)}</Text>
              {item.reminder && (
                <View style={styles.reminderRow}>
                  <Ionicons name="alarm-outline" size={12} color={colors.warning} />
                  <Text style={styles.reminderText}>{item.reminder}</Text>
                </View>
              )}
            </View>
          </View>
        )}
      />

      <Modal visible={showForm} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Not Ekle</Text>
              <TouchableOpacity onPress={() => setShowForm(false)}>
                <Ionicons name="close" size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>
            <TextInput style={styles.input} placeholder="Başlık" value={title} onChangeText={setTitle} />
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              placeholder="İçerik (opsiyonel)"
              multiline value={content} onChangeText={setContent}
            />
            <TouchableOpacity style={styles.catSelect} onPress={() => setShowCatModal(true)}>
              <Text style={styles.catSelectText}>{category}</Text>
              <Ionicons name="chevron-down" size={18} color={colors.text.secondary} />
            </TouchableOpacity>
            <TextInput style={styles.input} placeholder="Hatırlatma tarihi (YYYY-AA-GG)" value={reminder} onChangeText={setReminder} />
            <Button title="Kaydet" onPress={handleAdd} />
          </View>
        </View>
      </Modal>

      <Modal visible={showCatModal} transparent animationType="fade">
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowCatModal(false)}>
          <View style={styles.catSheet}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat} style={styles.catItem}
                onPress={() => { setCategory(cat); setShowCatModal(false); }}
              >
                <Text style={styles.catItemText}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: theme.spacing.md, gap: theme.spacing.sm, paddingBottom: 32 },
  addRow: {
    flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  addRowText: { ...theme.typography.body, color: colors.personal, fontWeight: '600' },
  noteCard: {
    backgroundColor: colors.card, borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md, gap: 6, borderLeftWidth: 4, ...theme.shadow.card,
  },
  noteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  catBadge: { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3 },
  catBadgeText: { fontSize: 11, fontWeight: '600', color: colors.text.secondary },
  noteTitle: { ...theme.typography.body, fontWeight: '700', color: colors.text.primary },
  noteContent: { ...theme.typography.body, color: colors.text.secondary, lineHeight: 20 },
  noteMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  noteDate: { ...theme.typography.caption, color: colors.text.muted },
  reminderRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  reminderText: { fontSize: 11, color: colors.warning, fontWeight: '500' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: theme.spacing.lg, paddingBottom: 40, gap: theme.spacing.md,
  },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sheetTitle: { ...theme.typography.h3, color: colors.text.primary },
  input: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: theme.borderRadius.md, padding: theme.spacing.md,
    fontSize: 15, color: colors.text.primary,
  },
  catSelect: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: theme.borderRadius.md, padding: theme.spacing.md,
  },
  catSelectText: { fontSize: 15, color: colors.text.primary },
  catSheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: theme.spacing.md, paddingBottom: 40,
  },
  catItem: { paddingVertical: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  catItemText: { ...theme.typography.body, color: colors.text.primary },
});
