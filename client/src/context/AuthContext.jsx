import { createContext, useContext, useState, useCallback } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('haccp_user');
    return raw ? JSON.parse(raw) : null;
  });
  const [activeSiteId, setActiveSiteId] = useState(() => localStorage.getItem('haccp_active_site') || '');

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('haccp_token', data.token);
    localStorage.setItem('haccp_user', JSON.stringify(data.user));
    setUser(data.user);
    if (data.user.siteId) {
      setActiveSiteId(data.user.siteId);
      localStorage.setItem('haccp_active_site', data.user.siteId);
    }
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('haccp_token');
    localStorage.removeItem('haccp_user');
    localStorage.removeItem('haccp_active_site');
    setUser(null);
    setActiveSiteId('');
  }, []);

  const changeSite = useCallback((siteId) => {
    setActiveSiteId(siteId);
    localStorage.setItem('haccp_active_site', siteId);
  }, []);

  const isMultiSiteRole = user && ['SUPER_ADMIN', 'ORG_ADMIN'].includes(user.role);

  return (
    <AuthContext.Provider value={{ user, login, logout, activeSiteId, changeSite, isMultiSiteRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
