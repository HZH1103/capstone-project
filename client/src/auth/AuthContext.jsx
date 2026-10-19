import { createContext, useContext, useMemo, useState } from 'react';
import { apiRequest } from '../services/api.js';

const AuthContext = createContext(null);
const STORAGE_KEY = 'zonghan-capstone-auth';

function readStoredAuth() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    return stored?.token && stored?.user ? stored : { token: '', user: null };
  } catch {
    return { token: '', user: null };
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(readStoredAuth);

  async function login(email, password) {
    const result = await apiRequest('/users/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    const nextAuth = { token: result.token, user: result.user };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextAuth));
    setAuth(nextAuth);
    return result.user;
  }

  async function register(username, email, password) {
    return apiRequest('/users/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password })
    });
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    setAuth({ token: '', user: null });
  }

  const value = useMemo(() => ({
    ...auth,
    isAuthenticated: Boolean(auth.token && auth.user),
    login,
    register,
    logout
  }), [auth]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
