import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthOnMount();
  }, []);

  const checkAuthOnMount = async () => {
    try {
      const res = await fetch('/api/admin/me', { method: 'GET', credentials: 'include' });
      if (!res.ok) {
        setIsAuthenticated(false);
        setUser(null);
        return;
      }
      const data = await res.json();
      if (data?.authenticated && data?.user?.username) {
        setIsAuthenticated(true);
        setUser({ username: data.user.username });
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      // If API is unavailable (e.g. running plain Vite dev without Vercel),
      // treat as logged out.
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = (username, password) => {
    return new Promise(async (resolve, reject) => {
      try {
        const res = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ username, password }),
        });

        if (!res.ok) {
          reject(new Error('Invalid credentials'));
          return;
        }

        const data = await res.json();
        setIsAuthenticated(true);
        setUser({ username: data?.user?.username || username });
        resolve({ success: true });
      } catch (e) {
        reject(new Error('Login failed'));
      }
    });
  };

  const logout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' });
    } catch (e) {
      // ignore
    } finally {
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};