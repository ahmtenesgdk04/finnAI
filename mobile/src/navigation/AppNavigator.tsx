import React from 'react';
import { useAuth } from '../hooks/useAuth';
import AuthNavigator from './AuthNavigator';
import BusinessTabNavigator from './BusinessTabNavigator';
import PersonalTabNavigator from './PersonalTabNavigator';
import ModeSelectScreen from '../screens/onboarding/ModeSelectScreen';

export default function AppNavigator() {
  const { token, mode } = useAuth();

  if (!token) return <AuthNavigator />;
  if (!mode) return <ModeSelectScreen />;
  if (mode === 'business') return <BusinessTabNavigator />;
  return <PersonalTabNavigator />;
}
