import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { useAuth } from '../hooks/useAuth';
import CashflowScreen from '../screens/business/CashflowScreen';
import ExpenseAnalysisScreen from '../screens/business/ExpenseAnalysisScreen';
import CollectionsScreen from '../screens/business/CollectionsScreen';
import SupplierCheckScreen from '../screens/business/SupplierCheckScreen';

const Tab = createBottomTabNavigator();
const AIStack = createNativeStackNavigator();

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
          Akıllı Gider Analizi, NakitRadar,{'\n'}TahsilatAI ve daha fazlası
        </Text>
      </View>
    </SafeAreaView>
  );
}

function PlaceholderScreen({ title }: { title: string }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.placeholder}>
        <Text style={styles.placeholderTitle}>{title}</Text>
        <Text style={styles.placeholderSub}>Yakında gelecek</Text>
      </View>
    </SafeAreaView>
  );
}

function AIMenuScreen({ navigation }: { navigation: any }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.aiMenuContent}>
        <Text style={styles.aiMenuTitle}>AI Modüller</Text>
        <Text style={styles.aiMenuSub}>Yapay zeka destekli iş araçları</Text>

        <TouchableOpacity
          style={styles.aiMenuItem}
          onPress={() => navigation.navigate('NakitRadar')}
        >
          <View style={[styles.aiMenuIcon, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="radio-outline" size={26} color={colors.business} />
          </View>
          <View style={styles.aiMenuText}>
            <Text style={styles.aiMenuItemTitle}>NakitRadar</Text>
            <Text style={styles.aiMenuItemSub}>30-60-90 günlük nakit akışı tahmini</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.text.muted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.aiMenuItem}
          onPress={() => navigation.navigate('AkilliGiderAnalizi')}
        >
          <View style={[styles.aiMenuIcon, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="document-text-outline" size={26} color={colors.warning} />
          </View>
          <View style={styles.aiMenuText}>
            <Text style={styles.aiMenuItemTitle}>Akıllı Gider Analizi</Text>
            <Text style={styles.aiMenuItemSub}>AI destekli gider optimizasyonu</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.text.muted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.aiMenuItem}
          onPress={() => navigation.navigate('TahsilatAI')}
        >
          <View style={[styles.aiMenuIcon, { backgroundColor: '#FEE2E2' }]}>
            <Ionicons name="people-outline" size={26} color={colors.danger} />
          </View>
          <View style={styles.aiMenuText}>
            <Text style={styles.aiMenuItemTitle}>TahsilatAI</Text>
            <Text style={styles.aiMenuItemSub}>Müşteri ödeme skoru + takip</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.text.muted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.aiMenuItem}
          onPress={() => navigation.navigate('GuvenlIAlis')}
        >
          <View style={[styles.aiMenuIcon, { backgroundColor: '#ECFDF5' }]}>
            <Ionicons name="shield-checkmark-outline" size={26} color={colors.secondary} />
          </View>
          <View style={styles.aiMenuText}>
            <Text style={styles.aiMenuItemTitle}>GüvenliAlış</Text>
            <Text style={styles.aiMenuItemSub}>5 katmanlı tedarikçi analizi</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.text.muted} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function AIAraclarNavigator() {
  return (
    <AIStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTitleStyle: { color: colors.text.primary, fontWeight: '600' },
        headerTintColor: colors.business,
      }}
    >
      <AIStack.Screen name="AIMenu" component={AIMenuScreen} options={{ title: 'AI Araçlar', headerShown: false }} />
      <AIStack.Screen name="NakitRadar" component={CashflowScreen} options={{ title: 'NakitRadar', headerShown: false }} />
      <AIStack.Screen name="AkilliGiderAnalizi" component={ExpenseAnalysisScreen} options={{ title: 'Akıllı Gider Analizi', headerShown: false }} />
      <AIStack.Screen name="TahsilatAI" component={CollectionsScreen} options={{ title: 'TahsilatAI', headerShown: false }} />
      <AIStack.Screen name="GuvenlIAlis" component={SupplierCheckScreen} options={{ title: 'GüvenliAlış', headerShown: false }} />
    </AIStack.Navigator>
  );
}

function IslemlerScreen() { return <PlaceholderScreen title="Gelir & Gider" />; }
function AyarlarScreen() { return <PlaceholderScreen title="Ayarlar" />; }

export default function BusinessTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.business,
        tabBarInactiveTintColor: colors.text.muted,
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
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="İşlemler"
        component={IslemlerScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="swap-horizontal-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="AI Araçlar"
        component={AIAraclarNavigator}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="sparkles-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Ayarlar"
        component={AyarlarScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} />,
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
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  greeting: { fontSize: 13, color: colors.text.secondary },
  name: { fontSize: 18, fontWeight: '700', color: colors.text.primary },
  logoutBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  logoutText: { fontSize: 13, color: colors.text.secondary, fontWeight: '600' },
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
  placeholderTitle: { fontSize: 20, fontWeight: '700', color: colors.text.primary, marginBottom: 8 },
  placeholderSub: { fontSize: 14, color: colors.text.secondary, textAlign: 'center', lineHeight: 22 },

  aiMenuContent: { flex: 1, padding: 24, paddingTop: 32, gap: 16 },
  aiMenuTitle: { fontSize: 22, fontWeight: '700', color: colors.text.primary },
  aiMenuSub: { fontSize: 14, color: colors.text.secondary, marginBottom: 8 },
  aiMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  aiMenuItemDisabled: { opacity: 0.65 },
  aiMenuIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  aiMenuText: { flex: 1 },
  aiMenuItemTitle: { fontSize: 16, fontWeight: '700', color: colors.text.primary },
  aiMenuItemSub: { fontSize: 12, color: colors.text.secondary, marginTop: 2 },
  comingSoon: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
  },
  comingSoonText: { fontSize: 11, fontWeight: '600', color: colors.text.muted },
});
