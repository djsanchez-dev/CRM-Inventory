import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { Eye, EyeOff, AlertCircle, Store, LogIn, LayoutDashboard } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);
  const toast = useToast();
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username || !password) {
      setError('Por favor ingresa usuario y contraseña');
      return;
    }
    setLoading(true);
    try {
      const data = await login(username, password);
      toast.success('Sesión iniciada correctamente');
      if (data.user?.rol === 'super_admin') {
        navigate('/app/admin');
      } else {
        navigate('/app');
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-background">
        <div className="bg-shape bg-shape-1" />
        <div className="bg-shape bg-shape-2" />
        <div className="bg-shape bg-shape-3" />
      </div>

      <div className={`login-container ${loaded ? 'visible' : ''}`}>
        <div className="login-header">
          <div className="login-logo"><Store size={32} /></div>
          <h1>CRM Inventario</h1>
          <p>Sistema de Gestión de Inventario</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && (
            <div className="error-message shake">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-group fade-item" style={{ animationDelay: '0.1s' }}>
            <label htmlFor="username">Usuario</label>
            <input id="username" type="text" placeholder="Ingresa tu usuario"
              value={username} onChange={(e) => setUsername(e.target.value)}
              autoFocus disabled={loading} />
          </div>

          <div className="form-group fade-item" style={{ animationDelay: '0.15s' }}>
            <label htmlFor="password">Contraseña</label>
            <div className="password-input">
              <input id="password" type={showPassword ? 'text' : 'password'}
                placeholder="Ingresa tu contraseña" value={password}
                onChange={(e) => setPassword(e.target.value)} disabled={loading} />
              <button type="button" className="toggle-password"
                onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-full fade-item" style={{ animationDelay: '0.2s' }} disabled={loading}>
            {loading ? (
              <span className="btn-loading">
                <span className="spinner-small" />
                Iniciando sesión...
              </span>
            ) : (
              <><LogIn size={18} /> Iniciar Sesión</>
            )}
          </button>

          <div className="login-help fade-item" style={{ animationDelay: '0.25s' }}>
            <small style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Presiona Enter para enviar</small>
          </div>
        </form>

        <div className="login-footer fade-item" style={{ animationDelay: '0.3s' }}>
          <p className="setup-link" onClick={() => navigate('/setup')}>
            <LayoutDashboard size={14} /> ¿Nuevo? <strong>Crear otro negocio</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
