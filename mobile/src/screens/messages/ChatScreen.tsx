import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { messagesAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

type Message = {
  id: number;
  conversation_id: number;
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
};

const formatMsgTime = (dateStr: string) =>
  new Date(dateStr).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

export default function ChatScreen({ route, navigation }: { route: any; navigation: any }) {
  const { conversationId, listingTitle, otherName } = route.params;
  const { user } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const lastIdRef = useRef<number>(0);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    let active = true;

    messagesAPI.getMessages(conversationId)
      .then(res => {
        if (!active) return;
        setMessages(res.data);
        if (res.data.length > 0) lastIdRef.current = res.data[res.data.length - 1].id;
        setLoading(false);
        setLoaded(true);
        messagesAPI.markRead(conversationId).catch(() => {});
      })
      .catch(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [conversationId]);

  useEffect(() => {
    if (!loaded) return;

    const interval = setInterval(async () => {
      try {
        const res = await messagesAPI.getMessages(conversationId, lastIdRef.current || undefined);
        if (res.data.length === 0) return;
        const newMsgs = res.data.filter((m: Message) => m.id > lastIdRef.current);
        if (newMsgs.length === 0) return;
        setMessages(prev => [...prev, ...newMsgs]);
        lastIdRef.current = newMsgs[newMsgs.length - 1].id;
        messagesAPI.markRead(conversationId).catch(() => {});
      } catch {}
    }, 3000);

    return () => clearInterval(interval);
  }, [loaded, conversationId]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput('');
    setSending(true);
    try {
      const res = await messagesAPI.sendMessage(conversationId, text);
      setMessages(prev => [...prev, res.data]);
      lastIdRef.current = res.data.id;
    } catch {
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMine = item.sender_id === user?.id;
    return (
      <View style={[styles.msgRow, isMine ? styles.msgRowRight : styles.msgRowLeft]}>
        <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
          <Text style={[styles.bubbleText, isMine ? styles.bubbleTextMine : styles.bubbleTextOther]}>
            {item.content}
          </Text>
          <Text style={[styles.msgTime, isMine ? styles.msgTimeMine : styles.msgTimeOther]}>
            {formatMsgTime(item.created_at)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName} numberOfLines={1}>{otherName}</Text>
          <Text style={styles.headerListing} numberOfLines={1}>{listingTitle}</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.business} />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={m => m.id.toString()}
            renderItem={renderMessage}
            contentContainerStyle={styles.msgList}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              <View style={styles.emptyChat}>
                <Ionicons name="chatbubble-outline" size={40} color={colors.text.muted} />
                <Text style={styles.emptyChatText}>Konuşmayı başlatın</Text>
              </View>
            }
          />
        )}

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Mesaj yazın..."
            placeholderTextColor={colors.text.muted}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={1000}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!input.trim() || sending}
          >
            {sending
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name="send" size={18} color="#fff" />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 10,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 16, fontWeight: '700', color: colors.text.primary },
  headerListing: { fontSize: 12, color: colors.business, fontWeight: '500', marginTop: 1 },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  msgList: { padding: 12, gap: 6, paddingBottom: 8 },

  msgRow: { flexDirection: 'row', marginVertical: 2 },
  msgRowRight: { justifyContent: 'flex-end' },
  msgRowLeft: { justifyContent: 'flex-start' },

  bubble: {
    maxWidth: '75%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 6,
  },
  bubbleMine: {
    backgroundColor: colors.business,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: '#F1F5F9',
    borderBottomLeftRadius: 4,
  },
  bubbleText: { fontSize: 15, lineHeight: 21 },
  bubbleTextMine: { color: '#fff' },
  bubbleTextOther: { color: colors.text.primary },
  msgTime: { fontSize: 10, marginTop: 4, textAlign: 'right' },
  msgTimeMine: { color: 'rgba(255,255,255,0.65)' },
  msgTimeOther: { color: colors.text.muted },

  emptyChat: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 10 },
  emptyChatText: { fontSize: 14, color: colors.text.muted },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text.primary,
    maxHeight: 120,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.business,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.45 },
});
