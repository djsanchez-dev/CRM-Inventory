import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useBusinessConfig } from '../context/BusinessConfig';
import { useToast } from '../components/Toast';
import Skeleton from '../components/Skeleton';
import Pagination from '../components/Pagination';
import { Plus, Search, Edit, Trash, Truck, X, Mail, Phone, MapPin, User, FileDown, FileText, Dollar, Package, Clock } from '../components/Icons';
import { exportSuppliersCSV, exportSuppliersPDF } from '../utils/export';
import DateRangeFilter from '../components/DateRangeFilter';

export default function Suppliers() {
  const { t } = useBusinessConfig();
  const toast = useToast();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    nombre: '',
    contacto: '',
    email: '',
    telefono: '',
    direccion: '',
  });
  const [saving, setSaving] = useState(false);
  const [dateFilter, setDateFilter] = useState({ startDate: '', endDate: '' });
  const navigate = useNavigate();

  const buildParams = () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (dateFilter.startDate) params.set('startDate', dateFilter.startDate);
    if (dateFilter.endDate) params.set('endDate', dateFilter.endDate);
    params.set('page', page.toString());
    const qs = params.toString();
    return qs ? `?${qs}` : '';
  };

  useEffect(() => { loadSuppliers(); }, [dateFilter, page]);
  useEffect(() => {
    setPage(1);
    const timeout = setTimeout(loadSuppliers, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const loadSuppliers = async () => {
    try {
      const result = await api.getSuppliers(buildParams());
      setSuppliers(result.data || []);
      setPagination(result.pagination);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ nombre: '', contacto: '', email: '', telefono: '', direccion: '' });
    setShowModal(true);
  };

  const openEdit = (supplier) => {
    setEditing(supplier);
    setForm({
      nombre: supplier.nombre || '',
      contacto: supplier.contacto || '',
      email: supplier.email || '',
      telefono: supplier.telefono || '',
      direccion: supplier.direccion || '',
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.updateSupplier(editing.id, form);
        toast.success('Proveedor actualizado correctamente');
      } else {
        await api.createSupplier(form);
        toast.success('Proveedor registrado correctamente');
      }
      setShowModal(false);
      loadSuppliers();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (supplier) => {
    if (!confirm(`¿Eliminar a "${supplier.nombre}"?`)) return;
    try {
      await api.deleteSupplier(supplier.id);
      toast.success('Proveedor eliminado correctamente');
      loadSuppliers();
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (loading && suppliers.length === 0) {
    return (
      <div className="page-container">
        <Skeleton.CardGrid count={6} />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder={`Buscar ${t('supplier_plural').toLowerCase()}...`}
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
          <DateRangeFilter onFilter={(f) => setDateFilter(f)} />

          <div className="export-buttons">
            <button
              className="btn btn-export"
              onClick={() => exportSuppliersCSV(suppliers)}
              disabled={suppliers.length === 0}
              title={suppliers.length === 0 ? 'No hay datos para exportar' : 'Exportar a CSV'}
            >
              <FileDown size={18} />
              <span>CSV</span>
            </button>
            <button
              className="btn btn-export pdf"
              onClick={() => exportSuppliersPDF(suppliers)}
              disabled={suppliers.length === 0}
              title={suppliers.length === 0 ? 'No hay datos para exportar' : 'Exportar a PDF'}
            >
              <FileText size={18} />
              <span>PDF</span>
            </button>
          </div>

          <button className="btn btn-primary" onClick={openCreate}>
            <Plus size={18} />
            <span>Nuevo {t('supplier')}</span>
          </button>
        </div>
      </div>

      <div className="suppliers-grid">
        {suppliers.map((supplier) => (
          <div key={supplier.id} className="supplier-card">
            <div className="supplier-card-header">
              <div className="supplier-icon">
                <Truck size={24} />
              </div>
              <div className="supplier-card-actions">
                <button className="btn-icon" onClick={() => openEdit(supplier)} title="Editar">
                  <Edit size={14} />
                </button>
                <button
                  className="btn-icon danger"
                  onClick={() => handleDelete(supplier)}
                  title="Eliminar"
                >
                  <Trash size={14} />
                </button>
              </div>
            </div>
            <h3 className="supplier-name">{supplier.nombre}</h3>
            {supplier.contacto && (
              <div className="supplier-contact">
                <User size={14} />
                <span>{supplier.contacto}</span>
              </div>
            )}
            <div className="supplier-details">
              {supplier.email && (
                <span className="supplier-detail">
                  <Mail size={14} />
                  {supplier.email}
                </span>
              )}
              {supplier.telefono && (
                <span className="supplier-detail">
                  <Phone size={14} />
                  {supplier.telefono}
                </span>
              )}
              {supplier.direccion && (
                <span className="supplier-detail">
                  <MapPin size={14} />
                  {supplier.direccion}
                </span>
              )}
            </div>

            {/* Purchase Stats (clickable) */}
            <div
              className="supplier-stats"
              onClick={() => navigate(`/purchases?supplier_id=${supplier.id}&supplier_name=${encodeURIComponent(supplier.nombre)}`)}
              title="Ver compras de este proveedor"
            >
              <div className="supplier-stat">
                <Dollar size={14} />
                <div className="supplier-stat-info">
                  <span className="supplier-stat-label">Total Invertido</span>
                  <span className="supplier-stat-value">
                    {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(supplier.total_invertido)}
                  </span>
                </div>
              </div>
              <div className="supplier-stat">
                <Package size={14} />
                <div className="supplier-stat-info">
                  <span className="supplier-stat-label">Productos Comprados</span>
                  <span className="supplier-stat-value">{supplier.total_productos} uds</span>
                </div>
              </div>
              <div className="supplier-stat">
                <Clock size={14} />
                <div className="supplier-stat-info">
                  <span className="supplier-stat-label">Última Compra</span>
                  <span className="supplier-stat-value">
                    {supplier.ultima_compra
                      ? new Date(supplier.ultima_compra).toLocaleDateString('es-PE', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                      : 'Sin compras'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {suppliers.length === 0 && (
          <div className="empty-state full-width">
            <Truck size={48} />
            <h3>No hay {t('supplier_plural').toLowerCase()}</h3>
            <p>Registra tu primer {t('supplier').toLowerCase()}</p>
            <button className="btn btn-primary" onClick={openCreate}>
              <Plus size={16} /> Nuevo {t('supplier')}
            </button>
          </div>
        )}
      </div>

      <Pagination pagination={pagination} onPageChange={setPage} />

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? `Editar ${t('supplier')}` : `Nuevo ${t('supplier')}`}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Nombre *</label>
                    <input
                      type="text"
                      required
                      value={form.nombre}
                      onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                      placeholder="Nombre del proveedor"
                      autoFocus
                    />
                  </div>
                  <div className="form-group">
                    <label>Contacto</label>
                    <input
                      type="text"
                      value={form.contacto}
                      onChange={(e) => setForm({ ...form, contacto: e.target.value })}
                      placeholder="Persona de contacto"
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="correo@ejemplo.com"
                    />
                  </div>
                  <div className="form-group">
                    <label>Teléfono</label>
                    <input
                      type="text"
                      value={form.telefono}
                      onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                      placeholder="555-0000"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Dirección</label>
                  <textarea
                    value={form.direccion}
                    onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                    placeholder="Dirección completa"
                    rows={2}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : editing ? 'Actualizar' : `Crear ${t('supplier')}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
