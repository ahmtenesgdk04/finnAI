import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useApi<T>(apiFn: () => Promise<{ data: T }>, immediate = true) {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: immediate,
    error: null,
  });

  const execute = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await apiFn();
      setState({ data: response.data, loading: false, error: null });
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Bir hata oluştu';
      setState((prev) => ({ ...prev, loading: false, error: message }));
      throw err;
    }
  }, [apiFn]);

  useFocusEffect(
    useCallback(() => {
      if (immediate) execute();
    }, [execute, immediate])
  );

  return { ...state, refetch: execute };
}

export function useApiMutation<T, P>(apiFn: (params: P) => Promise<{ data: T }>) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(async (params: P): Promise<T> => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFn(params);
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Bir hata oluştu';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFn]);

  return { mutate, loading, error };
}
