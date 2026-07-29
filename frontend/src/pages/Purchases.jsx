import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { Plus, X, Trash, Package, Truck, Dollar, Trending, FileDown, FileText } from '../components/Icons';
import { useBusinessConfig } from '../context/BusinessConfig';
import { useToast } from '../components/Toast';
import Skeleton from '../components/Skeleton';
import { exportPurchasesCSV, exportPurchasesPDF } from '../utils/export';
import DateRangeFilter from '../components/DateRangeFilter';

export default function Purchases() {
  const { t } = useBusinessConfig();
  const toast = useToast();
  const [purchases, setPurchases] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState({ startDate: '', endDate: '' });
  const [supplierFilter, setSupplierFilter] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [form, setForm] = useState({
    supplier_id: '',
    product_id: '',
    cantidad: '',
    costo_unitario: '',
  });
  const [saving, setSaving] = useState(false);

  const buildParams = () => {
    const params = new URLSearchParams();
    if (dateFilter.startDate) params.set('startDate', dateFilter.startDate);
    if (dateFilter.endDate) params.set('endDate', dateFilter.endDate);
    if (supplierFilter) params.set('supplier_id', supplierFilter.id);
    const qs = params.toString();
    return qs ? `?${qs}` : '';
  };

  const loadPurchases = async () => {
    try {
      const data = await api.getPurchases(buildParams());
      setPurchases(data);
    } catch (error) {
      console.error('Error loading purchases:', error);
    } finally {
      setLoading(false);
    }
  };

  // Read supplier filter from URL on mount
  useEffect(() => {
    const sid = searchParams.get('supplier_id');
    const sname = searchParams.get('supplier_name');
    if (sid) {
      setSupplierFilter({ id: sid, nombre: sname || `Proveedor #${sid}` });
    }
  }, []);

  useEffect(() => {
    loadPurchases();
  }, [dateFilter, supplierFilter]);

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
      setProducts(productsData);
      setSuppliers(suppliersData);
      setForm({ supplier_id: '', product_id: '', cantidad: '', costo_unitario: '' });
      setShowModal(true);
    } catch (error) {
      toast.error('Error al cargar datos: ' + error.message);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        product_id: parseInt(form.product_id),
        supplier_id: form.supplier_id ? parseInt(form.supplier_id) : null,
        cantidad: parseInt(form.cantidad),
        costo_unitario: parseFloat(form.costo_unitario),
      };

      await api.createPurchase(data);
      setShowModal(false);
      toast.success('Compra registrada correctamente');
      loadPurchases();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (purchase) => {
    if (!confirm(`¿Eliminar compra #${purchase.id} de "${purchase.product_name}"?\nSe revertirá el stock.`)) return;
    try {
      await api.deletePurchase(purchase.id);
      toast.success('Compra eliminada y stock revertido');
      loadPurchases();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const selectedProduct = products.find(p => p.id === parseInt(form.product_id));

  const formatCurrency = (v) =>
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(v);

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  if (loading && purchases.length === 0) {
    return (
      <div className="page-container">
        <Skeleton.FinCards count={3} />
        <Skeleton.Table rows={4} columns={8} />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="toolbar">
        <div className="toolbar-info">
          <span className="toolbar-count">
            {purchases.length} compra(s) registradas
          </span>
        </div>

        <div className="toolbar-filters">
          <DateRangeFilter onFilter={(f) => setDateFilter(f)} />

          {supplierFilter && (
            <div className="filter-badge">
              <Truck size={14} />
              <span>{supplierFilter.nombre}</span>
              <button
                className="filter-badge-clear"
                onClick={clearSupplierFilter}
                title="Quitar filtro de proveedor"
              >
                <X size={14} />
              </button>
            </div>
          )}

          <div className="export-buttons">
            <button
              className="btn btn-export"
              onClick={() => exportPurchasesCSV(purchases)}
              disabled={purchases.length === 0}
              title={purchases.length === 0 ? 'No hay datos para exportar' : 'Exportar a CSV'}
            >
              <FileDown size={18} />
              <span>CSV</span>
            </button>
            <button
              className="btn btn-export pdf"
              onClick={() => exportPurchasesPDF(purchases)}
              disabled={purchases.length === 0}
              title={purchases.length === 0 ? 'No hay datos para exportar' : 'Exportar a PDF'}
            >
              <FileText size={18} />
              <span>PDF</span>
            </button>
          </div>

          <button className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={18} />
            <span>Nueva {t('purchase')}</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="purchase-summary">
        <div className="summary-card">
          <div className="summary-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
            <Package size={20} />
          </div>
          <div className="summary-info">
            <span className="summary-label">Productos comprados</span>
            <span className="summary-value">
              {purchases.reduce((sum, p) => sum + p.cantidad, 0)}
            </span>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <Dollar size={20} />
          </div>
          <div className="summary-info">
            <span className="summary-label">Total Invertido</span>
            <span className="summary-value">
              {formatCurrency(purchases.reduce((sum, p) => sum + p.total, 0))}
            </span>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
            <Trending size={20} />
          </div>
          <div className="summary-info">
            <span className="summary-label">Proveedores</span>
            <span className="summary-value">
              {new Set(purchases.filter(p => p.supplier_name).map(p => p.supplier_id)).size}
            </span>
          </div>
        </div>
      </div>

      {/* Purchases Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Fecha</th>
              <th>{t('product')}</th>
              <th>{t('supplier')}</th>
              <th>Cantidad</th>
              <th>Costo Unit.</th>
              <th>Total</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map((purchase) => (
              <tr key={purchase.id}>
                <td><span className="purchase-id">#{purchase.id}</span></td>
                <td>{formatDate(purchase.created_at)}</td>
                <td>
                  <div className="product-name-cell">
                    <div className="product-icon">
                      <Package size={16} />
                    </div>
                    <div>
                      <span className="product-name">{purchase.product_name}</span>
                      <span className="product-desc">{purchase.product_sku}</span>
                    </div>
                  </div>
                </td>
                <td>
                  {purchase.supplier_name ? (
                    <span className="badge badge-supplier">
                      <Truck size={12} />
                      {purchase.supplier_name}
                    </span>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
                <td>
                  <span className="qty-badge">{purchase.cantidad}</span>
                </td>
                <td className="currency">{formatCurrency(purchase.costo_unitario)}</td>
                <td className="currency">{formatCurrency(purchase.total)}</td>
                <td>
                  <div className="actions">
                    <button
                      className="btn-icon danger"
                      onClick={() => handleDelete(purchase)}
                      title="Eliminar compra y revertir stock"
                    >
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

      {/* Create Purchase Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nueva {t('purchase')}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Producto *</label>
                  <select
                    required
                    value={form.product_id}
                    onChange={(e) => {
                      const prod = products.find(p => p.id === parseInt(e.target.value));
                      setForm({
                        ...form,
                        product_id: e.target.value,
                        costo_unitario: prod ? prod.costo.toString() : form.costo_unitario,
                      });
                    }}
                    autoFocus
                  >
                    <option value="">Seleccionar producto...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} ({p.sku}) — Stock actual: {p.stock}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Proveedor</label>
                    <select
                      value={form.supplier_id}
                      onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}
                    >
                      <option value="">Sin proveedor</option>
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Cantidad *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={form.cantidad}
                      onChange={(e) => setForm({ ...form, cantidad: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Costo Unitario *</label>
                    <div className="input-with-prefix">
                      <span className="input-prefix">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={form.costo_unitario}
                        onChange={(e) => setForm({ ...form, costo_unitario: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Total</label>
                    <div className="total-display">
                      {formatCurrency(
                        (parseInt(form.cantidad) || 0) * (parseFloat(form.costo_unitario) || 0)
                      )}
                    </div>
                  </div>
                </div>

                {selectedProduct && (
                  <div className="purchase-preview">
                    <div className="preview-header">
                      <Package size={16} />
                      <span>Vista previa del stock</span>
                    </div>
                    <div className="preview-grid">
                      <div className="preview-item">
                        <span className="preview-label">Stock actual</span>
                        <span className="preview-value">{selectedProduct.stock} uds</span>
                      </div>
                      <div className="preview-item plus">
                        <span className="preview-label">+ Compra</span>
                        <span className="preview-value">+{parseInt(form.cantidad) || 0} uds</span>
                      </div>
                      <div className="preview-item result">
                        <span className="preview-label">= Stock final</span>
                        <span className="preview-value">
                          {(selectedProduct.stock + (parseInt(form.cantidad) || 0))} uds
                        </span>
                      </div>
                    </div>
                  </div>
                )}
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
                  {saving ? 'Procesando...' : 'Registrar Compra'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
