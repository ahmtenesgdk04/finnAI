import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
} from 'react-native';
import { colors } from '../../constants/colors';
import { useAuth } from '../../hooks/useAuth';

export default function ModeSelectScreen() {
  const { setMode, user } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        {/* Başlık */}
        <View style={styles.header}>
          <Text style={styles.greeting}>
            Hoş geldin{user?.name ? `, ${user.name.split(' ')[0]}` : ''}! 👋
          </Text>
          <Text style={styles.title}>FinnAI'yı nasıl{'\n'}kullanacaksın?</Text>
          <Text style={styles.subtitle}>
            İstediğin zaman değiştirebilirsin
          </Text>
        </View>

        {/* Modlar */}
        <View style={styles.cards}>
          {/* İşletme Modu */}
          <TouchableOpacity
            style={[styles.card, styles.businessCard]}
            onPress={() => setMode('business')}
            activeOpacity={0.88}
          >
            <Text style={styles.cardEmoji}>🏢</Text>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>İşletme Modu</Text>
              <Text style={styles.cardDesc}>
                KOBİ ve esnaf sahipleri için
              </Text>
              <View style={styles.tagRow}>
                <View style={[styles.tag, styles.businessTag]}>
                  <Text style={styles.tagText}>Akıllı Gider Analizi</Text>
                </View>
                <View style={[styles.tag, styles.businessTag]}>
                  <Text style={styles.tagText}>NakitRadar</Text>
                </View>
                <View style={[styles.tag, styles.businessTag]}>
                  <Text style={styles.tagText}>TahsilatAI</Text>
                </View>
              </View>
            </View>
            <View style={styles.cardArrow}>
              <Text style={styles.arrowText}>›</Text>
            </View>
          </TouchableOpacity>

          {/* Kişisel Mod */}
          <TouchableOpacity
            style={[styles.card, styles.personalCard]}
            onPress={() => setMode('personal')}
            activeOpacity={0.88}
          >
            <Text style={styles.cardEmoji}>👤</Text>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Kişisel Mod</Text>
              <Text style={styles.cardDesc}>
                Bireysel finansal yönetim için
              </Text>
              <View style={styles.tagRow}>
                <View style={[styles.tag, styles.personalTag]}>
                  <Text style={[styles.tagText, styles.personalTagText]}>BütçePilot</Text>
                </View>
                <View style={[styles.tag, styles.personalTag]}>
                  <Text style={[styles.tagText, styles.personalTagText]}>FinansKoç</Text>
                </View>
                <View style={[styles.tag, styles.personalTag]}>
                  <Text style={[styles.tagText, styles.personalTagText]}>GüvenliAlış</Text>
                </View>
              </View>
            </View>
            <View style={styles.cardArrow}>
              <Text style={[styles.arrowText, styles.personalArrow]}>›</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.hint}>
          Her iki modun verisi birbirini destekler
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  inner: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },

  header: { marginBottom: 32 },
  greeting: { fontSize: 16, color: colors.textSecondary, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, lineHeight: 36 },
  subtitle: { fontSize: 13, color: colors.textLight, marginTop: 8 },

  cards: { gap: 16 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  businessCard: { backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.businessLight },
  personalCard: { backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.personalLight },

  cardEmoji: { fontSize: 36, marginRight: 16 },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 4 },
  cardDesc: { fontSize: 13, color: colors.textSecondary, marginBottom: 10 },

  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  businessTag: { backgroundColor: colors.businessLight },
  personalTag: { backgroundColor: colors.personalLight },
  tagText: { fontSize: 11, fontWeight: '600', color: colors.business },
  personalTagText: { color: colors.personal },

  cardArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.businessLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: { fontSize: 22, color: colors.business, fontWeight: '700', marginTop: -2 },
  personalArrow: { color: colors.personal },

  hint: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.textLight,
    marginTop: 24,
  },
});
