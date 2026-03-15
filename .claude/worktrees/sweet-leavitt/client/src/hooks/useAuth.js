'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { authAPI } from '@/lib/api';
import { saveAuth, getStoredUser, clearAuth } from '@/lib/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) {
      setUser(stored);
      authAPI.me()
        .then(({ data }) => setUser(data.user))
        .catch((err) => {
          if (err.response?.status === 401) { clearAuth(); setUser(null); }
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    saveAuth(data.token, data.user);
    setUser(data.user);
    return data;
  };

  const register = async (formData) => {
    const { data } = await authAPI.register(formData);
    saveAuth(data.token, data.user);
    setUser(data.user);
    return data;
  };

  // For OAuth flows — token + user already resolved by the API
  const loginWithToken = (token, userData) => {
    saveAuth(token, userData);
    setUser(userData);
  };

  const logout = () => {
    clearAuth();
    setUser(null);
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
