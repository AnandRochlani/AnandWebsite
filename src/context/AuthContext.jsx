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

  const checkAuthOnMount = () => {
    try {
      const session = localStorage.getItem('adminSession');
      if (session) {
        const parsedSession = JSON.parse(session);
        // Simple session validation
        if (parsedSession && parsedSession.username) {
          setIsAuthenticated(true);
          setUser(parsedSession);
        }
      }
    } catch (error) {
      // Silently handle auth check errors
      try {
        localStorage.removeItem('adminSession');
      } catch (e) {
        // localStorage may not be available
      }
    } finally {
      setLoading(false);
    }
  };

  const login = (username, password) => {
    return new Promise((resolve, reject) => {
      // Simulate API call delay
      setTimeout(() => {
        if (username === 'admin' && password === 'admin123') {
          const sessionData = { username, timestamp: Date.now() };
          localStorage.setItem('adminSession', JSON.stringify(sessionData));
          setIsAuthenticated(true);
          setUser(sessionData);
          resolve({ success: true });
        } else {
          reject(new Error('Invalid credentials'));
        }
      }, 800);
    });
  };

  const logout = () => {
    localStorage.removeItem('adminSession');
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};