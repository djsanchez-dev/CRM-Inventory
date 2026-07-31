import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef, useCallback } from 'react';
import { LayoutDashboard, Zap, ShoppingCart, Users, Package, Cloud, X, BarChart3, ChevronDown, Star, Check, ChevronRight } from 'lucide-react';
import '../styles/landing.css';

const features = [
  { icon: LayoutDashboard, title: 'Dashboard Inteligente', desc: 'KPIs en tiempo real, gráficos de ventas, productos más vendidos y alertas de stock bajo.' },
  { icon: Package, title: 'Control de Inventario', desc: 'Catálogo completo con SKU, precios, costos y alertas automáticas de stock mínimo.' },
  { icon: ShoppingCart, title: 'Punto de Venta', desc: 'Ventas rápidas con carrito, búsqueda instantánea y múltiples formas de pago.' },
  { icon: Users, title: 'CRM + Fidelización', desc: 'Clientes con historial de compras y programa de puntos canjeables por descuentos.' },
  { icon: BarChart3, title: 'Reportes Avanzados', desc: 'Rentabilidad por producto, gastos por proveedor y tendencias mensuales.' },
  { icon: Cloud, title: '100% en la Nube', desc: 'Accede desde cualquier dispositivo. Sin instalaciones ni servidores. Seguridad profesional.' },
];

const steps = [
  { num: '01', title: 'Crea tu cuenta', desc: 'Registra tu negocio en minutos. Solo necesitas un nombre y un correo.' },
  { num: '02', title: 'Configura tu catálogo', desc: 'Agrega productos, categorías, proveedores y precios.' },
  { num: '03', title: 'Empieza a vender', desc: 'Realiza tu primera venta. El stock se actualiza automáticamente.' },
];

const testimonials = [
  { name: 'María García', role: 'Dueña de Tienda de Ropa', text: '"Desde que uso Gestión Comercial, dupliqué mis ventas. El control de inventario me salvó de perder productos."', stars: 5, avatar: 'M' },
  { name: 'Carlos López', role: 'Gerente de Abarrotes', text: '"La mejor decisión que tomé. En 5 minutos tenía mi negocio configurado y facturando. El soporte es increíble."', stars: 5, avatar: 'C' },
  { name: 'Ana Martínez', role: 'Administradora de Licorería', text: '"Los reportes de rentabilidad me ayudan a saber exactamente qué productos dejan más ganancia. Imprescindible."', stars: 5, avatar: 'A' },
];

// Hook: scroll reveal
function useScrollReveal(threshold = 0.12) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.unobserve(el); } },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return [ref, visible];
}

// Hook: animated counter
function useCountUp(end, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) { setCount(0); return; }
    let raf;
    const startTime = performance.now();
    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [end, duration, start]);
  return count;
}

const plans = [
  {
    name: 'Gratuito', sub: 'Para empezar sin riesgos', price: '$0', period: '/mes',
    features: ['Hasta 100 productos', 'Gestión de ventas y compras', 'Dashboard básico', 'Exportación a CSV', '1 usuario', 'Soporte comunitario'],
    cta: 'Comenzar gratis', action: '/setup', featured: false,
  },
  {
    name: 'Básico', sub: 'Para negocios en crecimiento', price: '$1', period: '/mes',
    features: ['Hasta 1,000 productos', 'CRM con puntos de fidelidad', 'Reportes avanzados', 'Exportación PDF y CSV', 'Hasta 3 usuarios', 'Soporte por email', 'Alertas de stock'],
    cta: 'Empezar ahora', action: '/setup', featured: true,
  },
  {
    name: 'Premium', sub: 'Para empresas consolidadas', price: '$5', period: '/mes',
    features: ['Productos ilimitados', 'CRM + automatizaciones', 'Reportes personalizados', 'API pública', 'Usuarios ilimitados', 'Soporte prioritario 24/7', 'Dominio personalizado', 'Capacitación incluida', 'SLA 99.9%'],
    cta: 'Contratar Premium', action: '/setup', featured: false,
  },
];

