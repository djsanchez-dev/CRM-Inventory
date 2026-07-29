import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Package, Building2, Eye, EyeOff, AlertCircle, Check, ArrowRight, Store, Wine, Shirt, Monitor, Apple, Tags } from 'lucide-react';

const businessTypes = [
  { value: 'general', label: 'General / Tienda', icon: Store, desc: 'Productos variados', example: 'Producto, Cliente, Venta' },
  { value: 'licoreria', label: 'Licorería', icon: Wine, desc: 'Bebidas y licores', example: 'Botella, Distribuidor, Tipo' },
  { value: 'abarrotes', label: 'Abarrotes / Almacén', icon: Apple, desc: 'Artículos de consumo', example: 'Artículo, Departamento, Proveedor' },
  { value: 'ropa', label: 'Ropa y Accesorios', icon: Shirt, desc: 'Prendas de vestir', example: 'Prenda, Línea, Talla, Color' },
  { value: 'electronica', label: 'Electrónicos', icon: Monitor, desc: 'Tecnología y gadgets', example: 'Equipo, Modelo, Marca, Garantía' },
  { value: 'otro', label: 'Otro', icon: Building2, desc: 'Personalizado', example: 'Tú defines los nombres' },
];

// Preview labels shown when a business type is selected
const typePreviews = {
  general: {
    navLabels: ['Dashboard', 'Productos', 'Clientes', 'Ventas', 'Compras'],
    fields: ['Nombre', 'SKU', 'Precio', 'Stock'],
  },
  licoreria: {
    navLabels: ['Dashboard', 'Botellas', 'Clientes', 'Ventas', 'Compras'],
    fields: ['Nombre', 'Marca', 'Graduación', 'Volumen (ml)', 'Código', 'Precio'],
  },
  abarrotes: {
    navLabels: ['Dashboard', 'Artículos', 'Clientes', 'Ventas', 'Compras'],
    fields: ['Nombre', 'Marca', 'Peso/Volumen', 'Fecha Cad.', 'Código', 'Precio'],
  },
  ropa: {
    navLabels: ['Dashboard', 'Prendas', 'Clientes', 'Ventas', 'Compras'],
    fields: ['Nombre', 'Talla', 'Color', 'Material', 'Código', 'Precio'],
  },
  electronica: {
    navLabels: ['Dashboard', 'Equipos', 'Clientes', 'Ventas', 'Compras'],
    fields: ['Nombre', 'Marca', 'Modelo', 'Garantía', 'Modelo', 'Precio'],
  },
  otro: {
    navLabels: ['Dashboard', 'Productos', 'Clientes', 'Ventas', 'Compras'],
    fields: ['Nombre', 'SKU', 'Precio', 'Stock'],
  },
};

