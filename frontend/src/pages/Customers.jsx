import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useBusinessConfig } from '../context/BusinessConfig';
import { useToast } from '../components/Toast';
import Skeleton from '../components/Skeleton';
import Pagination from '../components/Pagination';
import { Plus, Search, Edit, Trash, Users, X, Mail, Phone, MapPin, Star } from '../components/Icons';
import ConfirmDialog from '../components/ConfirmDialog';
import CustomerFormModal from '../components/customers/CustomerFormModal';

export default function Customers() {
  const { t } = useBusinessConfig();
  const toast = useToast();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [hasPoints, setHasPoints] = useState(false);
  const [sortBy, setSortBy] = useState('nombre');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => { loadCustomers(); }, [page]);
  useEffect(() => {
    setPage(1);
    const timeout = setTimeout(() => loadCustomers(1), 300);
    return () => clearTimeout(timeout);
  }, [search, hasPoints, sortBy]);

  const loadCustomers = async (pageOverride) => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (hasPoints) params.set('has_points', 'true');
      if (sortBy !== 'nombre') params.set('sort', sortBy);
      params.set('page', (pageOverride || page).toString());
      const result = await api.getCustomers(`?${params.toString()}`);
      setCustomers(result.data || []);
      setPagination(result.pagination);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setHasPoints(false);
    setSortBy('nombre');
    setPage(1);
  };

  const activeFilterCount = [search, hasPoints, sortBy !== 'nombre'].filter(Boolean).length;

  const openCreate = () => { setEditing(null); setShowModal(true); };
  const openEdit = (customer) => { setEditing(customer); setShowModal(true); };

  const handleSave = async (form) => {
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
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await api.deleteCustomer(confirmDelete.id);
      toast.success('Cliente eliminado correctamente');
      setConfirmDelete(null);
      loadCustomers();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const formatCurrency = (v) =>
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(v);

  if (loading && customers.length === 0) {
    return <div className="page-container"><Skeleton.CardGrid count={6} /></div>;
  }

  return (
    <div className="page-container">
      <div className="toolbar">
        <div className="search-box">
          <Search size={18} />
          <input type="text" placeholder={`Buscar ${t('customer_plural').toLowerCase()}...`}
            value={search} onChange={(e) => setSearch(e.target.value)} />
          {search && <button className="clear-btn" onClick={() => setSearch('')}><X size={16} /></button>}
        </div>
        <div className="toolbar-filters">
          <label className="filter-checkbox">
            <input type="checkbox" checked={hasPoints} onChange={(e) => setHasPoints(e.target.checked)} />
            Con puntos
          </label>
          <select className="filter-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)} title="Ordenar clientes">
            <option value="nombre">Nombre (A–Z)</option>
            <option value="gasto">Mayor gasto</option>
            <option value="compras">Más compras</option>
            <option value="puntos">Más puntos</option>
          </select>
          {activeFilterCount > 0 && (
            <button className="clear-btn btn-clear-filters" onClick={clearFilters} title="Limpiar todos los filtros">
              <X size={14} /> Limpiar ({activeFilterCount})
            </button>
          )}
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={18} /> Nuevo {t('customer')}
        </button>
      </div>

      <div className="customers-grid">
        {customers.map((customer) => (
          <div key={customer.id} className="customer-card">
            <div className="customer-card-header">
              <div className="customer-avatar-lg">{customer.nombre.charAt(0).toUpperCase()}</div>
              <div className="customer-card-actions">
                <button className="btn-icon" onClick={() => openEdit(customer)} title="Editar"><Edit size={14} /></button>
                <button className="btn-icon danger" onClick={() => setConfirmDelete(customer)} title="Eliminar"><Trash size={14} /></button>
              </div>
            </div>
            <h3 className="customer-name">{customer.nombre}</h3>
            <div className="customer-details">
              {customer.email && <span className="customer-detail"><Mail size={14} />{customer.email}</span>}
              {customer.telefono && <span className="customer-detail"><Phone size={14} />{customer.telefono}</span>}
              {customer.direccion && <span className="customer-detail"><MapPin size={14} />{customer.direccion}</span>}
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
                <span className="stat-label"><Star size={12} /> Puntos</span>
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

      {showModal && (
        <CustomerFormModal editing={editing} onSave={handleSave}
          onClose={() => setShowModal(false)} t={t} />
      )}

      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Eliminar Cliente"
        message={`¿Estás seguro de eliminar a "${confirmDelete?.nombre}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        onConfirm={handleDelete}
        onClose={() => setConfirmDelete(null)}
      />
    </div>
  );
}
