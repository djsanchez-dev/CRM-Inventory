import { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBusinessConfig } from '../context/BusinessConfig';
import { api } from '../api/client';
import Logo from './Logo';
import {
  Dashboard as DashboardIcon,
  Products,
  Tags,
  Customers,
  Suppliers,
  Sales,
  Purchases,
  Services as ServicesIcon,
  Reports,
  Users,
  Shield,
  Building2,
  Bike as DeliveryIcon,
} from './Icons';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const { user, business, logout } = useAuth();
  const { t, tipo } = useBusinessConfig();
  const location = useLocation();
  const navigate = useNavigate();

  // Icon and color mapping for each section
  const navIconMap = {
    '/app': { icon: DashboardIcon, color: '#6366f1', bg: 'rgba(99, 102, 241, 0.12)' },
    '/app/products': { icon: Products, color: '#2563eb', bg: 'rgba(37, 99, 235, 0.12)' },
    '/app/categories': { icon: Tags, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
    '/app/customers': { icon: Customers, color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' },
    '/app/suppliers': { icon: Suppliers, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)' },
    '/app/purchases': { icon: Purchases, color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.12)' },
    '/app/sales': { icon: Sales, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' },
    '/app/services': { icon: ServicesIcon, color: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.12)' },
    '/app/delivery': { icon: DeliveryIcon, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
    '/app/reports': { icon: Reports, color: '#7c3aed', bg: 'rgba(124, 58, 237, 0.12)' },
    '/app/users': { icon: Users, color: '#6b7280', bg: 'rgba(107, 114, 128, 0.12)' },
    '/app/admin': { icon: Shield, color: '#dc2626', bg: 'rgba(220, 38, 38, 0.12)' },
    '/app/admin/businesses': { icon: Building2, color: '#dc2626', bg: 'rgba(220, 38, 38, 0.12)' },
    '/app/admin/users': { icon: Users, color: '#dc2626', bg: 'rgba(220, 38, 38, 0.12)' },
  };

  // Services module (Car Wash / Mecánica) is only available for carwash-type businesses
  const showServices = tipo === 'carwash';

  // Delivery module is only available for licorería-type businesses
  const showDelivery = tipo === 'licoreria' || tipo === 'general';

  const navItems = [
    { to: '/app', label: t('dashboard'), end: true },
    { to: '/app/products', label: t('product_plural') },
    { to: '/app/categories', label: t('category_plural') },
    { to: '/app/customers', label: t('customer_plural') },
    { to: '/app/suppliers', label: t('supplier_plural') },
    { to: '/app/purchases', label: t('purchase_plural') },
    { to: '/app/sales', label: t('sale_plural') },
    ...(showServices ? [{ to: '/app/services', label: t('service_plural') }] : []),
    ...(showDelivery ? [{ to: '/app/delivery', label: 'Delivery' }] : []),
    { to: '/app/reports', label: t('report_plural') },
  ];

  const adminNavItems = [
    { to: '/app/users', label: t('user_plural') },
  ];

  const superAdminNavItems = [
    { to: '/app/admin', label: 'Panel Admin', end: true },
    { to: '/app/admin/businesses', label: 'Negocios' },
    { to: '/app/admin/users', label: 'Usuarios' },
  ];

  const renderNavIcon = (to) => {
    const mapping = navIconMap[to];
    if (!mapping) return null;
    const Icon = mapping.icon;
    return (
      <span
        className="nav-icon"
        style={{ background: mapping.bg, color: mapping.color }}
      >
        <Icon size={20} />
      </span>
    );
  };

  // Poll for low stock every 60 seconds
  useEffect(() => {
    const checkLowStock = async () => {
      try {
        const data = await api.getProducts('?low_stock=true');
        setLowStockCount(data?.data?.length || 0);
      } catch (e) { /* ignore */ }
    };
    checkLowStock();
    const interval = setInterval(checkLowStock, 60000);
    return () => clearInterval(interval);
  }, []);

  const pageTitle = [
    // Admin routes first (more specific)
    { to: '/app/admin/businesses', label: 'Negocios' },
    { to: '/app/admin/users', label: 'Usuarios' },
    { to: '/app/admin', label: 'Panel Admin' },
    // Regular nav items
    ...navItems,
  ].find(
    (item) => item.to === location.pathname || 
      (!item.end && item.to !== '/' && location.pathname.startsWith(item.to))
  )?.label || 'Dashboard';

  return (
    <div className="layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-icon">
              <Logo variant="glyph" size={40} label="CRM" />
            </div>
            <div className="logo-text">
              <span className="logo-title">CRM Inventario</span>
              <span className="logo-subtitle">{business?.nombre || 'Sistema de Gestión'}</span>
            </div>
          </div>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Cerrar sidebar">
            <Logo variant="close" size={18} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {user?.rol !== 'super_admin' && navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              {renderNavIcon(item.to)}
              <span>{item.label}</span>
            </NavLink>
          ))}

          {user?.rol === 'super_admin' && (
            <>
              <div className="nav-section-label">Super Admin</div>
              {superAdminNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  {renderNavIcon(item.to)}
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </>
          )}
          {user?.rol === 'admin' && (
            <>
              <div className="nav-section-label">Admin</div>
              {adminNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  {renderNavIcon(item.to)}
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {user?.nombre?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="user-details">
              <span className="user-name">{user?.nombre || 'Usuario'}</span>
              <span className="user-role">{user?.rol === 'super_admin' ? 'Super Admin' : user?.rol === 'admin' ? 'Administrador' : 'Usuario'}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button className="menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Abrir menú">
              <Logo variant="menu" size={22} />
            </button>
            <h1 className="page-title">{pageTitle}</h1>
          </div>

          <div className="topbar-right">
            {/* Notification Bell */}
            <div className="notif-btn-wrapper">
              <button
                className="notif-btn"
                onClick={() => {
                  if (lowStockCount > 0) {
                    navigate('/app/products?low_stock=1');
                  } else {
                    setNotifOpen(!notifOpen);
                  }
                }}
                title={lowStockCount > 0 ? `${lowStockCount} producto(s) con stock bajo` : 'Sin alertas'}
              >
                <Logo variant="bell" size={20} />
                {lowStockCount > 0 && (
                  <span className="notif-badge">
                    {lowStockCount > 99 ? '99+' : lowStockCount}
                  </span>
                )}
              </button>
              {notifOpen && lowStockCount === 0 && (
                <>
                  <div className="user-menu-overlay" onClick={() => setNotifOpen(false)} />
                  <div className="notif-dropdown">
                    <div className="notif-empty">
                      <Logo variant="bell" size={24} />
                      <span>No hay alertas</span>
                      <span className="text-muted">Todo en orden con tu inventario</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="user-menu">
              <button
                className="user-btn"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                <div className="user-avatar small">
                  {user?.nombre?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <span className="user-name-text">{user?.nombre || 'Usuario'}</span>
                <Logo variant="chev" size={14} />
              </button>

              {userMenuOpen && (
                <>
                  <div className="user-menu-overlay" onClick={() => setUserMenuOpen(false)} />
                  <div className="user-dropdown">
                    <div className="dropdown-header">
                      <span className="dropdown-user-name">{user?.nombre}</span>
                      <span className="dropdown-user-role">{user?.rol === 'super_admin' ? 'Super Admin' : user?.rol === 'admin' ? 'Administrador' : 'Usuario'}</span>
                    </div>
                    <hr />
                    <NavLink to="/app/profile" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                      <span>Mi Perfil</span>
                    </NavLink>
                    <hr />
                    <button className="dropdown-item logout" onClick={logout}>
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
