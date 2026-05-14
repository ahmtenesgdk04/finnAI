import React, { createContext, useContext, useState } from 'react';

type Mode = 'personal' | 'business' | null;

type AuthContextType = {
  token: string | null;
  mode: Mode;
  user: { id?: number; name?: string; email?: string } | null;
  login: (token: string, mode: string | null, user?: any) => void;
  logout: () => void;
  setMode: (mode: 'personal' | 'business') => void;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [mode, setModeState] = useState<Mode>(null);
  const [user, setUser] = useState<any>(null);

  const login = (t: string, m: string | null, u?: any) => {
    setToken(t);
    setModeState((m as Mode) || null);
    if (u) setUser(u);
  };

  const logout = () => {
    setToken(null);
    setModeState(null);
    setUser(null);
  };

  const setMode = (m: 'personal' | 'business') => setModeState(m);

  return (
    <AuthContext.Provider value={{ token, mode, user, login, logout, setMode }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
