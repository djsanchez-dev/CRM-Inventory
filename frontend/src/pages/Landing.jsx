import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

const styles = `
.landing {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #0f172a;
  overflow-x: hidden;
}

/* ===== NAVBAR ===== */
.landing-nav {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 100;
  padding: 16px 0;
  transition: background 0.3s, box-shadow 0.3s, padding 0.3s;
}
.landing-nav.scrolled {
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(12px);
  padding: 10px 0;
  box-shadow: 0 1px 8px rgba(0,0,0,0.06);
}
.landing-nav-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.landing-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.2rem;
  font-weight: 700;
}
.landing-logo .logo-icon {
  width: 38px; height: 38px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
}
.logo-accent { color: #6366f1; }
.landing-nav-links {
  display: flex;
  align-items: center;
  gap: 24px;
}
.landing-nav-links a {
  color: #475569;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  transition: color 0.2s;
}
.landing-nav-links a:hover { color: #6366f1; }
.nav-cta {
  padding: 9px 22px;
  background: linear-gradient(135deg, #6366f1, #7c3aed);
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.88rem;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  font-family: inherit;
}
.nav-cta:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(99,102,241,0.35);
}

/* ===== HERO ===== */
.landing-hero {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
  overflow: hidden;
}
.hero-bg { position: absolute; inset: 0; overflow: hidden; }
.hero-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.12;
}
.hero-glow-1 {
  width: 500px; height: 500px;
  background: #6366f1;
  top: -150px; right: -100px;
  animation: hoverFloat 8s ease-in-out infinite;
}
.hero-glow-2 {
  width: 350px; height: 350px;
  background: #06b6d4;
  bottom: -80px; left: -80px;
  animation: hoverFloat 10s ease-in-out infinite reverse;
}
@keyframes hoverFloat {
  0%, 100% { transform: translate(0,0); }
  50% { transform: translate(30px,-30px); }
}
.hero-content {
  position: relative;
  z-index: 1;
  max-width: 800px;
  text-align: center;
  padding: 120px 24px 60px;
}
.hero-badge {
  display: inline-block;
  padding: 8px 20px;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 50px;
  color: rgba(255,255,255,0.8);
  font-size: 0.85rem;
  font-weight: 500;
  margin-bottom: 28px;
}
.hero-content h1 {
  color: white;
  font-size: clamp(2.2rem, 5vw, 4rem);
  font-weight: 800;
  line-height: 1.1;
  margin-bottom: 20px;
  letter-spacing: -0.5px;
}
.hero-highlight {
  background: linear-gradient(135deg, #a5b4fc, #818cf8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.hero-desc {
  color: rgba(255,255,255,0.65);
  font-size: clamp(1rem, 1.8vw, 1.15rem);
  line-height: 1.7;
  max-width: 600px;
  margin: 0 auto 36px;
}
.hero-cta {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}
.btn-primary {
  padding: 14px 32px;
  background: linear-gradient(135deg, #6366f1, #7c3aed);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  font-family: inherit;
  box-shadow: 0 4px 16px rgba(99,102,241,0.3);
}
.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(99,102,241,0.4); }
.btn-secondary {
  padding: 14px 32px;
  background: rgba(255,255,255,0.08);
  color: white;
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  font-family: inherit;
}
.btn-secondary:hover { background: rgba(255,255,255,0.14); }
.hero-stats {
  display: flex;
  justify-content: center;
  gap: 48px;
  margin-top: 48px;
}
.hero-stat { text-align: center; }
.hero-stat-num {
  display: block;
  font-size: 2rem;
  font-weight: 800;
  color: white;
  line-height: 1;
}
.hero-stat-label {
  font-size: 0.8rem;
  color: rgba(255,255,255,0.5);
  margin-top: 4px;
}

/* ===== SECTIONS ===== */
.landing-section {
  padding: 100px 24px;
  max-width: 1100px;
  margin: 0 auto;
}
.landing-section-alt {
  background: #f8fafc;
  max-width: 100%;
  padding: 100px 24px;
}
.landing-section-alt > * {
  max-width: 1100px;
  margin-left: auto;
  margin-right: auto;
}
.section-label {
  display: inline-block;
  padding: 6px 16px;
  background: rgba(99,102,241,0.08);
  color: #6366f1;
  border-radius: 50px;
  font-size: 0.82rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 16px;
}
.section-title {
  font-size: clamp(1.6rem, 3vw, 2.2rem);
  font-weight: 700;
  margin-bottom: 16px;
  line-height: 1.2;
}
.section-title span { color: #6366f1; }
.section-desc {
  color: #64748b;
  font-size: 1.05rem;
  line-height: 1.7;
  max-width: 600px;
  margin-bottom: 48px;
}

/* ===== FEATURES GRID ===== */
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}
.features-grid .feature-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 28px 24px;
  transition: transform 0.2s, box-shadow 0.2s;
}
.features-grid .feature-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.06);
}
.features-grid .feature-icon {
  font-size: 1.8rem;
  margin-bottom: 14px;
}
.features-grid .feature-card h3 {
  font-size: 1.05rem;
  font-weight: 600;
  margin-bottom: 8px;
}
.features-grid .feature-card p {
  font-size: 0.9rem;
  color: #64748b;
  line-height: 1.6;
}

/* ===== STEPS ===== */
.steps-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 32px;
  position: relative;
}
.step-card {
  text-align: center;
  padding: 32px 24px;
  position: relative;
}
.step-num {
  font-size: 3rem;
  font-weight: 800;
  color: rgba(99,102,241,0.15);
  line-height: 1;
  margin-bottom: 12px;
}
.step-card h3 {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 8px;
}
.step-card p {
  font-size: 0.9rem;
  color: #64748b;
  line-height: 1.6;
}
.step-arrow {
  position: absolute;
  right: -20px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.5rem;
  color: #cbd5e1;
}

/* ===== PRICING ===== */
.pricing-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}
.pricing-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 36px 28px;
  text-align: center;
  position: relative;
  transition: transform 0.2s, box-shadow 0.2s;
}
.pricing-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.06);
}
.pricing-card.featured {
  border-color: #6366f1;
  box-shadow: 0 8px 32px rgba(99,102,241,0.1);
}
.pricing-badge {
  position: absolute;
  top: -13px;
  left: 50%;
  transform: translateX(-50%);
  padding: 6px 20px;
  background: linear-gradient(135deg, #6366f1, #7c3aed);
  color: white;
  border-radius: 50px;
  font-size: 0.8rem;
  font-weight: 600;
}
.pricing-card h3 {
  font-size: 1.2rem;
  font-weight: 700;
  margin-bottom: 8px;
}
.pricing-price {
  font-size: 1.5rem;
  font-weight: 800;
  color: #6366f1;
  margin-bottom: 20px;
}
.pricing-card ul {
  list-style: none;
  text-align: left;
  margin-bottom: 24px;
}
.pricing-card ul li {
  padding: 8px 0 8px 24px;
  position: relative;
  font-size: 0.88rem;
  border-bottom: 1px solid #f1f5f9;
}
.pricing-card ul li:last-child { border-bottom: none; }
.pricing-card ul li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: #10b981;
  font-weight: 700;
}
.pricing-btn {
  width: 100%;
  padding: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}
.pricing-btn:hover { border-color: #6366f1; color: #6366f1; }
.pricing-btn.primary {
  background: linear-gradient(135deg, #6366f1, #7c3aed);
  color: white;
  border: none;
}
.pricing-btn.primary:hover { box-shadow: 0 4px 14px rgba(99,102,241,0.35); }

/* ===== CTA FINAL ===== */
.landing-cta-section {
  background: linear-gradient(135deg, #0f172a, #1e293b);
  text-align: center;
  padding: 100px 24px;
}
.cta-content {
  max-width: 600px;
  margin: 0 auto;
}
.cta-content h2 {
  color: white;
  font-size: clamp(1.6rem, 3vw, 2.2rem);
  font-weight: 700;
  margin-bottom: 16px;
}
.cta-content p {
  color: rgba(255,255,255,0.6);
  font-size: 1.05rem;
  margin-bottom: 32px;
  line-height: 1.6;
}
.btn-lg { padding: 16px 40px; font-size: 1.1rem; }

/* ===== FOOTER ===== */
.landing-footer {
  background: #0f172a;
  padding: 60px 24px 24px;
  color: rgba(255,255,255,0.6);
}
.footer-inner {
  max-width: 1100px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1.5fr 2fr;
  gap: 60px;
  margin-bottom: 40px;
}
.footer-brand .logo-text {
  font-size: 1.1rem;
  font-weight: 700;
  color: white;
}
.footer-brand p {
  font-size: 0.85rem;
  margin-top: 8px;
  line-height: 1.5;
}
.footer-links {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}
.footer-col h4 {
  color: white;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 12px;
}
.footer-col a {
  display: block;
  color: rgba(255,255,255,0.5);
  text-decoration: none;
  font-size: 0.85rem;
  padding: 4px 0;
  transition: color 0.2s;
  cursor: pointer;
}
.footer-col a:hover { color: rgba(255,255,255,0.8); }
.footer-bottom {
  max-width: 1100px;
  margin: 0 auto;
  padding-top: 24px;
  border-top: 1px solid rgba(255,255,255,0.08);
  font-size: 0.82rem;
  text-align: center;
}

/* ===== HAMBURGER BUTTON ===== */
.hamburger {
  display: none;
  flex-direction: column;
  gap: 5px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  z-index: 110;
}
.hamburger span {
  display: block;
  width: 24px;
  height: 2.5px;
  background: #0f172a;
  border-radius: 2px;
  transition: transform 0.3s, opacity 0.3s;
}
.landing-nav.scrolled .hamburger span { background: #0f172a; }
.landing-nav:not(.scrolled) .hamburger span { background: white; }

/* ===== MOBILE OVERLAY ===== */
.mobile-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  z-index: 200;
  backdrop-filter: blur(4px);
  animation: fadeIn 0.2s ease;
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

/* ===== MOBILE SIDEBAR ===== */
.mobile-menu {
  display: none;
  position: fixed;
  top: 0; right: 0;
  width: 280px;
  height: 100vh;
  background: white;
  z-index: 210;
  transform: translateX(100%);
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: -4px 0 24px rgba(0,0,0,0.1);
  overflow-y: auto;
}
.mobile-menu.open { transform: translateX(0); }
.mobile-menu-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #f1f5f9;
}
.mobile-logo { font-weight: 700; font-size: 1rem; }
.mobile-close {
  background: none;
  border: none;
  font-size: 1.2rem;
  color: #64748b;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.2s;
}
.mobile-close:hover { background: #f1f5f9; }
.mobile-nav {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.mobile-nav a {
  display: block;
  padding: 14px 16px;
  color: #334155;
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 500;
  border-radius: 10px;
  transition: background 0.2s, color 0.2s;
  cursor: pointer;
}
.mobile-nav a:hover { background: rgba(99,102,241,0.06); color: #6366f1; }
.mobile-nav hr {
  border: none;
  border-top: 1px solid #f1f5f9;
  margin: 8px 0;
}
.mobile-cta {
  margin-top: 4px;
  padding: 14px 16px;
  background: linear-gradient(135deg, #6366f1, #7c3aed);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: box-shadow 0.2s;
  font-family: inherit;
}
.mobile-cta:hover { box-shadow: 0 4px 14px rgba(99,102,241,0.35); }

/* ===== RESPONSIVE ===== */
@media (max-width: 768px) {
  .hamburger { display: flex; }
  .landing-nav-links { display: none; }
  .mobile-overlay { display: block; }
  .mobile-menu { display: flex; flex-direction: column; }
  .steps-grid { grid-template-columns: 1fr; }
  .step-arrow { display: none; }
  .pricing-grid { grid-template-columns: 1fr; max-width: 400px; margin: 0 auto; }
  .hero-stats { gap: 24px; }
  .footer-inner { grid-template-columns: 1fr; gap: 32px; }
  .footer-links { grid-template-columns: 1fr 1fr; }
}
`;

