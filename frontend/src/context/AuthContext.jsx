import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [business, setBusiness] = useState(() => {
    const saved = localStorage.getItem('business');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch('/api/auth/verify', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (res.status === 401) {
            // Token explícitamente inválido — limpiar sesión
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('business');
            localStorage.removeItem('businessConfig');
            setUser(null);
            setBusiness(null);
            return null;
          }
          return res.json();
        })
        .then((data) => {
          if (data && data.valid) {
            setUser(data.user);
            setBusiness(data.business || null);
            localStorage.setItem('user', JSON.stringify(data.user));
            if (data.business) {
              localStorage.setItem('business', JSON.stringify(data.business));
            }
          }
          // Si data.valid === false pero no es 401 (ej: token expirado),
          // mantenemos la sesión en localStorage (el login redirigirá)
        })
        .catch(() => {
          // Error de red (timeout, cold start) — NO limpiar sesión
          // Mantenemos user/business de localStorage para no forzar login
          console.warn('No se pudo verificar el token — usando sesión en caché');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    const data = await api.login(username, password);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('business', JSON.stringify(data.business));
    setUser(data.user);
    setBusiness(data.business);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('business');
    localStorage.removeItem('businessConfig');
    setUser(null);
    setBusiness(null);
    window.location.href = '/login';
  };

  const updateUser = (newUser, newToken) => {
    if (newToken) {
      localStorage.setItem('token', newToken);
    }
    localStorage.setItem('user', JSON.stringify(newUser));
    setUser(newUser);
  };

  return (
    <AuthContext.Provider value={{ user, business, login, logout, updateUser, loading }}>
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
