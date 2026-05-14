import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/common/LoadingSpinner';
import AuthNavigator from './AuthNavigator';
import PersonalTabNavigator from './PersonalTabNavigator';
import ModeSelectScreen from '../screens/onboarding/ModeSelectScreen';

export type RootStackParamList = {
  Auth: undefined;
  ModeSelect: undefined;
  Personal: undefined;
  Business: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingSpinner fullScreen />;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : !user.mode ? (
          <Stack.Screen name="ModeSelect" component={ModeSelectScreen} />
        ) : user.mode === 'personal' ? (
          <Stack.Screen name="Personal" component={PersonalTabNavigator} />
        ) : (
          <Stack.Screen name="Personal" component={PersonalTabNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
