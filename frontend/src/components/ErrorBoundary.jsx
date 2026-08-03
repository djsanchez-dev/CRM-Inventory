import { Component } from 'react';
import Logo from './Logo';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught:', error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Allow custom fallback
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f8fafc',
            padding: 24,
          }}
        >
          <div
            style={{
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: 14,
              padding: '48px 40px',
              maxWidth: 480,
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                background: '#fef2f2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                color: '#ef4444',
              }}
            >
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>

            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
              Ocurrió un error inesperado
            </h2>
            <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.6, marginBottom: 24 }}>
              El sistema encontró un problema y no pudo continuar. Por favor, intenta recargar la página.
              Si el error persiste, contacta al administrador.
            </p>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={this.handleReload}
                style={{
                  padding: '10px 24px',
                  background: 'linear-gradient(135deg, var(--primary), #7c3aed)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 10,
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  boxShadow: 'var(--shadow-button)',
                  transition: 'all 0.2s',
                }}
              >
                Ir al inicio
              </button>
              <button
                onClick={this.handleReset}
                style={{
                  padding: '10px 24px',
                  background: '#f1f5f9',
                  color: '#475569',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 0.2s',
                }}
              >
                Reintentar
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details
                style={{
                  marginTop: 24,
                  textAlign: 'left',
                  background: '#f8fafc',
                  borderRadius: 10,
                  padding: 16,
                  border: '1px solid #e2e8f0',
                }}
              >
                <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem', color: '#64748b' }}>
                  Detalles del error
                </summary>
                <pre
                  style={{
                    marginTop: 12,
                    fontSize: '0.75rem',
                    color: '#ef4444',
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'monospace',
                    lineHeight: 1.5,
                  }}
                >
                  {this.state.error?.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
