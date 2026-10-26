import React, { createContext, useContext, useState, useCallback } from 'react';
import { useDB, findUser, getState, getSessionUserId, setSessionUserId } from './db';

const AuthContext = createContext(null);

export const ROLE_HOME = { user: '/user', owner: '/owner', superadmin: '/super-admin' };

export function AuthProvider({ children }) {
  const [userId, setUserId] = useState(getSessionUserId);
  const user = useDB((s) => (userId ? findUser(s, userId) : null));

  const login = useCallback((email, password) => {
    const u = getState().users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
    if (!u || u.password !== password) throw new Error('Invalid email or password');
    if (u.status === 'pending') throw new Error('Your account is awaiting Super Admin approval.');
    if (u.status === 'disabled') throw new Error('Your account has been disabled. Contact support.');
    setSessionUserId(u.id);
    setUserId(u.id);
    return u;
  }, []);

  const logout = useCallback(() => {
    setSessionUserId(null);
    setUserId(null);
  }, []);

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