export default function BusinessSetup() {
  const [step, setStep] = useState(1);
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('general');
  const [currency, setCurrency] = useState('PEN');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [hasBusiness, setHasBusiness] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.checkBusinessStatus()
      .then((data) => {
        setHasBusiness(data.hasBusiness);
        if (data.hasBusiness) {
          navigate('/login');
        }
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, [navigate]);

  const handleSetup = async (e) => {
    e.preventDefault();
    setError('');

    if (!businessName || !adminUsername || !adminPassword || !adminName) {
      setError('Todos los campos son requeridos');
      return;
    }

    if (adminPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      const data = await api.setupBusiness({
        businessName,
        businessType,
        moneda: currency,
        adminUsername,
        adminPassword,
        adminName,
      });
      // Auto-login after setup
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('business', JSON.stringify(data.business));
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="login-page">
        <div className="loading-screen">
          <div className="spinner"></div>
          <p>Verificando configuración...</p>
        </div>
      </div>
    );
  }

  if (hasBusiness) return null;

  return (
    <div className="login-page">
      <div className="login-background">
        <div className="bg-shape bg-shape-1"></div>
        <div className="bg-shape bg-shape-2"></div>
        <div className="bg-shape bg-shape-3"></div>
      </div>

      <div className="login-container" style={{ maxWidth: 520 }}>
        <div className="login-header">
          <div className="login-logo">
            <Store size={32} />
          </div>
          <h1>Configurar Negocio</h1>
          <p>Bienvenido! Configura tu negocio para empezar</p>
        </div>

        {/* Steps indicator */}
        <div className="setup-steps">
          <div className={`setup-step ${step >= 1 ? 'active' : ''}`}>
            <div className="step-number">{step > 1 ? <Check size={14} /> : 1}</div>
            <span>Negocio</span>
          </div>
          <div className="step-connector" />
          <div className={`setup-step ${step >= 2 ? 'active' : ''}`}>
            <div className="step-number">{step > 2 ? <Check size={14} /> : 2}</div>
            <span>Admin</span>
          </div>
          <div className="step-connector" />
          <div className={`setup-step ${step >= 3 ? 'active' : ''}`}>
            <div className="step-number"><Check size={14} /></div>
            <span>Listo</span>
          </div>
        </div>

        {error && (
          <div className="error-message">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Business Info */}
        {step === 1 && (
          <div className="setup-form">
            <div className="form-group">
              <label htmlFor="businessName">Nombre del Negocio</label>
              <input
                id="businessName"
                type="text"
                placeholder="Ej: Mi Tienda"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label>Tipo de Negocio</label>
              <div className="business-type-grid">
                {businessTypes.map((type) => {
                  const Icon = type.icon;
                  const selected = businessType === type.value;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      className={`business-type-card ${selected ? 'selected' : ''}`}
                      onClick={() => setBusinessType(type.value)}
                    >
                      <Icon size={24} />
                      <span className="btype-label">{type.label}</span>
                      <span className="btype-desc">{type.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="form-group">
              <label>Moneda</label>
              <div className="currency-grid">
                {[
                  { code: 'PEN', symbol: 'S/', name: 'Sol Peruano' },
                  { code: 'USD', symbol: '$', name: 'Dólar Americano' },
                  { code: 'MXN', symbol: '$', name: 'Peso Mexicano' },
                  { code: 'COP', symbol: '$', name: 'Peso Colombiano' },
                  { code: 'CLP', symbol: '$', name: 'Peso Chileno' },
                  { code: 'ARS', symbol: '$', name: 'Peso Argentino' },
                  { code: 'EUR', symbol: '€', name: 'Euro' },
                  { code: 'BOB', symbol: 'Bs.', name: 'Boliviano' },
                ].map((cur) => {
                  const selected = currency === cur.code;
                  return (
                    <button
                      key={cur.code}
                      type="button"
                      className={`currency-card ${selected ? 'selected' : ''}`}
                      onClick={() => setCurrency(cur.code)}
                    >
                      <span className="currency-symbol">{cur.symbol}</span>
                      <span className="currency-code">{cur.code}</span>
                      <span className="currency-name">{cur.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preview of labels for selected type */}
            {businessType && (
              <div className="setup-preview">
                <div className="preview-header">
                  <Tags size={14} />
                  <span>Vista previa de etiquetas</span>
                </div>
                <div className="preview-content">
                  <div className="preview-col">
                    <span className="preview-section-label">Menú</span>
                    <div className="preview-tags">
                      {typePreviews[businessType]?.navLabels.map((label, i) => (
                        <span key={i} className="preview-tag">{label}</span>
                      ))}
                    </div>
                  </div>
                  <div className="preview-col">
                    <span className="preview-section-label">Campos</span>
                    <div className="preview-tags">
                      {typePreviews[businessType]?.fields.map((field, i) => (
                        <span key={i} className="preview-tag field">{field}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button
              type="button"
              className="login-btn"
              onClick={() => {
                if (!businessName) {
                  setError('Ingresa el nombre del negocio');
                  return;
                }
                setError('');
                setStep(2);
              }}
            >
              Continuar <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* Step 2: Admin User */}
        {step === 2 && (
          <form className="setup-form" onSubmit={handleSetup}>
            <div className="form-group">
              <label htmlFor="adminName">Nombre del Administrador</label>
              <input
                id="adminName"
                type="text"
                placeholder="Ej: Juan Pérez"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="adminUsername">Usuario</label>
              <input
                id="adminUsername"
                type="text"
                placeholder="Ej: admin"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="adminPassword">Contraseña</label>
              <div className="password-input">
                <input
                  id="adminPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="setup-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => { setError(''); setStep(1); }}
              >
                Atrás
              </button>
              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? (
                  <span className="btn-loading">
                    <span className="spinner-small"></span>
                    Configurando...
                  </span>
                ) : (
                  'Crear Negocio'
                )}
              </button>
            </div>
          </form>
        )}

        <div className="login-footer">
          <p>Configuración inicial de un solo paso</p>
        </div>
      </div>
    </div>
  );
}
