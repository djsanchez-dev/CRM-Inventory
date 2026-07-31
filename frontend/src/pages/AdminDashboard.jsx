import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Skeleton from '../components/Skeleton';
import { Building2, Users, Package, ShoppingCart, Shield } from '../components/Icons';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.rol !== 'super_admin') {
      navigate('/app');
      return;
    }
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await api.getAdminStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <Skeleton.Stats count={4} />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <Shield size={48} />
          <h3>Error al cargar estadísticas</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container admin-dashboard">
      <div className="admin-welcome">
        <div className="admin-welcome-icon"><Shield size={24} /></div>
        <div>
          <h2>Panel de Administración</h2>
          <p>Bienvenido, {user?.nombre}. Gestión global del sistema CRM.</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card" onClick={() => navigate('/admin/businesses')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
            <Building2 size={28} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Negocios Registrados</span>
            <span className="stat-value">{stats.totalBusinesses}</span>
          </div>
        </div>

        <div className="stat-card" onClick={() => navigate('/admin/users')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <Users size={28} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Usuarios del Sistema</span>
            <span className="stat-value">{stats.totalUsers}</span>
          </div>
        </div>

        <div className="stat-card" style={{ cursor: 'default' }}>
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
            <Package size={28} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Productos Totales</span>
            <span className="stat-value">{stats.totalProducts}</span>
          </div>
        </div>

        <div className="stat-card" style={{ cursor: 'default' }}>
          <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
            <ShoppingCart size={28} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Ventas Totales</span>
            <span className="stat-value">{stats.totalSales}</span>
          </div>
        </div>
      </div>

      <div className="admin-quick-actions">
        <h3>Acciones Rápidas</h3>
        <div className="admin-action-grid">
          <button className="admin-action-card" onClick={() => navigate('/admin/businesses')}>
            <Building2 size={24} />
            <span>Gestionar Negocios</span>
            <span className="admin-action-desc">Ver, modificar o eliminar negocios</span>
          </button>
          <button className="admin-action-card" onClick={() => navigate('/admin/users')}>
            <Users size={24} />
            <span>Gestionar Usuarios</span>
            <span className="admin-action-desc">Resetear contraseñas, editar o eliminar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
