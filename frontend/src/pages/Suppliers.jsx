import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useBusinessConfig } from '../context/BusinessConfig';
import { useToast } from '../components/Toast';
import Skeleton from '../components/Skeleton';
import Pagination from '../components/Pagination';
import { Plus, Search, Edit, Trash, Truck, X, Mail, Phone, MapPin, User, FileDown, FileText, Dollar, Package, Clock } from '../components/Icons';
import ConfirmDialog from '../components/ConfirmDialog';
import { exportSuppliersCSV, exportSuppliersPDF } from '../utils/export';
import DateRangeFilter from '../components/DateRangeFilter';
import SupplierFormModal from '../components/suppliers/SupplierFormModal';

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
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [dateFilter, setDateFilter] = useState({ startDate: '', endDate: '' });
  const navigate = useNavigate();

  const buildParams = () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (dateFilter.startDate) params.set('startDate', dateFilter.startDate);
    if (dateFilter.endDate) params.set('endDate', dateFilter.endDate);
    params.set('page', page.toString());
    return params.toString() ? `?${params.toString()}` : '';
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

  const openCreate = () => { setEditing(null); setShowModal(true); };
  const openEdit = (supplier) => { setEditing(supplier); setShowModal(true); };

  const handleSave = async (form) => {
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
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await api.deleteSupplier(confirmDelete.id);
      toast.success('Proveedor eliminado correctamente');
      setConfirmDelete(null);
      loadSuppliers();
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (loading && suppliers.length === 0) {
    return <div className="page-container"><Skeleton.CardGrid count={6} /></div>;
  }

  return (
    <div className="page-container">
      <div className="toolbar">
        <div className="search-box">
          <Search size={18} />
          <input type="text" placeholder={`Buscar ${t('supplier_plural').toLowerCase()}...`}
            value={search} onChange={(e) => setSearch(e.target.value)} />
          {search && <button className="clear-btn" onClick={() => setSearch('')}><X size={16} /></button>}
        </div>
        <div className="toolbar-filters">
          <DateRangeFilter onFilter={(f) => setDateFilter(f)} />
          <div className="export-buttons">
            <button className="btn btn-export" onClick={() => exportSuppliersCSV(suppliers)}
              disabled={suppliers.length === 0}>CSV</button>
            <button className="btn btn-export pdf" onClick={() => exportSuppliersPDF(suppliers)}
              disabled={suppliers.length === 0}>PDF</button>
          </div>
          <button className="btn btn-primary" onClick={openCreate}>
            <Plus size={18} /> Nuevo {t('supplier')}
          </button>
        </div>
      </div>

      <div className="suppliers-grid">
        {suppliers.map((supplier) => (
          <div key={supplier.id} className="supplier-card">
            <div className="supplier-card-header">
              <div className="supplier-icon"><Truck size={24} /></div>
              <div className="supplier-card-actions">
                <button className="btn-icon" onClick={() => openEdit(supplier)} title="Editar"><Edit size={14} /></button>
                <button className="btn-icon danger" onClick={() => setConfirmDelete(supplier)} title="Eliminar"><Trash size={14} /></button>
              </div>
            </div>
            <h3 className="supplier-name">{supplier.nombre}</h3>
            {supplier.contacto && <div className="supplier-contact"><User size={14} /><span>{supplier.contacto}</span></div>}
            <div className="supplier-details">
              {supplier.email && <span className="supplier-detail"><Mail size={14} />{supplier.email}</span>}
              {supplier.telefono && <span className="supplier-detail"><Phone size={14} />{supplier.telefono}</span>}
              {supplier.direccion && <span className="supplier-detail"><MapPin size={14} />{supplier.direccion}</span>}
            </div>
            <div className="supplier-stats" onClick={() => navigate(`/purchases?supplier_id=${supplier.id}&supplier_name=${encodeURIComponent(supplier.nombre)}`)}
              title="Ver compras de este proveedor">
              <div className="supplier-stat">
                <Dollar size={14} />
                <div className="supplier-stat-info">
                  <span className="supplier-stat-label">Total Invertido</span>
                  <span className="supplier-stat-value">{new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(supplier.total_invertido)}</span>
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
                      ? new Date(supplier.ultima_compra).toLocaleDateString('es-PE', { year: 'numeric', month: 'short', day: 'numeric' })
                      : 'Sin compras'}
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
            <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Nuevo {t('supplier')}</button>
          </div>
        )}
      </div>

      <Pagination pagination={pagination} onPageChange={setPage} />

      {showModal && (
        <SupplierFormModal editing={editing} onSave={handleSave}
          onClose={() => setShowModal(false)} t={t} />
      )}

      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Eliminar Proveedor"
        message={`¿Estás seguro de eliminar a "${confirmDelete?.nombre}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        onConfirm={handleDelete}
        onClose={() => setConfirmDelete(null)}
      />
    </div>
  );
}
