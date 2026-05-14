import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ModeSelectScreen from '../screens/onboarding/ModeSelectScreen';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ModeSelect: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ModeSelect" component={ModeSelectScreen} />
    </Stack.Navigator>
  );
}
