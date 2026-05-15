import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../constants/colors';
import { theme } from '../../constants/theme';
import Button from '../../components/common/Button';

export default function ModeSelectScreen() {
  const [selected, setSelected] = useState<'personal' | 'business' | null>(null);
  const navigation = useNavigation<any>();

  const handleContinue = async () => {
    if (!selected) { Alert.alert('Uyarı', 'Lütfen bir mod seçin'); return; }
    await AsyncStorage.setItem('mode', selected);
    navigation.reset({ index: 0, routes: [{ name: selected === 'personal' ? 'Personal' : 'Business' }] });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>FinnAI'ya Hoş Geldiniz!</Text>
      <Text style={styles.subtitle}>Hangi mod için kullanıyorsunuz?</Text>

      <View style={styles.cards}>
        <TouchableOpacity
          style={[styles.card, selected === 'personal' && styles.cardSelected]}
          onPress={() => setSelected('personal')}
        >
          <Ionicons name="person-circle-outline" size={48} color={selected === 'personal' ? '#fff' : colors.personal} />
          <Text style={[styles.cardTitle, selected === 'personal' && styles.cardTitleSelected]}>Kişisel Mod</Text>
          <Text style={[styles.cardDesc, selected === 'personal' && styles.cardDescSelected]}>
            Harcama takibi, birikim, FinansKoç
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, selected === 'business' && styles.cardSelectedBiz]}
          onPress={() => setSelected('business')}
        >
          <Ionicons name="business-outline" size={48} color={selected === 'business' ? '#fff' : colors.business} />
          <Text style={[styles.cardTitle, selected === 'business' && styles.cardTitleSelected]}>İşletme Modu</Text>
          <Text style={[styles.cardDesc, selected === 'business' && styles.cardDescSelected]}>
            Nakit akışı, tahsilat, tedarikçi
          </Text>
        </TouchableOpacity>
      </View>

      <Button title="Devam Et" onPress={handleContinue} disabled={!selected} style={styles.btn} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: colors.background,
    justifyContent: 'center', padding: theme.spacing.xl, gap: theme.spacing.xl,
  },
  title: { ...theme.typography.h1, color: colors.text.primary, textAlign: 'center' },
  subtitle: { ...theme.typography.body, color: colors.text.secondary, textAlign: 'center' },
  cards: { gap: theme.spacing.md },
  card: {
    backgroundColor: colors.card, borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl, alignItems: 'center', gap: theme.spacing.sm,
    borderWidth: 2, borderColor: 'transparent', ...theme.shadow.card,
  },
  cardSelected: { backgroundColor: colors.personal, borderColor: colors.personal },
  cardSelectedBiz: { backgroundColor: colors.business, borderColor: colors.business },
  cardTitle: { ...theme.typography.h3, color: colors.text.primary },
  cardTitleSelected: { color: '#fff' },
  cardDesc: { ...theme.typography.body, color: colors.text.secondary, textAlign: 'center' },
  cardDescSelected: { color: 'rgba(255,255,255,0.85)' },
  btn: { marginTop: theme.spacing.sm },
});
