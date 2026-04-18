import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { adminLogin as apiLogin, fetchAdminMe, clearAdminToken, getAdminToken, setCachedUser, getCachedUser, type BackendUser } from '../services/aquagrowApi';

// ─── Admin sub-role type (stored in adminRole field on backend user) ──────────
export type AdminRole =
  | 'super_admin'
  | 'finance_admin'
  | 'operations_admin'
  | 'sales_admin'
  | 'support_admin'
  | 'inventory_admin'
  | 'technical_admin'
  | 'hr_admin';

export interface AuthUser {
  id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  role: AdminRole;        // mapped from backend adminRole (or 'super_admin' fallback)
  backendRole: string;    // raw backend role ('admin')
  location?: string;
  avatar: string;         // initials
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  login: (phoneNumber: string, password: string) => Promise<void>;
  logout: () => void;
  isSuperAdmin: boolean;
  hasRole: (...roles: AdminRole[]) => boolean;
}

// ─── Map backend user → admin panel AuthUser ───────────────────────────────────
// The backend now stores the full admin role in `user.role` directly.
// Legacy accounts with role='admin' are treated as 'super_admin'.
function mapBackendUser(b: BackendUser): AuthUser {
  const rawRole = b.role as string;
  // Normalise legacy 'admin' → 'super_admin'; keep all other admin roles as-is
  const adminRole: AdminRole = rawRole === 'admin' ? 'super_admin' : (rawRole as AdminRole) || 'super_admin';
  const initials = b.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  return {
    id: b._id,
    name: b.name,
    phoneNumber: b.phoneNumber,
    email: b.email,
    role: adminRole,
    backendRole: rawRole,
    location: b.location,
    avatar: initials,
  };
}

const SESSION_KEY = 'aquagrow_auth_user';

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: false,
  error: null,
  login: async () => {},
  logout: () => {},
  isSuperAdmin: false,
  hasRole: () => false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser]       = useState<AuthUser | null>(() => {
    // Restore from sessionStorage on reload
    try {
      const s = sessionStorage.getItem(SESSION_KEY);
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  // On mount — if we have a token, verify it's still valid by re-fetching profile
  useEffect(() => {
    const token = getAdminToken();
    if (!token || user) return;    // already restored from sessionStorage
    fetchAdminMe()
      .then(b => {
        const mapped = mapBackendUser(b);
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(mapped));
        setUser(mapped);
      })
      .catch(() => {
        clearAdminToken();
        sessionStorage.removeItem(SESSION_KEY);
        setUser(null);
      });
  }, []); // eslint-disable-line

  const login = useCallback(async (phoneNumber: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiLogin(phoneNumber, password);
      const mapped = mapBackendUser(res.user);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(mapped));
      setUser(mapped);
    } catch (e: any) {
      setError(e.message || 'Login failed');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearAdminToken();
    sessionStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, []);

  const isSuperAdmin = user?.role === 'super_admin';
  const hasRole = (...roles: AdminRole[]) => !!user && roles.includes(user.role);

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, isSuperAdmin, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};


export const useAuth = () => useContext(AuthContext);

// ─── Role display helpers (re-exported from roleConstants for backward compat) ─
export { ROLE_LABELS, ROLE_COLORS } from './roleConstants';

