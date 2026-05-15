import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../../constants/colors';
import { ToolsStackParamList } from '../../navigation/PersonalTabNavigator';

type Nav = NativeStackNavigationProp<ToolsStackParamList>;

const SECTIONS = [
  {
    title: 'Finansal Araçlar',
    items: [
      { label: 'Abonelikler', icon: 'card-outline' as const, screen: 'Subscriptions' as const, desc: 'Aylık aboneliklerini takip et' },
      { label: 'Borçlarım', icon: 'trending-down-outline' as const, screen: 'Debt' as const, desc: 'Borç ve alacaklarını yönet' },
      { label: 'Taksitler', icon: 'calendar-outline' as const, screen: 'Installments' as const, desc: 'Taksitli ödemelerin' },
      { label: 'Notlar', icon: 'document-text-outline' as const, screen: 'Notes' as const, desc: 'Finansal notların' },
    ],
  },
  {
    title: 'Analiz & Güvenlik',
    items: [
      { label: 'GüvenliAlış', icon: 'shield-checkmark-outline' as const, screen: 'ShopCheck' as const, desc: 'Site güvenliğini kontrol et' },
      { label: 'Finansal Sağlık', icon: 'heart-outline' as const, screen: 'HealthScore' as const, desc: 'Finansal sağlık skorun' },
      { label: 'Döviz Kurları', icon: 'cash-outline' as const, screen: 'ExchangeRates' as const, desc: 'Güncel döviz ve altın' },
    ],
  },
];

export default function ToolsMenuScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {SECTIONS.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.items.map((item) => (
            <TouchableOpacity
              key={item.screen}
              style={styles.row}
              onPress={() => navigation.navigate(item.screen)}
              activeOpacity={0.7}
            >
              <View style={styles.iconWrap}>
                <Ionicons name={item.icon} size={22} color={colors.personal} />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>{item.label}</Text>
                <Text style={styles.rowDesc}>{item.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.text.muted} />
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 32 },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.personalLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowText: { flex: 1 },
  rowLabel: { fontSize: 15, fontWeight: '600', color: colors.text.primary },
  rowDesc: { fontSize: 12, color: colors.text.muted, marginTop: 2 },
});
