import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://172.29.35.177:3000';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/api/auth/login', { email, password }),
  register: (data: { name: string; email: string; password: string; mode: string }) =>
    api.post('/api/auth/register', data),
  me: () => api.get('/api/auth/me'),
};

export const personalAPI = {
  addEntry: (data: { amount: number; category: string; date: string; note?: string }) =>
    api.post('/api/budget/entry', data),
  getSummary: (month: string) =>
    api.get(`/api/budget/summary?month=${month}`),
  analyzeBudget: () =>
    api.post('/api/budget/analyze'),
  setLimit: (data: { category: string; monthlyLimit: number }) =>
    api.post('/api/budget/limit', data),

  createGoal: (data: { name: string; targetAmount: number; targetDate: string; currentAmount: number }) =>
    api.post('/api/budget/goals', data),
  getGoals: () => api.get('/api/budget/goals'),
  updateGoal: (id: string, data: Partial<{ name: string; targetAmount: number; targetDate: string; currentAmount: number }>) =>
    api.patch(`/api/budget/goals/${id}`, data),
  deleteGoal: (id: string) => api.delete(`/api/budget/goals/${id}`),

  getLesson: (data: { topic?: string; triggerModule?: string; userLevel: number }) =>
    api.post('/api/coach/lesson', data),
  getCoachLevel: () => api.get('/api/coach/level'),
  submitQuizResult: (data: { lessonId: string; correct: boolean }) =>
    api.post('/api/coach/quiz-result', data),
  askCoach: (question: string) => api.post('/api/coach/ask', { question }),

  analyzeShop: (url: string) => api.post('/api/safe-shop/analyze', { url }),

  getHealthScore: () => api.get('/api/health-score'),
  getExchangeRates: () => api.get('/api/exchange-rates'),
};

export const businessAPI = {};

export default api;
