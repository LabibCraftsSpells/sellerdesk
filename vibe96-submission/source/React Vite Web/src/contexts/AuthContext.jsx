import React, { createContext, useState, useEffect, useCallback } from 'react';
import { getMeApi } from '../api/auth';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('sellerdesk_token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await getMeApi();
      setUser(data.user || data);
    } catch {
      localStorage.removeItem('sellerdesk_token');
      localStorage.removeItem('sellerdesk_user');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = useCallback((token, userData) => {
    localStorage.setItem('sellerdesk_token', token);
    localStorage.setItem('sellerdesk_user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('sellerdesk_token');
    localStorage.removeItem('sellerdesk_user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, loadUser }}>
      {children}
    </AuthContext.Provider>
  );
}
