import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://172.29.35.177:3000';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000,
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
  changePassword: (currentPassword: string, newPassword: string) =>
    api.patch('/api/auth/password', { currentPassword, newPassword }),
  updateProfile: (name: string) =>
    api.patch('/api/auth/profile', { name }),
  deleteAccount: () =>
    api.delete('/api/auth/account'),
  forgotPassword: (email: string) =>
    api.post('/api/auth/forgot-password', { email }),
  verifyOtp: (email: string, otp: string) =>
    api.post('/api/auth/verify-otp', { email, otp }),
  resetPassword: (resetToken: string, newPassword: string) =>
    api.post('/api/auth/reset-password', { resetToken, newPassword }),
};

export const personalAPI = {
  addEntry: (data: { amount: number; category: string; date: string; note?: string }) =>
    api.post('/api/expenses', data),
  getSummary: (month: string) =>
    api.get(`/api/expenses/summary?month=${month}`),
  suggestCategory: (note: string, amount: number) =>
    api.post('/api/expenses/suggest-category', { note, amount }),
  analyzeExpenses: (month?: string) =>
    api.get(`/api/expenses/analyze${month ? `?month=${month}` : ''}`),
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

export const businessAPI = {
  getCashflowSummary: () =>
    api.get('/api/cashflow/summary'),
  getForecast: (period: 'short' | 'medium' | 'long' = 'short') =>
    api.post('/api/cashflow/forecast', { period }),
  addExpense: (data: { amount: number; category: string; date: string; description?: string }) =>
    api.post('/api/cashflow/expense', data),
  addIncome: (data: { amount: number; source: string; date: string; description?: string }) =>
    api.post('/api/cashflow/income', data),
  analyzeExpenses: () =>
    api.post('/api/cashflow/analyze-expenses'),

  getCollections: () =>
    api.get('/api/collection'),
  addCollection: (data: { customerName: string; amount: number; dueDate: string }) =>
    api.post('/api/collection', data),
  markCollectionPaid: (id: string) =>
    api.patch(`/api/collection/${id}/paid`),
  deleteCollection: (id: string) =>
    api.delete(`/api/collection/${id}`),
  analyzeCollections: () =>
    api.post('/api/collection/analyze'),

  analyzeSupplier: (data: { supplierName: string; productType?: string; estimatedAmount?: number }) =>
    api.post('/api/supplier/analyze', data),

  getSummaryByRange: (start: string, end: string) =>
    api.get('/api/cashflow/summary-by-range', { params: { start, end } }),
};

export const marketplaceAPI = {
  getAll: (params?: { category?: string; city?: string; search?: string }) =>
    api.get('/api/marketplace', { params }),
  getMine: () =>
    api.get('/api/marketplace/mine'),
  getById: (id: string) =>
    api.get(`/api/marketplace/${id}`),
  create: (data: {
    title: string;
    category: string;
    description?: string;
    unitPrice: number;
    currency: string;
    minOrderQty: number;
    unit: string;
    totalStock?: number;
    deliveryTime?: string;
    deliveryMethod?: string;
    paymentTerms?: string;
    contactPreference: string[];
    city: string;
  }) => api.post('/api/marketplace', data),
  updateStatus: (id: string, status: 'active' | 'passive' | 'sold') =>
    api.patch(`/api/marketplace/${id}/status`, { status }),
  remove: (id: string) =>
    api.delete(`/api/marketplace/${id}`),
};

export const ordersAPI = {
  create: (data: {
    role: 'buyer' | 'seller';
    otherPartyName: string;
    productName: string;
    quantity: number;
    unit?: string;
    unitPrice: number;
    currency?: string;
    note?: string;
  }) => api.post('/api/orders', data),
  getOrders: (role?: 'buyer' | 'seller') =>
    api.get('/api/orders', { params: role ? { role } : undefined }),
  updateStatus: (id: string, status: string) =>
    api.patch(`/api/orders/${id}/status`, { status }),
  deleteOrder: (id: string) =>
    api.delete(`/api/orders/${id}`),
};

export const messagesAPI = {
  startOrGetConversation: (listingId: string, sellerId: string) =>
    api.post('/api/messages/conversation', { listingId, sellerId }),
  getConversations: () =>
    api.get('/api/messages/conversations'),
  getMessages: (conversationId: number, after?: number) =>
    api.get(`/api/messages/${conversationId}`, { params: after ? { after } : undefined }),
  sendMessage: (conversationId: number, content: string) =>
    api.post(`/api/messages/${conversationId}`, { content }),
  markRead: (conversationId: number) =>
    api.put(`/api/messages/${conversationId}/read`),
  deleteConversation: (conversationId: number) =>
    api.delete(`/api/messages/${conversationId}`),
};

export default api;
