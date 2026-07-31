import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

/**
 * Safely parse JSON from localStorage with fallback
 */
function getStored(key) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : null;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStored('user'));
  const [business, setBusiness] = useState(() => getStored('business'));
  const [loading, setLoading] = useState(true);
  const verifiedRef = useRef(false);

  // Verify token on mount — only runs once
  useEffect(() => {
    if (verifiedRef.current) return;
    verifiedRef.current = true;

    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    api.verifyToken()
      .then((data) => {
        if (data?.valid && data?.user) {
          setUser(data.user);
          // Merge business data if available
          if (data.business) {
            setBusiness(data.business);
            localStorage.setItem('business', JSON.stringify(data.business));
          }
          localStorage.setItem('user', JSON.stringify(data.user));
        } else {
          // Token invalid but not expired — clear session
          clearSession();
        }
      })
      .catch((err) => {
        // Network error — keep cached session to avoid forcing re-login
        console.warn('Token verification unavailable, using cached session:', err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  /**
   * Clear all auth state
   */
  const clearSession = useCallback(() => {
    const keys = ['token', 'user', 'business', 'businessConfig'];
    keys.forEach(key => localStorage.removeItem(key));
    setUser(null);
    setBusiness(null);
  }, []);

  /**
   * Login with username and password
   */
  const login = useCallback(async (username, password) => {
    const data = await api.login(username, password);

    if (!data.token || !data.user) {
      throw new Error('Respuesta inválida del servidor');
    }

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    if (data.business) {
      localStorage.setItem('business', JSON.stringify(data.business));
      setBusiness(data.business);
    }
    setUser(data.user);
    return data;
  }, []);

  /**
   * Logout — clear everything and redirect
   */
  const logout = useCallback(() => {
    clearSession();
    window.location.href = '/login';
  }, [clearSession]);

  /**
   * Update user data (profile changes, etc.)
   */
  const updateUser = useCallback((newUser, newToken) => {
    if (newToken) {
      localStorage.setItem('token', newToken);
    }
    localStorage.setItem('user', JSON.stringify(newUser));
    setUser(newUser);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      business,
      loading,
      login,
      logout,
      updateUser,
      isAdmin: user?.rol === 'admin',
      isSuperAdmin: user?.rol === 'super_admin',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
