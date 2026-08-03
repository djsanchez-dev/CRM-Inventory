import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from '../api/client';
import {
  Plus, Search, X, Trash, FileDown, FileText,
  Car, Wrench, Droplets, CalendarDays, Trending,
  Bike, Tractor, BusFront, Van,
} from '../components/Icons';
import ConfirmDialog from '../components/ConfirmDialog';
import { useBusinessConfig } from '../context/BusinessConfig';
import { useToast } from '../components/Toast';
import Skeleton from '../components/Skeleton';
import Pagination from '../components/Pagination';
import ServiceFormModal from '../components/services/ServiceFormModal';
import { exportServicesCSV, exportServicesPDF } from '../utils/export';

const TYPE_LABELS = {
  carwash: { label: 'Car Wash', icon: Droplets, color: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.12)' },
  mecanica: { label: 'Mecánica', icon: Wrench, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
};

// Vehicle type metadata (fallback if business config has no vehicleTypes)
const DEFAULT_VEHICLES = [
  { id: 'moto', label: 'Moto', icon: Bike, color: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.12)' },
  { id: 'mototaxi', label: 'Mototaxi', icon: Bike, color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.12)' },
  { id: 'auto', label: 'Auto', icon: Car, color: '#6366f1', bg: 'rgba(99, 102, 241, 0.12)' },
  { id: 'cuatrimoto', label: 'Cuatrimoto', icon: Van, color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' },
  { id: 'combi', label: 'Combi', icon: BusFront, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
  { id: 'tractor', label: 'Tractor', icon: Tractor, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)' },
  { id: 'otro', label: 'Otro', icon: Wrench, color: '#64748b', bg: 'rgba(100, 116, 139, 0.12)' },
];

export default function Services() {
  const { tipo, vehicleTypes = [], loading: configLoading } = useBusinessConfig();
  const toast = useToast();
  const [services, setServices] = useState([]);
  const [summary, setSummary] = useState({ carwash: { total: 0, ingreso: 0 }, mecanica: { total: 0, ingreso: 0 }, total_servicios: 0, ingreso_total: 0, porVehiculo: [] });
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [tipoFilter, setTipoFilter] = useState('');
  const [vehiculoFilter, setVehiculoFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const vehicles = vehicleTypes.length > 0
    ? vehicleTypes.map((v) => {
        const meta = DEFAULT_VEHICLES.find((d) => d.id === v.id) || {};
        return { ...v, icon: meta.icon || Car, color: meta.color || '#64748b', bg: meta.bg || 'rgba(100, 116, 139, 0.12)' };
      })
    : DEFAULT_VEHICLES;

  const vehicleMeta = (id) => vehicles.find((v) => v.id === id);

  const buildParams = (pg) => {
    const params = new URLSearchParams();
    if (selectedDate) params.set('date', selectedDate);
    if (tipoFilter) params.set('tipo', tipoFilter);
    if (vehiculoFilter) params.set('vehiculo', vehiculoFilter);
    if (search) params.set('search', search);
    params.set('page', (pg || page).toString());
    return params.toString() ? `?${params.toString()}` : '';
  };

  const loadSummary = async () => {
    try {
      const s = await api.getServicesSummary(`?date=${selectedDate}`);
      setSummary(s);
    } catch (error) {
      console.error('Error loading services summary:', error);
    }
  };

  const loadServices = async (pageOverride) => {
    setLoading(true);
    try {
      const result = await api.getServices(buildParams(pageOverride));
      setServices(result.data || []);
      setPagination(result.pagination);
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [selectedDate, tipoFilter, vehiculoFilter]);

  // Debounce search to avoid hammering the API per keystroke
  useEffect(() => {
    setPage(1);
    const timeout = setTimeout(() => loadServices(1), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    loadServices();
    loadSummary();
  }, [selectedDate, tipoFilter, vehiculoFilter, page]);

  const shiftDay = (delta) => {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() + delta);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleSave = async (data) => {
    try {
      await api.createService(data);
      toast.success('Servicio registrado correctamente');
      loadServices();
      loadSummary();
    } catch (error) {
      toast.error(error.message);
      throw error;
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await api.deleteService(confirmDelete.id);
      toast.success('Servicio eliminado');
      setConfirmDelete(null);
      loadServices();
      loadSummary();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const openCreateModal = async () => {
    try {
      const customersData = await api.getCustomers();
      setCustomers(customersData.data || []);
      setShowModal(true);
    } catch (error) {
      toast.error('Error al cargar datos: ' + error.message);
    }
  };

  const formatCurrency = (v) =>
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(v);

  const formatTime = (date) =>
    new Date(date).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

  const formatDateLong = (date) =>
    new Date(date + 'T12:00:00').toLocaleDateString('es-PE', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  // The Services module (Car Wash / Mecánica) is exclusive to carwash-type businesses.
  // Wait for the business config to load before redirecting, otherwise a fresh page load
  // would see tipo='general' (default) and bounce carwash users away from this page.
  if (configLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Cargando...</p>
      </div>
    );
  }
  if (tipo !== 'carwash') {
    return <Navigate to="/app" replace />;
  }

  // Vehicles washed today (only carwash services with a vehicle type)
  const vehicleStats = summary.porVehiculo || [];

  if (loading && services.length === 0) {
    return (
      <div className="page-container">
        <Skeleton.Stats count={4} />
        <Skeleton.Table rows={4} columns={6} />
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Daily Control Header */}
      <div className="daily-control-header">
        <div className="daily-nav">
          <button className="btn btn-secondary btn-sm" onClick={() => shiftDay(-1)} aria-label="Día anterior">
            ‹
          </button>
          <div className="daily-date">
            <CalendarDays size={18} />
            <div>
              <span className="daily-date-label">{formatDateLong(selectedDate)}</span>
              {isToday && <span className="daily-today-badge">HOY</span>}
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => shiftDay(1)} aria-label="Día siguiente">
            ›
          </button>
        </div>
        <div className="daily-actions">
          <button className="btn btn-secondary btn-sm" onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}>
            Volver a Hoy
          </button>
          <button className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={18} />
            <span>Registrar Servicio</span>
          </button>
        </div>
      </div>

      {/* Daily Summary Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9' }}>
            <Droplets size={26} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Carros Lavados</span>
            <span className="stat-value">{summary.carwash.total}</span>
            <span className="stat-sub">{formatCurrency(summary.carwash.ingreso)}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
            <Wrench size={26} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Servicios Mecánicos</span>
            <span className="stat-value">{summary.mecanica.total}</span>
            <span className="stat-sub">{formatCurrency(summary.mecanica.ingreso)}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
            <Car size={26} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Servicios del Día</span>
            <span className="stat-value">{summary.total_servicios}</span>
            <span className="stat-sub">carwash + mecánica</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <Trending size={26} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Ingreso del Día</span>
            <span className="stat-value">{formatCurrency(summary.ingreso_total)}</span>
            <span className="stat-sub">{summary.total_servicios} servicio(s)</span>
          </div>
        </div>
      </div>

      {/* Vehicles washed today — breakdown by vehicle type */}
      {vehicleStats.length > 0 && (
        <div className="vehicle-stats-panel">
          <div className="vehicle-stats-header">
            <Car size={16} />
            <span>Vehículos lavados hoy</span>
            <span className="vehicle-stats-total">
              {vehicleStats.reduce((s, v) => s + v.total, 0)} unidad(es)
            </span>
          </div>
          <div className="vehicle-stats-grid">
            {vehicles
              .filter((v) => vehicleStats.some((s) => s.tipo_vehiculo === v.id))
              .map((v) => {
                const stat = vehicleStats.find((s) => s.tipo_vehiculo === v.id);
                const VIcon = v.icon || Car;
                return (
                  <div
                    key={v.id}
                    className="vehicle-stat-chip"
                    style={{ borderColor: v.color, background: v.bg }}
                    onClick={() => setVehiculoFilter(vehiculoFilter === v.id ? '' : v.id)}
                    title="Click para filtrar"
                  >
                    <VIcon size={16} style={{ color: v.color }} />
                    <div className="vehicle-stat-info">
                      <span className="vehicle-stat-label">{v.label}</span>
                      <span className="vehicle-stat-value" style={{ color: v.color }}>
                        {stat.total} <small>· {formatCurrency(stat.ingreso)}</small>
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="toolbar" style={{ marginTop: 20 }}>
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar por servicio, placa o cliente..."
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
            <button className={`service-filter-btn ${tipoFilter === '' ? 'active' : ''}`} onClick={() => setTipoFilter('')}>
              Todos
            </button>
            <button className={`service-filter-btn ${tipoFilter === 'carwash' ? 'active' : ''}`} onClick={() => setTipoFilter('carwash')}>
              <Droplets size={14} /> Car Wash
            </button>
            <button className={`service-filter-btn ${tipoFilter === 'mecanica' ? 'active' : ''}`} onClick={() => setTipoFilter('mecanica')}>
              <Wrench size={14} /> Mecánica
            </button>
          </div>

          <div className="service-type-filter vehicle-filter">
            <select
              className="vehicle-filter-select"
              value={vehiculoFilter}
              onChange={(e) => setVehiculoFilter(e.target.value)}
              aria-label="Filtrar por tipo de vehículo"
            >
              <option value="">Todos los vehículos</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.label}</option>
              ))}
            </select>
          </div>

          <div className="export-buttons">
            <button
              className="btn btn-export"
              onClick={() => exportServicesCSV(services)}
              disabled={services.length === 0}
              title="Exportar a CSV"
            >
              <FileDown size={18} />
              <span>CSV</span>
            </button>
            <button
              className="btn btn-export pdf"
              onClick={() => exportServicesPDF(services, selectedDate)}
              disabled={services.length === 0}
              title="Exportar a PDF"
            >
              <FileText size={18} />
              <span>PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Hora</th>
              <th>Tipo</th>
              <th>Servicio</th>
              <th>Vehículo</th>
              <th>Placa</th>
              <th>Cliente</th>
              <th>Precio</th>
              <th>Notas</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {services.map((svc) => {
              const typeMeta = TYPE_LABELS[svc.tipo] || TYPE_LABELS.carwash;
              const TypeIcon = typeMeta.icon;
              return (
                <tr key={svc.id}>
                  <td><span className="sale-id">#{svc.id}</span></td>
                  <td>{formatTime(svc.created_at)}</td>
                  <td>
                    <span className="badge" style={{ background: typeMeta.bg, color: typeMeta.color }}>
                      <TypeIcon size={12} style={{ marginRight: 4 }} />
                      {typeMeta.label}
                    </span>
                  </td>
                  <td>
                    <div className="product-name-cell">
                      <div className="product-icon" style={{ background: typeMeta.bg, color: typeMeta.color }}>
                        <TypeIcon size={16} />
                      </div>
                      <span className="product-name">{svc.nombre}</span>
                    </div>
                  </td>
                  <td>
                    {svc.tipo_vehiculo ? (() => {
                      const vMeta = vehicleMeta(svc.tipo_vehiculo);
                      const VIcon = vMeta?.icon || Car;
                      return (
                        <span className="badge" style={{ background: vMeta?.bg, color: vMeta?.color }}>
                          <VIcon size={12} style={{ marginRight: 4 }} />
                          {vMeta?.label || svc.tipo_vehiculo}
                        </span>
                      );
                    })() : <span className="text-muted">—</span>}
                  </td>
                  <td>{svc.placa ? <code>{svc.placa}</code> : <span className="text-muted">—</span>}</td>
                  <td>{svc.customer_name || <span className="text-muted">—</span>}</td>
                  <td className="currency">{formatCurrency(svc.precio)}</td>
                  <td className="text-muted">{svc.notas || '—'}</td>
                  <td>
                    <div className="actions">
                      <button
                        className="btn-icon danger"
                        onClick={() => setConfirmDelete(svc)}
                        title="Eliminar"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {services.length === 0 && (
              <tr>
                <td colSpan={10} className="empty-cell">
                  <div className="empty-state">
                    <Droplets size={48} />
                    <h3>No hay servicios para este día</h3>
                    <p>Registra el primer servicio del día o cambia la fecha</p>
                    <button className="btn btn-primary" onClick={openCreateModal}>
                      <Plus size={16} /> Registrar Servicio
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination pagination={pagination} onPageChange={setPage} />

      {showModal && (
        <ServiceFormModal
          onClose={() => setShowModal(false)}
          onSave={handleSave}
          customers={customers}
        />
      )}

      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Eliminar Servicio"
        message={`¿Estás seguro de eliminar el servicio "${confirmDelete?.nombre}" de ${confirmDelete?.placa || 'este vehículo'}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        variant="danger"
        onConfirm={handleDelete}
        onClose={() => setConfirmDelete(null)}
      />
    </div>
  );
}
