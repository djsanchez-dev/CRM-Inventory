import { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from '../api/client';
import { Plus, Search, X, Bike, MapPin, Clock, User, CheckCircle2, Truck, Package, Eye } from '../components/Icons';
import { useBusinessConfig } from '../context/BusinessConfig';
import { useToast } from '../components/Toast';
import Skeleton from '../components/Skeleton';
import SaleCreateModal from '../components/sales/SaleCreateModal';
import SaleDetailModal from '../components/sales/SaleDetailModal';

const ESTADOS = [
  { id: 'pendiente', label: 'Pendiente', icon: Clock, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
  { id: 'en_camino', label: 'En camino', icon: Truck, color: '#6366f1', bg: 'rgba(99, 102, 241, 0.12)' },
  { id: 'entregado', label: 'Entregado', icon: CheckCircle2, color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' },
  { id: 'cancelado', label: 'Cancelado', icon: X, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' },
];

const NEXT_STATE = { pendiente: 'en_camino', en_camino: 'entregado', entregado: null, cancelado: null };
const estadoMeta = (id) => ESTADOS.find((e) => e.id === id) || ESTADOS[0];

export default function Delivery() {
  const { tipo, loading: configLoading, moneda } = useBusinessConfig();
  const toast = useToast();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [detailSale, setDetailSale] = useState(null);

  const loadDeliveries = useCallback(async () => {
    try {
      const params = new URLSearchParams({ delivery: 'true', limit: '200' });
      if (search) params.set('search', search);
      if (estadoFilter) params.set('estado_delivery', estadoFilter);
      const result = await api.getSales(`?${params.toString()}`);
      setDeliveries(result.data || []);
    } catch (error) {
      console.error('Error loading deliveries:', error);
    } finally {
      setLoading(false);
    }
  }, [search, estadoFilter]);

  useEffect(() => {
    const timeout = setTimeout(() => loadDeliveries(), 250);
    // Auto-refresh every 30s so deliveries created from Ventas appear here
    const interval = setInterval(loadDeliveries, 30000);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [loadDeliveries]);

  const openCreateModal = async () => {
    try {
      const [productsData, customersData] = await Promise.all([
        api.getProducts('?limit=500'),
        api.getCustomers('?limit=500'),
      ]);
      setProducts(productsData.data || []);
      setCustomers(customersData.data || []);
      setShowCreateModal(true);
    } catch (error) {
      toast.error('Error al cargar datos: ' + error.message);
    }
  };

  const handleCreateDelivery = async (saleData) => {
    try {
      await api.createSale(saleData);
      setShowCreateModal(false);
      toast.success('Pedido delivery registrado correctamente');
      loadDeliveries();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const advanceState = async (sale) => {
    const next = NEXT_STATE[sale.estado_delivery];
    if (!next) return;
    try {
      await api.updateDeliveryStatus(sale.id, { estado_delivery: next });
      toast.success(`Pedido #${sale.id} marcado como "${estadoMeta(next).label}"`);
      loadDeliveries();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const cancelDelivery = async (sale) => {
    try {
      await api.updateDeliveryStatus(sale.id, { estado_delivery: 'cancelado' });
      toast.success(`Pedido #${sale.id} cancelado`);
      loadDeliveries();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const viewDetail = async (sale) => {
    try {
      const detail = await api.getSale(sale.id);
      setDetailSale(detail);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const formatCurrency = (v) =>
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: moneda || 'PEN' }).format(Number(v) || 0);

  const formatTime = (date) =>
    new Date(date).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

  // Only licorería (and general as fallback) get the Delivery section
  if (configLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Cargando...</p>
      </div>
    );
  }
  if (tipo !== 'licoreria' && tipo !== 'general') {
    return <Navigate to="/app" replace />;
  }

  const counts = {
    pendiente: deliveries.filter((d) => d.estado_delivery === 'pendiente').length,
    en_camino: deliveries.filter((d) => d.estado_delivery === 'en_camino').length,
    entregado: deliveries.filter((d) => d.estado_delivery === 'entregado').length,
  };

  if (loading && deliveries.length === 0) {
    return (
      <div className="page-container">
        <Skeleton.Stats count={3} />
        <Skeleton.Table rows={4} columns={6} />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="delivery-header">
        <div className="delivery-title">
          <div className="delivery-title-icon"><Bike size={22} /></div>
          <div>
            <h2>Delivery</h2>
            <p>Gestiona los pedidos a domicilio</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <Plus size={18} />
          <span>Nuevo Pedido Delivery</span>
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Pendientes</span>
            <span className="stat-value">{counts.pendiente}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
            <Truck size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">En camino</span>
            <span className="stat-value">{counts.en_camino}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <CheckCircle2 size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Entregados</span>
            <span className="stat-value">{counts.entregado}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9' }}>
            <Package size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total pedidos</span>
            <span className="stat-value">{deliveries.length}</span>
          </div>
        </div>
      </div>

      <div className="toolbar" style={{ marginTop: 0 }}>
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar por pedido, cliente o dirección..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="clear-btn" onClick={() => setSearch('')}>
              <X size={16} />
            </button>
          )}
        </div>
        <div className="toolbar-filters">
          <div className="service-type-filter">
            <button
              className={`service-filter-btn ${estadoFilter === '' ? 'active' : ''}`}
              onClick={() => setEstadoFilter('')}
            >
              Todos
            </button>
            {ESTADOS.map((est) => (
              <button
                key={est.id}
                className={`service-filter-btn ${estadoFilter === est.id ? 'active' : ''}`}
                onClick={() => setEstadoFilter(estadoFilter === est.id ? '' : est.id)}
              >
                {est.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="delivery-list">
        {deliveries.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Bike size={36} /></div>
            <h3>No hay pedidos de delivery</h3>
            <p>Registra tu primer pedido a domicilio para verlo aquí.</p>
            <button className="btn btn-primary" onClick={openCreateModal}>
              <Plus size={18} />
              <span>Nuevo Pedido Delivery</span>
            </button>
          </div>
        ) : (
          deliveries.map((d) => {
            const meta = estadoMeta(d.estado_delivery);
            const StatusIcon = meta.icon;
            return (
              <div className="delivery-card" key={d.id}>
                <div className="delivery-card-main">
                  <div className="delivery-card-top">
                    <span className="delivery-order">Pedido #{d.id}</span>
                    <span
                      className="badge"
                      style={{ background: meta.bg, color: meta.color, display: 'inline-flex', alignItems: 'center', gap: 5 }}
                    >
                      <StatusIcon size={13} />
                      {meta.label}
                    </span>
                  </div>
                  <div className="delivery-customer">
                    <User size={16} />
                    <span>{d.customer_name || 'Cliente exprés'}</span>
                  </div>
                  {d.direccion_entrega && (
                    <div className="delivery-address">
                      <MapPin size={16} />
                      <span>{d.direccion_entrega}</span>
                    </div>
                  )}
                  {d.repartidor && (
                    <div className="delivery-rider">
                      <Bike size={16} />
                      <span>Repartidor: {d.repartidor}</span>
                    </div>
                  )}
                  <div className="delivery-time">
                    <Clock size={14} />
                    <span>{formatTime(d.created_at)}</span>
                  </div>
                </div>
                <div className="delivery-card-side">
                  <div className="delivery-total">{formatCurrency(d.total)}</div>
                  <div className="delivery-actions">
                    {d.estado_delivery === 'pendiente' && (
                      <button className="btn btn-sm btn-primary" onClick={() => advanceState(d)}>
                        <Truck size={15} />
                        <span>Enviar</span>
                      </button>
                    )}
                    {d.estado_delivery === 'en_camino' && (
                      <button className="btn btn-sm btn-success" onClick={() => advanceState(d)}>
                        <CheckCircle2 size={15} />
                        <span>Entregar</span>
                      </button>
                    )}
                    {(d.estado_delivery === 'pendiente' || d.estado_delivery === 'en_camino') && (
                      <button className="btn btn-sm btn-ghost-danger" onClick={() => cancelDelivery(d)}>
                        <X size={15} />
                        <span>Cancelar</span>
                      </button>
                    )}
                    <button className="btn btn-sm btn-ghost" onClick={() => viewDetail(d)}>
                      <Eye size={15} />
                      <span>Ver</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showCreateModal && (
        <SaleCreateModal
          onClose={() => setShowCreateModal(false)}
          products={products}
          customers={customers}
          onCreateSale={handleCreateDelivery}
          deliveryMode
        />
      )}
      {detailSale && (
        <SaleDetailModal sale={detailSale} onClose={() => setDetailSale(null)} />
      )}
    </div>
  );
}
