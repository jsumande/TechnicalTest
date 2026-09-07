'use client';

/**
 * Auth context.
 *
 * Provides:
 *  - `user`           — the current user (null if not logged in)
 *  - `isSubscribed`   — true when user.subscriptionStatus === 'active'
 *  - `isLoading`      — true while /api/auth/me is being fetched
 *  - `login(email, password)` — authenticates and sets user
 *  - `logout()`       — clears session
 *  - `refreshUser()`  — re-fetches /api/auth/me
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AxiosError } from 'axios';
import api from '@/lib/api';
import type { User, AuthMeResponse } from '@/types';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: User | null;
  isSubscribed: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isSubscribed = user?.subscriptionStatus === 'active';

  const refreshUser = async (): Promise<void> => {
    try {
      const res = await api.get<AuthMeResponse>('/api/auth/me');
      setUser(res.data.user);
    } catch (err) {
      const axiosErr = err as AxiosError;
      if (axiosErr.response?.status === 401) {
        setUser(null);
      } else {
        console.error('[AuthContext] Failed to fetch /me:', err);
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    await api.post('/api/auth/login', { email, password });
    await refreshUser();
  };

  const logout = async (): Promise<void> => {
    try {
      await api.post('/api/auth/logout');
    } catch {
      // Silently clear local state
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isSubscribed, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside an <AuthProvider>');
  }
  return ctx;
}
