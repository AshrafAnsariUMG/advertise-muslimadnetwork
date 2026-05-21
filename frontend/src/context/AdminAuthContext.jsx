'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  adminApiCall,
  clearAdminToken,
  getAdminToken,
  setAdminToken,
} from '@/lib/admin-auth';

/**
 * AdminAuthContext owns the admin session state.
 *
 *   useAdminAuth() → { user, isLoading, login, logout }
 *
 * On mount we hydrate `user` by calling /admin/auth/me with whatever
 * token is in localStorage. A 401 from that call quietly clears state
 * (the fetch wrapper itself already nuked the token) so the layout
 * route guard sends us back to /admin/login.
 *
 * This boundary is the only place that knows about Sanctum. When
 * UmmahPass SSO replaces it post-launch, only `login` changes — the
 * rest of the consumer tree stays put.
 */
const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      if (!getAdminToken()) {
        setIsLoading(false);
        return;
      }
      try {
        const me = await adminApiCall('/api/admin/auth/me');
        if (!cancelled) setUser(me);
      } catch {
        // 401 already cleared the token in the fetch wrapper; other errors
        // — leave user null and let the layout decide what to do.
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const result = await adminApiCall('/api/admin/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    if (result?.token) {
      setAdminToken(result.token);
      setUser(result.user || null);
      return result.user;
    }
    throw new Error('Login response missing token.');
  }, []);

  const logout = useCallback(async () => {
    try {
      await adminApiCall('/api/admin/auth/logout', { method: 'POST' });
    } catch {
      // Best-effort — clear locally even if the server call failed
    } finally {
      clearAdminToken();
      setUser(null);
    }
  }, []);

  return (
    <AdminAuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error('useAdminAuth must be used inside <AdminAuthProvider>');
  }
  return ctx;
}