function Section({ id, children, className = '' }) {
  const [ref, visible] = useScrollReveal();
  return (
    <section id={id} ref={ref} className={`scroll-section ${className} ${visible ? 'visible' : ''}`}>
      {children}
    </section>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);
  const statsRef = useRef(null);
  const [statsVisible, setStatsVisible] = useState(false);
  const count9 = useCountUp(9, 1800, statsVisible);
  const count100 = useCountUp(100, 1800, statsVisible);
  const count5 = useCountUp(5, 1800, statsVisible);

  useEffect(() => {
    setHeroVisible(true);
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onResize = () => { if (window.innerWidth > 768) setMenuOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStatsVisible(true); obs.unobserve(el); } },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const scrollTo = useCallback((id) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const FeatureIcon = ({ icon: Icon }) => <div className="feature-icon"><Icon size={24} /></div>;

  return (
    <div className="landing">
      {menuOpen && <div className="mobile-overlay" onClick={() => setMenuOpen(false)} />}

      <aside className={`mobile-menu${menuOpen ? ' open' : ''}`}>
        <div className="mobile-menu-header">
          <span className="mobile-logo"><LayoutDashboard size={16} /> Gestión<span className="logo-accent">Comercial</span></span>
          <button className="mobile-close" onClick={() => setMenuOpen(false)}><X size={18} /></button>
        </div>
        <nav className="mobile-nav">
          <a onClick={() => scrollTo('features')}>Funcionalidades</a>
          <a onClick={() => scrollTo('how')}>Cómo funciona</a>
          <a onClick={() => scrollTo('pricing')}>Planes</a>
          <hr />
          <button className="mobile-cta" onClick={() => { setMenuOpen(false); navigate('/login'); }}>Ingresar al Sistema</button>
          <hr />
          <a onClick={() => { setMenuOpen(false); navigate('/setup'); }}>Crear cuenta gratuita</a>
        </nav>
      </aside>

      <nav className={`landing-nav${scrolled ? ' scrolled' : ''}`}>
        <div className="landing-nav-inner">
          <div className="landing-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ cursor: 'pointer' }}>
            <span className="logo-icon"><LayoutDashboard size={20} color="white" /></span>
            <span className="logo-text">Gestión<span className="logo-accent">Comercial</span></span>
          </div>
          <div className="landing-nav-links">
            <a href="#features">Funcionalidades</a>
            <a href="#how">Cómo funciona</a>
            <a href="#pricing">Planes</a>
            <button className="btn btn-outline" onClick={() => navigate('/setup')}>Crear cuenta</button>
            <button className="btn btn-primary" onClick={() => navigate('/login')}>Ingresar</button>
          </div>
          <button className="hamburger" onClick={() => setMenuOpen(true)} aria-label="Abrir menú">
            <span /><span /><span />
          </button>
        </div>
      </nav>

      <section className="landing-hero">
        <div className="hero-bg">
          <div className="hero-glow hero-glow-1" />
          <div className="hero-glow hero-glow-2" />
          <div className="hero-grid-bg" />
        </div>
        <div className={`hero-content ${heroVisible ? 'visible' : ''}`}>
          <div className="hero-badge"><Zap size={14} /> Sistema Profesional de Gestión</div>
          <h1>Controla tu negocio<br /><span className="hero-highlight">desde cualquier lugar</span></h1>
          <p className="hero-desc">La plataforma integral para administrar inventario, ventas, clientes y reportes. Todo en un solo lugar, sin complicaciones.</p>
          <div className="hero-cta">
            <button className="btn btn-primary btn-pulse" onClick={() => navigate('/login')}>Ingresar al Sistema</button>
            <button className="btn btn-secondary" onClick={() => navigate('/setup')}>Crear cuenta gratuita</button>
          </div>
          <p className="hero-note">¿Primera vez? Crea tu cuenta en <strong>menos de 2 minutos</strong>. Sin compromisos.</p>
          <div className="hero-stats" ref={statsRef}>
            <div className="hero-stat"><span className="hero-stat-num">{count9}</span><span className="hero-stat-label">Módulos</span></div>
            <div className="hero-stat"><span className="hero-stat-num">{count100}%</span><span className="hero-stat-label">Cloud</span></div>
            <div className="hero-stat"><span className="hero-stat-num">{count5}</span><span className="hero-stat-label">Tipos de negocio</span></div>
          </div>
          <div className="scroll-indicator"><ChevronDown size={20} /></div>
        </div>
      </section>

      <Section id="features">
        <div className="section-label">Funcionalidades</div>
        <h2 className="section-title">Todo lo que necesitas para <span>gestionar tu negocio</span></h2>
        <p className="section-desc">Desde el control de inventario hasta reportes de rentabilidad.</p>
        <div className="features-grid">
          {features.map((f, i) => (
            <div className="feature-card stagger-item" key={i} style={{ animationDelay: `${i * 80}ms` }}>
              <FeatureIcon icon={f.icon} />
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="how" className="landing-section-alt">
        <div className="section-label">Cómo funciona</div>
        <h2 className="section-title">Empieza en <span>3 simples pasos</span></h2>
        <p className="section-desc">En menos de 5 minutos puedes tener tu negocio configurado.</p>
        <div className="steps-grid">
          {steps.map((s, i) => (
            <div className="step-card stagger-item" key={i} style={{ animationDelay: `${i * 120}ms` }}>
              <div className="step-num">{s.num}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="pricing" className="landing-section-alt">
        <div className="section-label">Planes</div>
        <h2 className="section-title">Precios <span>para todos</span></h2>
        <p className="section-desc">Empieza gratis. Escala cuando lo necesites. Sin contratos ni sorpresas.</p>
        <div className="pricing-grid">
          {plans.map((plan, i) => (
            <div className={`pricing-card ${plan.featured ? 'featured' : ''} stagger-item`} key={i} style={{ animationDelay: `${i * 100}ms` }}>
              {plan.featured && <div className="pricing-badge">Más Popular</div>}
              <h3>{plan.name}</h3>
              <p className="pricing-sub">{plan.sub}</p>
              <p className="pricing-price">
                <span className="pricing-amount">{plan.price}</span>
                <span className="pricing-period">{plan.period}</span>
              </p>
              <ul>{plan.features.map((f, j) => <li key={j}>{f}</li>)}</ul>
              <button className={`pricing-btn ${plan.featured ? 'primary' : ''}`} onClick={() => navigate(plan.action)}>
                {plan.cta} <ChevronRight size={16} />
              </button>
            </div>
          ))}
        </div>

        <div className="pricing-footnote">
          <Check size={14} /> Todos los planes incluyen <strong>14 días de prueba gratuita</strong>. Sin tarjeta de crédito.
        </div>
      </Section>

      <Section id="testimonials" className="landing-section-alt">
        <div className="section-label">Testimonios</div>
        <h2 className="section-title">Lo que dicen <span>nuestros usuarios</span></h2>
        <p className="section-desc">Más de 500 negocios confían en Gestión Comercial para administrar su inventario.</p>
        <div className="testimonials-grid">
          {testimonials.map((t, i) => (
            <div className="testimonial-card stagger-item" key={i} style={{ animationDelay: `${i * 120}ms` }}>
              <div className="testimonial-stars">
                {Array.from({ length: t.stars }).map((_, j) => <Star key={j} size={14} fill="#f59e0b" color="#f59e0b" />)}
              </div>
              <p className="testimonial-text">{t.text}</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar">{t.avatar}</div>
                <div className="testimonial-info">
                  <span className="testimonial-name">{t.name}</span>
                  <span className="testimonial-role">{t.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <section className="landing-cta-section">
        <div className="cta-glow" />
        <div className="cta-content">
          <h2>¿Listo para optimizar tu negocio?</h2>
          <p>Comienza hoy y descubre por qué empresas confían en nuestra plataforma.</p>
          <div className="cta-buttons">
            <button className="btn btn-primary btn-lg btn-pulse" onClick={() => navigate('/login')}>Ingresar al Sistema</button>
            <button className="btn btn-secondary btn-lg" onClick={() => navigate('/setup')}>Crear cuenta gratuita</button>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="footer-logo"><LayoutDashboard size={16} /> Gestión<span className="logo-accent">Comercial</span></div>
            <p>Sistema profesional de gestión de inventario, ventas y clientes. Todo en la nube.</p>
          </div>
          <div className="footer-links">
            {[
              { title: 'Producto', links: ['Funcionalidades', 'Precios', 'Cómo funciona'] },
              { title: 'Empresa', links: ['Contacto', 'Soporte'] },
              { title: 'Legal', links: ['Términos', 'Privacidad'] },
            ].map((col, i) => (
              <div className="footer-col" key={i}>
                <h4>{col.title}</h4>
                {col.links.map((link, j) => <a key={j}>{link}</a>)}
              </div>
            ))}
          </div>
        </div>
        <div className="footer-bottom">© {new Date().getFullYear()} Gestión Comercial. Todos los derechos reservados.</div>
      </footer>
    </div>
  );
}
