import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Package, Eye, EyeOff, AlertCircle, Check, ArrowRight, ArrowLeft, Store, Wine, Shirt, Monitor, Apple, Tags, Sparkles, Building2, Car } from 'lucide-react';

const businessTypes = [
  { value: 'general', label: 'General / Tienda', icon: Store, desc: 'Productos variados' },
  { value: 'carwash', label: 'Car Wash / Lavadero', icon: Car, desc: 'Lavado y servicios mecánicos' },
  { value: 'licoreria', label: 'Licorería', icon: Wine, desc: 'Bebidas y licores' },
  { value: 'abarrotes', label: 'Abarrotes / Almacén', icon: Apple, desc: 'Artículos de consumo' },
  { value: 'ropa', label: 'Ropa y Accesorios', icon: Shirt, desc: 'Prendas de vestir' },
  { value: 'electronica', label: 'Electrónicos', icon: Monitor, desc: 'Tecnología y gadgets' },
  { value: 'otro', label: 'Otro', icon: Building2, desc: 'Personalizado' },
];

const currencies = [
  { code: 'PEN', symbol: 'S/', name: 'Sol Peruano' },
  { code: 'USD', symbol: '$', name: 'Dólar Americano' },
  { code: 'MXN', symbol: '$', name: 'Peso Mexicano' },
  { code: 'COP', symbol: '$', name: 'Peso Colombiano' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
];

export default function BusinessSetup() {
  const [step, setStep] = useState(1);
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('general');
  const [currency, setCurrency] = useState('PEN');
  const [adminName, setAdminName] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [loaded, setLoaded] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const [direction, setDirection] = useState('forward');
  const { login } = useAuth();
  const navigate = useNavigate();
  const formRef = useRef(null);

  const goNext = () => {
    setDirection('forward');
    setTransitioning(true);
    setTimeout(() => { setStep(s => s + 1); setTransitioning(false); }, 200);
  };

  const goBack = () => {
    setError('');
    setDirection('back');
    setTransitioning(true);
    setTimeout(() => { setStep(s => s - 1); setTransitioning(false); }, 200);
  };

  const handleSetup = async (e) => {
    e.preventDefault();
    if (!businessName || !adminName || !adminUsername || !adminPassword) {
      setError('Todos los campos son requeridos');
      return;
    }
    if (adminPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await api.setupBusiness({
        businessName, businessType, moneda: currency,
        adminUsername, adminPassword, adminName,
      });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('business', JSON.stringify(data.business));
      navigate('/app');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedType = businessTypes.find(t => t.value === businessType);

  // Modules included per business type — Services is exclusive to Car Wash
  const previewModules = [
    'Dashboard',
    businessType === 'general' ? 'Productos' : selectedType?.label.split('/')[0].trim(),
    'Clientes',
    'Ventas',
    'Compras',
    ...(businessType === 'carwash' ? ['Servicios'] : []),
  ];

  return (
    <div className="login-page">
      <div className="login-background">
        <div className="bg-shape bg-shape-1" />
        <div className="bg-shape bg-shape-2" />
        <div className="bg-shape bg-shape-3" />
      </div>

      <div className={`login-container setup-container ${loaded ? 'visible' : ''}`}>
        <div className="login-header">
          <div className="login-logo"><Sparkles size={28} /></div>
          <h1>Configurar Negocio</h1>
          <p>Bienvenido! Configura tu negocio para empezar</p>
        </div>

        <div className="setup-steps">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`setup-step ${step >= s ? 'active' : ''} ${step === s ? 'current' : ''}`}>
              <div className={`step-number ${step >= s ? '' : 'inactive'}`}>
                {step > s ? <Check size={14} /> : s}
              </div>
              <span>{['', 'Negocio', 'Admin', 'Listo'][s]}</span>
            </div>
          ))}
        </div>

        {error && (
          <div className="error-message shake">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <div className={`setup-form ${transitioning ? 'exit-' + direction : 'enter-' + direction}`} ref={formRef}>
          {step === 1 && (
            <>
              <div className="form-group">
                <label htmlFor="businessName">Nombre del Negocio</label>
                <input id="businessName" type="text" placeholder="Ej: Mi Tienda"
                  value={businessName} onChange={(e) => setBusinessName(e.target.value)} autoFocus />
              </div>

              <div className="form-group">
                <label>Tipo de Negocio</label>
                <div className="business-type-grid">
                  {businessTypes.map((type) => {
                    const Icon = type.icon;
                    const selected = businessType === type.value;
                    return (
                      <button key={type.value} type="button"
                        className={`business-type-card ${selected ? 'selected' : ''}`}
                        onClick={() => setBusinessType(type.value)}>
                        <Icon size={22} />
                        <span className="btype-label">{type.label}</span>
                        <span className="btype-desc">{type.desc}</span>
                        {type.value === 'carwash' && (
                          <span className="btype-badge">Incluye módulo de Servicios</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="form-group">
                <label>Moneda</label>
                <div className="currency-grid">
                  {currencies.map((cur) => (
                    <button key={cur.code} type="button"
                      className={`currency-card ${currency === cur.code ? 'selected' : ''}`}
                      onClick={() => setCurrency(cur.code)}>
                      <span className="currency-symbol">{cur.symbol}</span>
                      <span className="currency-code">{cur.code}</span>
                      <span className="currency-name">{cur.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="setup-preview">
                <div className="preview-header"><Tags size={14} /><span>Vista previa</span></div>
                <div className="preview-content">
                  <div className="preview-col">
                    <span className="preview-section-label">Menú</span>
                    <div className="preview-tags">
                      {previewModules.map((l, i) => (
                        <span key={i} className={`preview-tag ${l === 'Servicios' ? 'preview-tag-services' : ''}`}>{l}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <button type="button" className="btn btn-primary btn-full" onClick={() => {
                if (!businessName) { setError('Ingresa el nombre del negocio'); return; }
                setError(''); goNext();
              }}>
                Continuar <ArrowRight size={18} />
              </button>
            </>
          )}

          {step === 2 && (
            <form onSubmit={(e) => { e.preventDefault(); handleSetup(e); }}>
              <div className="form-group">
                <label htmlFor="adminName">Nombre del Administrador</label>
                <input id="adminName" type="text" placeholder="Ej: Juan Pérez"
                  value={adminName} onChange={(e) => setAdminName(e.target.value)} autoFocus />
              </div>
              <div className="form-group">
                <label htmlFor="adminUsername">Usuario</label>
                <input id="adminUsername" type="text" placeholder="Ej: admin"
                  value={adminUsername} onChange={(e) => setAdminUsername(e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="adminPassword">Contraseña</label>
                <div className="password-input">
                  <input id="adminPassword" type={showPassword ? 'text' : 'password'}
                    placeholder="Mínimo 6 caracteres" value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)} />
                  <button type="button" className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="setup-actions">
                <button type="button" className="btn btn-secondary setup-back-btn"
                  onClick={goBack}><ArrowLeft size={16} /> Atrás</button>
                <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                  {loading ? (
                    <span className="btn-loading"><span className="spinner-small" /> Configurando...</span>
                  ) : 'Crear Negocio'}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="login-footer" style={{ marginTop: 16 }}>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Configuración inicial de un solo paso</p>
        </div>
      </div>
    </div>
  );
}