const features = [
  {
    icon: '📊',
    title: 'Dashboard Inteligente',
    desc: 'KPIs en tiempo real, gráficos de ventas, productos más vendidos y alertas de stock bajo.',
  },
  {
    icon: '📦',
    title: 'Control de Inventario',
    desc: 'Catálogo completo con SKU, precios, costos y alertas automáticas de stock mínimo.',
  },
  {
    icon: '🛒',
    title: 'Punto de Venta',
    desc: 'Ventas rápidas con carrito, búsqueda instantánea y múltiples formas de pago.',
  },
  {
    icon: '👥',
    title: 'CRM + Fidelización',
    desc: 'Clientes con historial de compras y programa de puntos canjeables por descuentos.',
  },
  {
    icon: '📈',
    title: 'Reportes Avanzados',
    desc: 'Rentabilidad por producto, gastos por proveedor y tendencias mensuales.',
  },
  {
    icon: '☁️',
    title: '100% en la Nube',
    desc: 'Accede desde cualquier dispositivo. Sin instalaciones ni servidores. Seguridad profesional.',
  },
];

const steps = [
  { num: '01', title: 'Crea tu cuenta', desc: 'Registra tu negocio en minutos. Solo necesitas un nombre y un correo.' },
  { num: '02', title: 'Configura tu catálogo', desc: 'Agrega productos, categorías, proveedores y precios.' },
  { num: '03', title: 'Empieza a vender', desc: 'Realiza tu primera venta. El stock se actualiza automáticamente.' },
];

