import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';

import DashboardScreen from '../screens/personal/DashboardScreen';
import BudgetScreen from '../screens/personal/BudgetScreen';
import CoachScreen from '../screens/personal/CoachScreen';
import SavingsGoalsScreen from '../screens/personal/SavingsGoalsScreen';
import ToolsMenuScreen from '../screens/personal/ToolsMenuScreen';
import SubscriptionsScreen from '../screens/personal/SubscriptionsScreen';
import DebtTrackerScreen from '../screens/personal/DebtTrackerScreen';
import InstallmentsScreen from '../screens/personal/InstallmentsScreen';
import NotesScreen from '../screens/personal/NotesScreen';
import ShopCheckScreen from '../screens/personal/ShopCheckScreen';
import HealthScoreScreen from '../screens/shared/HealthScoreScreen';
import ExchangeRatesScreen from '../screens/shared/ExchangeRatesScreen';

export type PersonalTabParamList = {
  Dashboard: undefined;
  Budget: undefined;
  Coach: undefined;
  Goals: undefined;
  Tools: undefined;
};

export type ToolsStackParamList = {
  ToolsMenu: undefined;
  Subscriptions: undefined;
  Debt: undefined;
  Installments: undefined;
  Notes: undefined;
  ShopCheck: undefined;
  HealthScore: undefined;
  ExchangeRates: undefined;
};

const Tab = createBottomTabNavigator<PersonalTabParamList>();
const ToolsStack = createNativeStackNavigator<ToolsStackParamList>();

function ToolsNavigator() {
  return (
    <ToolsStack.Navigator>
      <ToolsStack.Screen name="ToolsMenu" component={ToolsMenuScreen} options={{ title: 'Araçlar' }} />
      <ToolsStack.Screen name="Subscriptions" component={SubscriptionsScreen} options={{ title: 'Abonelikler' }} />
      <ToolsStack.Screen name="Debt" component={DebtTrackerScreen} options={{ title: 'Borçlarım' }} />
      <ToolsStack.Screen name="Installments" component={InstallmentsScreen} options={{ title: 'Taksitler' }} />
      <ToolsStack.Screen name="Notes" component={NotesScreen} options={{ title: 'Notlar' }} />
      <ToolsStack.Screen name="ShopCheck" component={ShopCheckScreen} options={{ title: 'GüvenliAlış' }} />
      <ToolsStack.Screen name="HealthScore" component={HealthScoreScreen} options={{ title: 'Finansal Sağlık' }} />
      <ToolsStack.Screen name="ExchangeRates" component={ExchangeRatesScreen} options={{ title: 'Döviz' }} />
    </ToolsStack.Navigator>
  );
}

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<string, { active: IoniconName; inactive: IoniconName }> = {
  Dashboard: { active: 'home', inactive: 'home-outline' },
  Budget: { active: 'wallet', inactive: 'wallet-outline' },
  Coach: { active: 'school', inactive: 'school-outline' },
  Goals: { active: 'flag', inactive: 'flag-outline' },
  Tools: { active: 'apps', inactive: 'apps-outline' },
};

const TAB_LABELS: Record<string, string> = {
  Dashboard: 'Ana Sayfa',
  Budget: 'Bütçe',
  Coach: 'Koç',
  Goals: 'Hedefler',
  Tools: 'Araçlar',
};

export default function PersonalTabNavigator() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name];
          return <Ionicons name={focused ? icons.active : icons.inactive} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.personal,
        tabBarInactiveTintColor: colors.text.muted,
        tabBarLabel: TAB_LABELS[route.name],
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingBottom: insets.bottom + 4,
          paddingTop: 4,
          height: 60 + insets.bottom,
        },
        headerStyle: { backgroundColor: colors.card },
        headerTitleStyle: { color: colors.text.primary, fontWeight: '600' },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Ana Sayfa', headerShown: false }} />
      <Tab.Screen name="Budget" component={BudgetScreen} options={{ title: 'Bütçe' }} />
      <Tab.Screen name="Coach" component={CoachScreen} options={{ title: 'FinansKoç' }} />
      <Tab.Screen name="Goals" component={SavingsGoalsScreen} options={{ title: 'Hedefler' }} />
      <Tab.Screen name="Tools" component={ToolsNavigator} options={{ title: 'Araçlar', headerShown: false }} />
    </Tab.Navigator>
  );
}
