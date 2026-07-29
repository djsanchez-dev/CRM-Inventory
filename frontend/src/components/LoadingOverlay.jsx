import { createContext, useContext, useState, useCallback, useMemo } from 'react';

const LoadingContext = createContext(null);

export function LoadingProvider({ children }) {
  const [counter, setCounter] = useState(0);
  const [message, setMessage] = useState('');
  const loading = counter > 0;

  const showLoading = useCallback((msg = '') => {
    setMessage(msg);
    setCounter((prev) => prev + 1);
  }, []);

  const hideLoading = useCallback(() => {
    setCounter((prev) => Math.max(0, prev - 1));
  }, []);

  const value = useMemo(() => ({ showLoading, hideLoading }), [showLoading, hideLoading]);

  return (
    <LoadingContext.Provider value={value}>
      {children}

      {/* Loading Overlay */}
      {loading && (
        <div className="loading-overlay" role="progressbar" aria-label="Cargando">
          <div className="loading-overlay-content">
            <div className="loading-overlay-spinner">
              <div className="spinner spinner-lg"></div>
            </div>
            {message && (
              <p className="loading-overlay-message">{message}</p>
            )}
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading debe usarse dentro de LoadingProvider');
  }
  return context;
}
