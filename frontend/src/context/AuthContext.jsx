import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "../api/auth.js";

const AuthContext = createContext(null);
const TOKEN_KEY = "anyblog_token";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [account, setAccount] = useState(null);
  const [stats, setStats] = useState({ totalPosts: 0, publishedPosts: 0, draftPosts: 0 });
  const [myPosts, setMyPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async (authToken) => {
    try {
      const res = await api.me(authToken);
      setAccount(res.data.account);
      setStats(res.data.stats);
      setMyPosts(res.data.posts);
      return res.data;
    } catch (err) {
      if (err.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setAccount(null);
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!token) {
      setAccount(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    loadUser(token).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [token, loadUser]);

  const signIn = useCallback((newToken, accountData) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    if (accountData) setAccount(accountData);
    loadUser(newToken);
  }, [loadUser]);

  const signOut = useCallback(async () => {
    try {
      if (token) await api.logout(token);
    } catch { /* ignore */ }
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setAccount(null);
  }, [token]);

  return (
    <AuthContext.Provider
      value={{ token, account, stats, myPosts, loading, signIn, signOut, refreshAccount: () => loadUser(token) }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}