export default function Landing() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Cerrar menú al rotar la pantalla a desktop
  useEffect(() => {
    const onResize = () => { if (window.innerWidth > 768) setMenuOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Bloquear scroll del body cuando el menú mobile está abierto
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const scrollTo = (id) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="landing">
      <style>{styles}</style>

      {/* ========== MOBILE MENU OVERLAY ========== */}
      {menuOpen && <div className="mobile-overlay" onClick={() => setMenuOpen(false)} />}

      {/* ========== MOBILE SIDEBAR ========== */}
      <aside className={`mobile-menu${menuOpen ? ' open' : ''}`}>
        <div className="mobile-menu-header">
          <span className="mobile-logo">📊 Gestión<span className="logo-accent">Comercial</span></span>
          <button className="mobile-close" onClick={() => setMenuOpen(false)}>✕</button>
        </div>
        <nav className="mobile-nav">
          <a onClick={() => scrollTo('features')}>Funcionalidades</a>
          <a onClick={() => scrollTo('how')}>Cómo funciona</a>
          <a onClick={() => scrollTo('pricing')}>Precios</a>
          <hr />
          <button className="mobile-cta" onClick={() => { setMenuOpen(false); navigate('/login'); }}>
            🚀 Ingresar al Sistema
          </button>
        </nav>
      </aside>

      {/* ========== NAVBAR ========== */}
      <nav className={`landing-nav${scrolled ? ' scrolled' : ''}`}>
        <div className="landing-nav-inner">
          <div className="landing-logo">
            <span className="logo-icon">📊</span>
            <span className="logo-text">Gestión<span className="logo-accent">Comercial</span></span>
          </div>
          <div className="landing-nav-links">
            <a href="#features">Funcionalidades</a>
            <a href="#how">Cómo funciona</a>
            <a href="#pricing">Precios</a>
            <button className="nav-cta" onClick={() => navigate('/login')}>
              Ingresar
            </button>
          </div>
          {/* Hamburger button — visible only on mobile */}
          <button className="hamburger" onClick={() => setMenuOpen(true)} aria-label="Abrir menú">
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* ========== HERO ========== */}
      <section className="landing-hero">
        <div className="hero-bg">
          <div className="hero-glow hero-glow-1"></div>
          <div className="hero-glow hero-glow-2"></div>
        </div>
        <div className="hero-content">
          <div className="hero-badge">🚀 Sistema Profesional de Gestión</div>
          <h1>
            Controla tu negocio<br />
            <span className="hero-highlight">desde cualquier lugar</span>
          </h1>
          <p className="hero-desc">
            La plataforma integral para administrar inventario, ventas, clientes y 
            reportes. Todo en un solo lugar, sin complicaciones.
          </p>
          <div className="hero-cta">
            <button className="btn-primary" onClick={() => navigate('/login')}>
              🚀 Acceder al Sistema
            </button>
            <button className="btn-secondary" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
              Ver funcionalidades
            </button>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-num">9</span>
              <span className="hero-stat-label">Módulos</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-num">100%</span>
              <span className="hero-stat-label">Cloud</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-num">5</span>
              <span className="hero-stat-label">Tipos de negocio</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========== FEATURES ========== */}
      <section className="landing-section" id="features">
        <div className="section-label">Funcionalidades</div>
        <h2 className="section-title">Todo lo que necesitas para <span>gestionar tu negocio</span></h2>
        <p className="section-desc">
          Desde el control de inventario hasta reportes de rentabilidad, nuestro sistema 
          cubre cada aspecto de tu operación comercial.
        </p>
        <div className="features-grid">
          {features.map((f, i) => (
            <div className="feature-card" key={i}>
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section className="landing-section landing-section-alt" id="how">
        <div className="section-label">Cómo funciona</div>
        <h2 className="section-title">Empieza en <span>3 simples pasos</span></h2>
        <p className="section-desc">
          En menos de 5 minutos puedes tener tu negocio configurado y listo para operar.
        </p>
        <div className="steps-grid">
          {steps.map((s, i) => (
            <div className="step-card" key={i}>
              <div className="step-num">{s.num}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
              {i < steps.length - 1 && <div className="step-arrow">→</div>}
            </div>
          ))}
        </div>
      </section>

      {/* ========== PRICING ========== */}
      <section className="landing-section" id="pricing">
        <div className="section-label">Planes</div>
        <h2 className="section-title">Precios <span>transparentes</span></h2>
        <p className="section-desc">
          Elige el plan que mejor se adapte a tu negocio. Todos incluyen actualizaciones y soporte.
        </p>
        <div className="pricing-grid">
          <div className="pricing-card">
            <h3>Básico</h3>
            <p className="pricing-price">Consultar</p>
            <ul>
              <li>Hasta 500 productos</li>
              <li>Gestión de ventas y compras</li>
              <li>Dashboard básico</li>
              <li>Exportación a CSV</li>
              <li>1 usuario</li>
            </ul>
            <button className="pricing-btn" onClick={() => navigate('/login')}>Comenzar</button>
          </div>
          <div className="pricing-card featured">
            <div className="pricing-badge">Recomendado</div>
            <h3>Profesional</h3>
            <p className="pricing-price">Consultar</p>
            <ul>
              <li>Productos ilimitados</li>
              <li>CRM con puntos de fidelidad</li>
              <li>Reportes avanzados</li>
              <li>Exportación PDF y CSV</li>
              <li>Hasta 5 usuarios</li>
              <li>Soporte prioritario</li>
            </ul>
            <button className="pricing-btn primary" onClick={() => navigate('/login')}>Comenzar</button>
          </div>
          <div className="pricing-card">
            <h3>Enterprise</h3>
            <p className="pricing-price">Consultar</p>
            <ul>
              <li>Todo lo del plan Profesional</li>
              <li>API personalizada</li>
              <li>Usuarios ilimitados</li>
              <li>Dominio personalizado</li>
              <li>Capacitación</li>
              <li>SLA 99.9%</li>
            </ul>
            <button className="pricing-btn" onClick={() => navigate('/login')}>Contactar</button>
          </div>
        </div>
      </section>

      {/* ========== CTA FINAL ========== */}
      <section className="landing-cta-section">
        <div className="cta-content">
          <h2>¿Listo para transformar tu negocio?</h2>
          <p>Únete a las empresas que ya confían en nuestro sistema. Solicita una demo gratuita.</p>
          <button className="btn-primary btn-lg" onClick={() => navigate('/login')}>
            🚀 Ingresar Ahora
          </button>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <span className="logo-text">Gestión<span className="logo-accent">Comercial</span></span>
            <p>Sistema profesional de gestión de inventario y ventas.</p>
          </div>
          <div className="footer-links">
            <div className="footer-col">
              <h4>Producto</h4>
              <a href="#features">Funcionalidades</a>
              <a href="#pricing">Precios</a>
              <a href="#how">Cómo funciona</a>
            </div>
            <div className="footer-col">
              <h4>Empresa</h4>
              <a href="#contacto">Contacto</a>
              <a href="#soporte">Soporte</a>
            </div>
            <div className="footer-col">
              <h4>Legal</h4>
              <a>Términos</a>
              <a>Privacidad</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          © {new Date().getFullYear()} Gestión Comercial. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}
