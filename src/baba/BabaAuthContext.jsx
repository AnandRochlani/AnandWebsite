import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import babaApi from '@/baba/api';

const BabaAuthContext = createContext(null);

export function BabaAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await babaApi.me();
      setUser(data?.authenticated ? data.user : null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (username, password) => {
    const data = await babaApi.login(username, password);
    setUser(data?.user || { username });
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await babaApi.logout();
    } finally {
      setUser(null);
    }
  }, []);

  return (
    <BabaAuthContext.Provider value={{ user, loading, isAuthenticated: !!user, login, logout, refresh }}>
      {children}
    </BabaAuthContext.Provider>
  );
}

export function useBabaAuth() {
  const ctx = useContext(BabaAuthContext);
  if (!ctx) throw new Error('useBabaAuth must be used within BabaAuthProvider');
  return ctx;
}
