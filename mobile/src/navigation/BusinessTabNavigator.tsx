import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { useAuth } from '../hooks/useAuth';

const Tab = createBottomTabNavigator();

// İşletme dashboard placeholder — Gün 3'te gerçek implementasyon
function BusinessDashboard() {
  const { logout, user } = useAuth();
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hoş geldin 👋</Text>
          <Text style={styles.name}>{user?.name || 'Kullanıcı'}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Çıkış</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.modeTag}>
        <Text style={styles.modeTagText}>🏢 İşletme Modu</Text>
      </View>

      <View style={styles.placeholder}>
        <Text style={styles.placeholderEmoji}>🚀</Text>
        <Text style={styles.placeholderTitle}>İşletme Dashboard'u</Text>
        <Text style={styles.placeholderSub}>
          Gün 3'te: Akıllı Gider Analizi, NakitRadar,{'\n'}TahsilatAI ve daha fazlası
        </Text>
      </View>
    </SafeAreaView>
  );
}

function PlaceholderScreen({ title }: { title: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.placeholderTitle}>{title}</Text>
      <Text style={styles.placeholderSub}>Yakında gelecek</Text>
    </View>
  );
}

export default function BusinessTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.business,
        tabBarInactiveTintColor: colors.textLight,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingBottom: 4,
        },
      }}
    >
      <Tab.Screen
        name="Ana Sayfa"
        component={BusinessDashboard}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="İşlemler"
        component={() => <PlaceholderScreen title="Gelir & Gider" />}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="swap-horizontal-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="AI Araçlar"
        component={() => <PlaceholderScreen title="AI Modüller" />}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="sparkles-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Ayarlar"
        component={() => <PlaceholderScreen title="Ayarlar" />}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  greeting: { fontSize: 13, color: colors.textSecondary },
  name: { fontSize: 18, fontWeight: '700', color: colors.text },
  logoutBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  logoutText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  modeTag: {
    marginHorizontal: 24,
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.businessLight,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  modeTagText: { fontSize: 13, fontWeight: '600', color: colors.business },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  placeholderEmoji: { fontSize: 56, marginBottom: 16 },
  placeholderTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 8 },
  placeholderSub: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
});
