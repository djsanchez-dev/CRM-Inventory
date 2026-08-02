import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { useAuth } from './AuthContext';

const BusinessConfigContext = createContext(null);

export function BusinessConfigProvider({ children }) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const loadConfig = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setConfig(null);
      setLoading(false);
      return;
    }
    try {
      const data = await api.getBusinessConfig();
      setConfig(data);
      // Persist labels locally for fast access
      localStorage.setItem('businessConfig', JSON.stringify(data));
    } catch (e) {
      // Fallback to cached config
      const cached = localStorage.getItem('businessConfig');
      if (cached) {
        setConfig(JSON.parse(cached));
      }
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Reload config whenever the authenticated user changes (login/logout/setup),
  // so labels (t()) are correct right after auth transitions — not only on mount.
  useEffect(() => {
    setLoading(true);
    loadConfig();
  }, [loadConfig, user?.id, user?.business_id]);

  // Reload config when auth state changes (called from AuthContext)
  const refreshConfig = useCallback(() => {
    setLoading(true);
    loadConfig();
  }, [loadConfig]);

  // Translation helper: get label for a key, falls back to key name
  const t = useCallback(
    (key, fallback) => {
      if (!config?.labels) return fallback || key;
      return config.labels[key] || fallback || key;
    },
    [config]
  );

  // Get extra fields for a domain (product, customer, sale)
  const getExtraFields = useCallback(
    (domain) => {
      return config?.extraFields?.[domain] || [];
    },
    [config]
  );

  return (
    <BusinessConfigContext.Provider
      value={{
        config,
        loading,
        error,
        refreshConfig,
        t,
        getExtraFields,
        tipo: config?.tipo || 'general',
        moneda: config?.moneda || 'PEN',
      }}
    >
      {children}
    </BusinessConfigContext.Provider>
  );
}

export function useBusinessConfig() {
  const context = useContext(BusinessConfigContext);
  if (!context) {
    throw new Error('useBusinessConfig debe usarse dentro de BusinessConfigProvider');
  }
  return context;
}
