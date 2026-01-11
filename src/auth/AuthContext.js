import React, { createContext, useContext, useEffect, useState } from 'react';
import api, { setLogoutHandler, setTokenRefreshedHandler } from '../api/axiosInstance';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      console.warn("⚠️ Invalid user JSON in localStorage, resetting.");
      localStorage.removeItem('user');
      return null;
    }
  });

  const isAuthenticated = !!token && !!user;

  // login
  async function login(userId, sessionKey) {
    const res = await api.post('/auth/login', { userId, sessionKey });
    const data = res.data; // { access_token, user: { id, role } }

    setToken(data.access_token);
    setUser(data.user);

    localStorage.setItem('token', data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));
  }

  function logout() {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  // registra i callback globali
  useEffect(() => {
    setLogoutHandler(logout);
    setTokenRefreshedHandler((newToken) => {
      setToken(newToken);
    });
  }, []);

  const value = { token, user, isAuthenticated, login, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
