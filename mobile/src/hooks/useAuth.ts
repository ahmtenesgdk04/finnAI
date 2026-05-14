import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';

export interface User {
  id: string;
  name: string;
  email: string;
  mode: 'personal' | 'business';
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          const { data } = await authAPI.me();
          setUser(data.user);
        }
      } catch {
        await AsyncStorage.removeItem('token');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await authAPI.login(email, password);
    await AsyncStorage.setItem('token', data.token);
    setUser(data.user);
  }, []);

  const register = useCallback(async (registerData: {
    name: string;
    email: string;
    password: string;
    mode: 'personal' | 'business';
  }) => {
    const { data } = await authAPI.register(registerData);
    await AsyncStorage.setItem('token', data.token);
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem('token');
    setUser(null);
  }, []);

  return { user, isLoading, login, register, logout };
}
