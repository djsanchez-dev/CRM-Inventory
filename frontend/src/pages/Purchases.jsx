import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { Plus, X, Trash, Package, Truck, Dollar, Trending, FileDown, FileText, Search } from '../components/Icons';
import Pagination from '../components/Pagination';
import ConfirmDialog from '../components/ConfirmDialog';
import { useBusinessConfig } from '../context/BusinessConfig';
import { useToast } from '../components/Toast';
import Skeleton from '../components/Skeleton';
import { exportPurchasesCSV, exportPurchasesPDF } from '../utils/export';
import DateRangeFilter from '../components/DateRangeFilter';
import PurchaseFormModal from '../components/purchases/PurchaseFormModal';

export default function Purchases() {
  const { t } = useBusinessConfig();
  const toast = useToast();
  const [purchases, setPurchases] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState({ startDate: '', endDate: '' });
  const [supplierFilter, setSupplierFilter] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [totals, setTotals] = useState({ cantidad: 0, total: 0, proveedores: 0 });
  const [showModal, setShowModal] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [confirmDelete, setConfirmDelete] = useState(null);

  const buildParams = (pg) => {
    const params = new URLSearchParams();
    if (dateFilter.startDate) params.set('startDate', dateFilter.startDate);
    if (dateFilter.endDate) params.set('endDate', dateFilter.endDate);
    if (supplierFilter) params.set('supplier_id', supplierFilter.id);
    if (search) params.set('search', search);
    params.set('page', (pg || page).toString());
    return params.toString() ? `?${params.toString()}` : '';
  };

  const loadPurchases = async (pageOverride) => {
    setLoading(true);
    try {
      const result = await api.getPurchases(buildParams(pageOverride));
      setPurchases(result.data || []);
      setPagination(result.pagination);
      setTotals(result.totals || { cantidad: 0, total: 0, proveedores: 0 });
    } catch (error) {
      console.error('Error loading purchases:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load supplier list for the filter dropdown
  useEffect(() => {
    api.getSuppliers('?limit=500').then((res) => {
      setSuppliers(res.data || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const sid = searchParams.get('supplier_id');
    const sname = searchParams.get('supplier_name');
    if (sid) setSupplierFilter({ id: sid, nombre: sname || `Proveedor #${sid}` });
  }, []);

  useEffect(() => {
    setPage(1);
    const timeout = setTimeout(() => loadPurchases(1), 300);
    return () => clearTimeout(timeout);
  }, [dateFilter, supplierFilter, search]);

  useEffect(() => {
    loadPurchases();
  }, [page]);

  const clearFilters = () => {
    setDateFilter({ startDate: '', endDate: '' });
    setSupplierFilter(null);
    setSearch('');
    setSearchParams({});
    setPage(1);
  };

  const activeFilterCount = [
    dateFilter.startDate, dateFilter.endDate, supplierFilter, search,
  ].filter(Boolean).length;

  const clearSupplierFilter = () => {
    setSupplierFilter(null);
    setSearchParams({});
  };

  const openCreateModal = async () => {
    try {
      const [productsData, suppliersData] = await Promise.all([
        api.getProducts(),
        api.getSuppliers(),
      ]);
      setProducts(productsData.data || []);
      setSuppliers(suppliersData.data || []);
      setShowModal(true);
    } catch (error) {
      toast.error('Error al cargar datos: ' + error.message);
    }
  };

  const handleSave = async (data) => {
    try {
      await api.createPurchase(data);
      setShowModal(false);
      toast.success('Compra registrada correctamente');
      loadPurchases();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await api.deletePurchase(confirmDelete.id);
      toast.success('Compra eliminada y stock revertido');
      setConfirmDelete(null);
      loadPurchases();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const formatCurrency = (v) =>
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(v);

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('es-PE', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });

  if (loading && purchases.length === 0) {
    return <div className="page-container"><Skeleton.FinCards count={3} /><Skeleton.Table rows={4} columns={8} /></div>;
  }

  return (
    <div className="page-container">
      <div className="toolbar">
        <div className="search-box">
          <Search size={18} />
          <input type="text" placeholder="Buscar por producto, SKU o proveedor..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
          {search && <button className="clear-btn" onClick={() => setSearch('')}><X size={16} /></button>}
        </div>
        <div className="toolbar-filters">
          <DateRangeFilter onFilter={(f) => setDateFilter(f)} />
          <select className="filter-select" value={supplierFilter?.id || ''}
            onChange={(e) => {
              const sid = e.target.value;
              if (sid) {
                const sup = suppliers.find((s) => String(s.id) === sid);
                setSupplierFilter({ id: sid, nombre: sup?.nombre || `Proveedor #${sid}` });
              } else {
                clearSupplierFilter();
              }
            }}>
            <option value="">Todos los proveedores</option>
            {suppliers.map((s) => (<option key={s.id} value={s.id}>{s.nombre}</option>))}
          </select>
          {activeFilterCount > 0 && (
            <button className="clear-btn btn-clear-filters" onClick={clearFilters} title="Limpiar todos los filtros">
              <X size={14} /> Limpiar ({activeFilterCount})
            </button>
          )}
          <div className="export-buttons">
            <button className="btn btn-export" onClick={() => exportPurchasesCSV(purchases)}
              disabled={purchases.length === 0}>CSV</button>
            <button className="btn btn-export pdf" onClick={() => exportPurchasesPDF(purchases)}
              disabled={purchases.length === 0}>PDF</button>
          </div>
          <button className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={18} /> Nueva {t('purchase')}
          </button>
        </div>
      </div>

      <div className="purchase-summary">
        <div className="summary-card">
          <div className="summary-icon" style={{ background: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5' }}>
            <Package size={20} />
          </div>
          <div className="summary-info">
            <span className="summary-label">Productos comprados</span>
            <span className="summary-value">{totals.cantidad}</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon" style={{ background: 'rgba(5, 150, 105, 0.1)', color: '#059669' }}>
            <Dollar size={20} />
          </div>
          <div className="summary-info">
            <span className="summary-label">Total Invertido</span>
            <span className="summary-value">{formatCurrency(totals.total)}</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon" style={{ background: 'rgba(217, 119, 6, 0.1)', color: '#d97706' }}>
            <Trending size={20} />
          </div>
          <div className="summary-info">
            <span className="summary-label">Proveedores</span>
            <span className="summary-value">{totals.proveedores}</span>
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th><th>Fecha</th><th>{t('product')}</th><th>{t('supplier')}</th>
              <th>Cantidad</th><th>Costo Unit.</th><th>Total</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map((purchase) => (
              <tr key={purchase.id}>
                <td><span className="purchase-id">#{purchase.id}</span></td>
                <td>{formatDate(purchase.created_at)}</td>
                <td>
                  <div className="product-name-cell">
                    <div className="product-icon"><Package size={16} /></div>
                    <div>
                      <span className="product-name">{purchase.product_name}</span>
                      <span className="product-desc">{purchase.product_sku}</span>
                    </div>
                  </div>
                </td>
                <td>{purchase.supplier_name ? <span className="badge"><Truck size={12} />{purchase.supplier_name}</span> : <span className="text-muted">—</span>}</td>
                <td><span className="qty-badge">{purchase.cantidad}</span></td>
                <td className="currency">{formatCurrency(purchase.costo_unitario)}</td>
                <td className="currency">{formatCurrency(purchase.total)}</td>
                <td>
                  <div className="actions">
                    <button className="btn-icon danger" onClick={() => setConfirmDelete(purchase)} title="Eliminar">
                      <Trash size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {purchases.length === 0 && (
              <tr>
                <td colSpan={8} className="empty-cell">
                  <div className="empty-state">
                    <Package size={48} />
                    <h3>No hay {t('purchase_plural').toLowerCase()} registradas</h3>
                    <p>Registra tu primera {t('purchase').toLowerCase()}</p>
                    <button className="btn btn-primary" onClick={openCreateModal}>
                      <Plus size={16} /> Nueva {t('purchase')}
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
        <PurchaseFormModal products={products} suppliers={suppliers}
          onSave={handleSave} onClose={() => setShowModal(false)} t={t} />
      )}

      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Eliminar Compra"
        message={`¿Estás seguro de eliminar la compra #${confirmDelete?.id} de "${confirmDelete?.product_name}"? El stock se revertirá automáticamente.`}
        confirmText="Eliminar"
        onConfirm={handleDelete}
        onClose={() => setConfirmDelete(null)}
      />
    </div>
  );
}
