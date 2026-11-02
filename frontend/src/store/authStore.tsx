import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { loginApi, logoutApi } from '@/api/auth';
import { TOKEN_KEY, REFRESH_KEY } from '@/api/client';
import type { AuthUser } from '@bccs/shared';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

function parseStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem('bccs_user');
    if (raw) return JSON.parse(raw) as AuthUser;
  } catch { /* corrupted storage */ }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => parseStoredUser());
  const [isLoading, setIsLoading] = useState(false);

  const isAuthenticated = user !== null && !!localStorage.getItem(TOKEN_KEY);

  const login = useCallback(async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await loginApi(username, password);
      localStorage.setItem(TOKEN_KEY, result.accessToken);
      localStorage.setItem(REFRESH_KEY, result.refreshToken);
      localStorage.setItem('bccs_user', JSON.stringify(result.user));
      setUser(result.user);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch { /* best-effort */ }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem('bccs_user');
    setUser(null);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token && user) {
      setUser(null);
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
