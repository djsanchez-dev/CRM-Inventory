import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Plus, Search, ShoppingCart, X, Eye, Trash, FileDown, FileText, Edit, Printer, Bike } from '../components/Icons';
import { canUseDelivery, DELIVERY_STATE_LABEL } from '../utils/deliveryTypes';
import { useBusinessConfig } from '../context/BusinessConfig';
import { printSaleTicket } from '../utils/export';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';
import Skeleton from '../components/Skeleton';
import Pagination from '../components/Pagination';
import { exportSalesCSV, exportSalesPDF } from '../utils/export';
import DateRangeFilter from '../components/DateRangeFilter';
import SaleCreateModal from '../components/sales/SaleCreateModal';
import SaleDetailModal from '../components/sales/SaleDetailModal';

export default function Sales() {
  const { t, tipo } = useBusinessConfig();
  const toast = useToast();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState({ startDate: '', endDate: '' });
  const [tipoPagoFilter, setTipoPagoFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [allCustomers, setAllCustomers] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(null);
  const [editSale, setEditSale] = useState(null); // { sale, products, customers }
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Load customer list once for the filter dropdown
  useEffect(() => {
    api.getCustomers('?limit=500').then((res) => {
      setAllCustomers(res.data || []);
    }).catch(() => {});
  }, []);

  const buildParams = (pg) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (dateFilter.startDate) params.set('startDate', dateFilter.startDate);
    if (dateFilter.endDate) params.set('endDate', dateFilter.endDate);
    if (tipoPagoFilter) params.set('tipo_pago', tipoPagoFilter);
    if (customerFilter) params.set('customer_id', customerFilter);
    params.set('page', (pg || page).toString());
    const qs = params.toString();
    return qs ? `?${qs}` : '';
  };

  const clearFilters = () => {
    setSearch('');
    setDateFilter({ startDate: '', endDate: '' });
    setTipoPagoFilter('');
    setCustomerFilter('');
    setPage(1);
  };

  const activeFilterCount = [
    search, dateFilter.startDate || dateFilter.endDate, tipoPagoFilter, customerFilter,
  ].filter(Boolean).length;

  useEffect(() => {
    setPage(1);
    const timeout = setTimeout(() => loadSales(1), 300);
    return () => clearTimeout(timeout);
  }, [search, dateFilter, tipoPagoFilter, customerFilter]);

  useEffect(() => {
    loadSales();
  }, [page]);

  const loadSales = async (pageOverride) => {
    try {
      const result = await api.getSales(buildParams(pageOverride));
      setSales(result.data || []);
      setPagination(result.pagination);
    } catch (error) {
      console.error('Error loading sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = async () => {
    try {
      const [productsData, customersData] = await Promise.all([
        api.getProducts(),
        api.getCustomers(),
      ]);
      setProducts(productsData.data || []);
      setCustomers(customersData.data || []);
      setShowCreateModal(true);
    } catch (error) {
      toast.error('Error al cargar datos: ' + error.message);
    }
  };

  const handleCreateSale = async (saleData) => {
    try {
      await api.createSale(saleData);
      setShowCreateModal(false);
      toast.success('Venta registrada correctamente');
      loadSales();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleQuickCreateCustomer = async (nombre, telefono) => {
    const newCustomer = await api.quickCreateCustomer({ nombre, telefono });
    setCustomers((prev) => [...prev, newCustomer]);
    return newCustomer;
  };

  const handleUpdateSale = async (id, saleData) => {
    try {
      await api.updateSale(id, saleData);
      setEditSale(null);
      toast.success(`Venta #${id} actualizada correctamente`);
      loadSales();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const openEditModal = async (sale) => {
    try {
      const [productsData, customersData, detail] = await Promise.all([
        api.getProducts('?limit=500'),
        api.getCustomers('?limit=500'),
        api.getSale(sale.id),
      ]);
      setEditSale({
        sale: detail,
        products: productsData.data || [],
        customers: customersData.data || [],
      });
    } catch (error) {
      toast.error('Error al cargar datos: ' + error.message);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await api.deleteSale(confirmDelete.id);
      toast.success('Venta anulada correctamente');
      setConfirmDelete(null);
      loadSales();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const viewDetail = async (sale) => {
    try {
      const detail = await api.getSale(sale.id);
      setShowDetailModal(detail);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handlePrintTicket = async (sale) => {
    try {
      const detail = await api.getSale(sale.id);
      printSaleTicket(detail);
    } catch (error) {
      toast.error(error.message);
    }
  };

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

  if (loading && sales.length === 0) {
    return (
      <div className="page-container">
        <Skeleton.Table rows={5} columns={7} />
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
            placeholder={`Buscar ${t('sale_plural').toLowerCase()}...`}
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

          <select className="filter-select" value={tipoPagoFilter} onChange={(e) => setTipoPagoFilter(e.target.value)} title="Filtrar por método de pago">
            <option value="">Todos los pagos</option>
            <option value="efectivo">Efectivo</option>
            <option value="tarjeta">Tarjeta</option>
            <option value="transferencia">Transferencia</option>
          </select>

          <select className="filter-select" value={customerFilter} onChange={(e) => setCustomerFilter(e.target.value)} title="Filtrar por cliente">
            <option value="">Todos los clientes</option>
            {allCustomers.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>

          {activeFilterCount > 0 && (
            <button className="clear-btn btn-clear-filters" onClick={clearFilters} title="Limpiar todos los filtros">
              <X size={14} /> Limpiar ({activeFilterCount})
            </button>
          )}

          <div className="export-buttons">
            <button
              className="btn btn-export"
              onClick={() => exportSalesCSV(sales)}
              disabled={sales.length === 0}
              title={sales.length === 0 ? 'No hay datos para exportar' : 'Exportar a CSV'}
            >
              <FileDown size={18} />
              <span>CSV</span>
            </button>
            <button
              className="btn btn-export pdf"
              onClick={() => exportSalesPDF(sales)}
              disabled={sales.length === 0}
              title={sales.length === 0 ? 'No hay datos para exportar' : 'Exportar a PDF'}
            >
              <FileText size={18} />
              <span>PDF</span>
            </button>
          </div>

          <button className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={18} />
            <span>Nueva {t('sale')}</span>
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Items</th>
              <th>Total</th>
              <th>Pago</th>
              {canUseDelivery(tipo) && <th>Delivery</th>}
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => (
              <tr key={sale.id}>
                <td>
                  <span className="sale-id">#{sale.id}</span>
                </td>
                <td>{formatDate(sale.created_at)}</td>
                <td>{sale.customer_name || <span className="text-muted">Sin cliente</span>}</td>
                <td>{sale.total_items} producto(s)</td>
                <td className="currency">{formatCurrency(sale.total)}</td>
                <td>
                  <span className={`badge badge-${sale.tipo_pago}`}>{sale.tipo_pago}</span>
                </td>
                {canUseDelivery(tipo) && (
                  <td>
                    {sale.es_delivery ? (
                      <span className={`badge badge-delivery badge-delivery-${sale.estado_delivery || 'pendiente'}`}>
                        <Bike size={12} />
                        {DELIVERY_STATE_LABEL[sale.estado_delivery] || 'Delivery'}
                      </span>
                    ) : (
                      <span className="text-muted" style={{ fontSize: '0.75rem' }}>—</span>
                    )}
                  </td>
                )}
                <td>
                  <div className="actions">
                    <button className="btn-icon" onClick={() => viewDetail(sale)} title="Ver detalle">
                      <Eye size={16} />
                    </button>
                    <button
                      className="btn-icon"
                      onClick={() => openEditModal(sale)}
                      title="Editar venta"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className="btn-icon"
                      onClick={() => handlePrintTicket(sale)}
                      title="Imprimir ticket"
                    >
                      <Printer size={16} />
                    </button>
                    <button
                      className="btn-icon danger"
                      onClick={() => setConfirmDelete(sale)}
                      title="Anular"
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {sales.length === 0 && (
              <tr>
                <td colSpan={canUseDelivery(tipo) ? 8 : 7} className="empty-cell">
                  <div className="empty-state">
                    <ShoppingCart size={48} />
                    <h3>No hay {t('sale_plural').toLowerCase()}</h3>
                    <p>Registra una nueva {t('sale').toLowerCase()}</p>
                    <button className="btn btn-primary" onClick={openCreateModal}>
                      <Plus size={16} /> Nueva {t('sale')}
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination pagination={pagination} onPageChange={setPage} />

      {showCreateModal && (
        <SaleCreateModal
          onClose={() => setShowCreateModal(false)}
          products={products}
          customers={customers}
          onCreateSale={handleCreateSale}
          onQuickCreateCustomer={handleQuickCreateCustomer}
        />
      )}

      {showDetailModal && (
        <SaleDetailModal sale={showDetailModal} onClose={() => setShowDetailModal(null)} onPrint={() => handlePrintTicket(showDetailModal)} />
      )}

      {editSale && (
        <SaleCreateModal
          onClose={() => setEditSale(null)}
          products={editSale.products}
          customers={editSale.customers}
          onCreateSale={handleCreateSale}
          onUpdateSale={handleUpdateSale}
          onQuickCreateCustomer={handleQuickCreateCustomer}
          initialSale={editSale.sale}
        />
      )}

      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Anular Venta"
        message={`¿Estás seguro de anular la venta #${confirmDelete?.id}? El stock se revertirá automáticamente.`}
        confirmText="Anular Venta"
        variant="danger"
        onConfirm={handleDelete}
        onClose={() => setConfirmDelete(null)}
      />
    </div>
  );
}
