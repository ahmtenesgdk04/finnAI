import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { messagesAPI } from '../../services/api';

type Conversation = {
  id: number;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  created_at: string;
  listing_title: string | null;
  other_name: string | null;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: string;
};

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
};

const getInitials = (name: string | null) => {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
};

export default function ConversationsScreen({ navigation }: { navigation: any }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const handleDelete = (item: Conversation) => {
    Alert.alert(
      'Sohbeti Sil',
      `"${item.other_name || 'Kullanıcı'}" ile olan sohbet silinsin mi? Tüm mesajlar kaybolur.`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await messagesAPI.deleteConversation(item.id);
              setConversations(prev => prev.filter(c => c.id !== item.id));
            } catch {
              Alert.alert('Hata', 'Sohbet silinemedi.');
            }
          },
        },
      ]
    );
  };

  const fetchConversations = useCallback(async () => {
    try {
      const res = await messagesAPI.getConversations();
      setConversations(res.data);
    } catch {
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchConversations();
    }, [fetchConversations])
  );

  const renderItem = ({ item }: { item: Conversation }) => {
    const unread = parseInt(item.unread_count, 10);
    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() => navigation.navigate('Chat', {
          conversationId: item.id,
          listingTitle: item.listing_title || 'İlan',
          otherName: item.other_name || 'Kullanıcı',
        })}
        onLongPress={() => handleDelete(item)}
        delayLongPress={500}
        activeOpacity={0.7}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(item.other_name)}</Text>
        </View>
        <View style={styles.itemBody}>
          <View style={styles.itemTop}>
            <Text style={styles.otherName} numberOfLines={1}>{item.other_name || 'Kullanıcı'}</Text>
            {item.last_message_at && (
              <Text style={styles.timeText}>{formatTime(item.last_message_at)}</Text>
            )}
          </View>
          <Text style={styles.listingTitle} numberOfLines={1}>
            {item.listing_title || 'İlan'}
          </Text>
          <View style={styles.itemBottom}>
            <Text style={[styles.lastMessage, unread > 0 && styles.lastMessageBold]} numberOfLines={1}>
              {item.last_message || 'Henüz mesaj yok'}
            </Text>
            {unread > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mesajlar</Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.business} />
        </View>
      ) : conversations.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="chatbubbles-outline" size={52} color={colors.text.muted} />
          <Text style={styles.emptyTitle}>Henüz mesaj yok</Text>
          <Text style={styles.emptyDesc}>Pazaryerinde bir ilana tıklayıp{'\n'}"Mesaj Gönder" ile başlayın.</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={i => i.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: colors.text.primary },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colors.text.primary },
  emptyDesc: { fontSize: 14, color: colors.text.secondary, textAlign: 'center', lineHeight: 21 },

  list: { paddingVertical: 4 },
  separator: { height: 1, backgroundColor: colors.border, marginLeft: 76 },

  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.card,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { fontSize: 16, fontWeight: '700', color: colors.business },
  itemBody: { flex: 1, gap: 2 },
  itemTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  otherName: { fontSize: 15, fontWeight: '700', color: colors.text.primary, flex: 1 },
  timeText: { fontSize: 12, color: colors.text.muted, marginLeft: 8 },
  listingTitle: { fontSize: 12, color: colors.business, fontWeight: '500' },
  itemBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  lastMessage: { fontSize: 13, color: colors.text.secondary, flex: 1 },
  lastMessageBold: { fontWeight: '600', color: colors.text.primary },
  badge: {
    backgroundColor: colors.danger,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    marginLeft: 8,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});
