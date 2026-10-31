import { createContext, useContext, useEffect, useMemo, useState } from 'react';
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

  // Re-validate a restored session against the API. This keeps the cached role
  // fresh (for example after an account has been promoted to admin) and clears
  // stale tokens. Network failures keep the local session so an offline or
  // sleeping backend does not log the user out.
  useEffect(() => {
    const stored = readStoredAuth();
    if (!stored.token) return undefined;
    let active = true;
    apiRequest('/users/me', { token: stored.token })
      .then((result) => {
        if (!active || !result?.user) return;
        const nextAuth = { token: stored.token, user: result.user };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextAuth));
        setAuth(nextAuth);
      })
      .catch((requestError) => {
        if (!active || requestError.status !== 401) return;
        localStorage.removeItem(STORAGE_KEY);
        setAuth({ token: '', user: null });
      });
    return () => { active = false; };
  }, []);

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
