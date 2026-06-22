import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { api, formatApiError } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data);
    } catch {
      setUser(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const login = async (email, password) => {
    try {
      const { data } = await api.post("/auth/login", { email, password });
      setUser(data.user);
      return { ok: true };
    } catch (e) { return { ok: false, error: formatApiError(e) }; }
  };

  const register = async (email, password, name) => {
    try {
      const { data } = await api.post("/auth/register", { email, password, name });
      setUser(data.user);
      return { ok: true };
    } catch (e) { return { ok: false, error: formatApiError(e) }; }
  };

  const logout = async () => {
    try { await api.post("/auth/logout"); }
    catch (err) { console.warn("Logout request failed", err); }
    setUser(false);
  };

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refresh, setUser }),
    [user, loading, refresh]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
