import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useBusinessConfig } from '../context/BusinessConfig';
import { useToast } from '../components/Toast';
import Skeleton from '../components/Skeleton';
import Pagination from '../components/Pagination';
import { Plus, Search, Edit, Trash, Users, X, Mail, Phone, MapPin, Star } from '../components/Icons';

export default function Customers() {
  const { t } = useBusinessConfig();
  const toast = useToast();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    telefono: '',
    direccion: '',
    tipo_documento: 'DNI',
    num_documento: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadCustomers(); }, [page]);
  useEffect(() => {
    setPage(1);
    const timeout = setTimeout(loadCustomers, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const loadCustomers = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      params.set('page', page.toString());
      const result = await api.getCustomers(`?${params.toString()}`);
      setCustomers(result.data || []);
      setPagination(result.pagination);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ nombre: '', email: '', telefono: '', direccion: '', tipo_documento: 'DNI', num_documento: '' });
    setShowModal(true);
  };

  const openEdit = (customer) => {
    setEditing(customer);
    setForm({
      nombre: customer.nombre || '',
      email: customer.email || '',
      telefono: customer.telefono || '',
      direccion: customer.direccion || '',
      tipo_documento: customer.tipo_documento || 'DNI',
      num_documento: customer.num_documento || '',
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.updateCustomer(editing.id, form);
        toast.success('Cliente actualizado correctamente');
      } else {
        await api.createCustomer(form);
        toast.success('Cliente registrado correctamente');
      }
      setShowModal(false);
      loadCustomers();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (customer) => {
    if (!confirm(`¿Eliminar ${t('customer').toLowerCase()} "${customer.nombre}"?`)) return;
    try {
      await api.deleteCustomer(customer.id);
      toast.success('Cliente eliminado correctamente');
      loadCustomers();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const formatCurrency = (v) =>
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(v);

  if (loading && customers.length === 0) {
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
            placeholder={`Buscar ${t('customer_plural').toLowerCase()}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="clear-btn" onClick={() => setSearch('')}>
              <X size={16} />
            </button>
          )}
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={18} />
          <span>Nuevo {t('customer')}</span>
        </button>
      </div>

      <div className="customers-grid">
        {customers.map((customer) => (
          <div key={customer.id} className="customer-card">
            <div className="customer-card-header">
              <div className="customer-avatar-lg">
                {customer.nombre.charAt(0).toUpperCase()}
              </div>
              <div className="customer-card-actions">
                <button className="btn-icon" onClick={() => openEdit(customer)} title="Editar">
                  <Edit size={14} />
                </button>
                <button
                  className="btn-icon danger"
                  onClick={() => handleDelete(customer)}
                  title="Eliminar"
                >
                  <Trash size={14} />
                </button>
              </div>
            </div>
            <h3 className="customer-name">{customer.nombre}</h3>
            <div className="customer-details">
              {customer.email && (
                <span className="customer-detail">
                  <Mail size={14} />
                  {customer.email}
                </span>
              )}
              {customer.telefono && (
                <span className="customer-detail">
                  <Phone size={14} />
                  {customer.telefono}
                </span>
              )}
              {customer.direccion && (
                <span className="customer-detail">
                  <MapPin size={14} />
                  {customer.direccion}
                </span>
              )}
            </div>
            <div className="customer-stats">
              <div className="customer-stat">
                <span className="stat-label">{t('purchase_plural')}</span>
                <span className="stat-value">{customer.total_compras}</span>
              </div>
              <div className="customer-stat">
                <span className="stat-label">Total gastado</span>
                <span className="stat-value">{formatCurrency(customer.total_gastado)}</span>
              </div>
              <div className="customer-stat points-stat">
                <span className="stat-label">
                  <Star size={12} /> Puntos
                </span>
                <span className="stat-value">{customer.puntos || 0}</span>
              </div>
            </div>
          </div>
        ))}

        {customers.length === 0 && (
          <div className="empty-state full-width">
            <Users size={48} />
            <h3>No hay {t('customer_plural').toLowerCase()}</h3>
            <p>Registra tu primer {t('customer').toLowerCase()}</p>
            <button className="btn btn-primary" onClick={openCreate}>
              <Plus size={16} /> Nuevo {t('customer')}
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
              <h2>{editing ? `Editar ${t('customer')}` : `Nuevo ${t('customer')}`}</h2>
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
                      placeholder="Nombre completo"
                      autoFocus
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="correo@ejemplo.com"
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Teléfono</label>
                    <input
                      type="text"
                      value={form.telefono}
                      onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                      placeholder="555-0000"
                    />
                  </div>
                  <div className="form-group">
                    <label>Tipo Documento</label>
                    <select
                      value={form.tipo_documento}
                      onChange={(e) => setForm({ ...form, tipo_documento: e.target.value })}
                    >
                      <option value="DNI">DNI</option>
                      <option value="RUC">RUC</option>
                      <option value="Pasaporte">Pasaporte</option>
                    </select>
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
                  {saving ? 'Guardando...' : editing ? 'Actualizar' : `Crear ${t('customer')}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
