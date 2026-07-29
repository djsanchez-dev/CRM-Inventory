import { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';
import { Plus, Search, ShoppingCart, X, Trash, Minus, Eye, FileDown, FileText, Users, Star, Phone, User } from '../components/Icons';
import { useBusinessConfig } from '../context/BusinessConfig';
import { useToast } from '../components/Toast';
import Skeleton from '../components/Skeleton';
import Pagination from '../components/Pagination';
import { exportSalesCSV, exportSalesPDF } from '../utils/export';
import DateRangeFilter from '../components/DateRangeFilter';

export default function Sales() {
  const { t } = useBusinessConfig();
  const toast = useToast();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState({ startDate: '', endDate: '' });
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(null);

  // Create sale state
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [tipoPago, setTipoPago] = useState('efectivo');
  const [productSearch, setProductSearch] = useState('');
  const [saving, setSaving] = useState(false);

  // Customer panel state
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState([]);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [showQuickForm, setShowQuickForm] = useState(false);
  const [quickName, setQuickName] = useState('');
  const [quickPhone, setQuickPhone] = useState('');
  const [puntosToUse, setPuntosToUse] = useState(0);
  const customerSearchRef = useRef(null);

  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const descuentoPuntos = selectedCustomer ? Math.min(puntosToUse, selectedCustomer.puntos, subtotal) : 0;
  const totalVenta = Math.max(0, subtotal - descuentoPuntos);

  useEffect(() => {
    loadSales();
  }, [page]);

  useEffect(() => {
    if (showCustomerSearch && customerSearch.length >= 1) {
      const filtered = customers.filter(c =>
        c.nombre.toLowerCase().includes(customerSearch.toLowerCase()) ||
        (c.telefono && c.telefono.includes(customerSearch))
      );
      setCustomerResults(filtered.slice(0, 8));
    } else {
      setCustomerResults([]);
    }
  }, [customerSearch, customers, showCustomerSearch]);

  // Reset puntos when customer changes
  useEffect(() => {
    setPuntosToUse(0);
  }, [selectedCustomer?.id]);

  const buildParams = () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (dateFilter.startDate) params.set('startDate', dateFilter.startDate);
    if (dateFilter.endDate) params.set('endDate', dateFilter.endDate);
    params.set('page', page.toString());
    const qs = params.toString();
    return qs ? `?${qs}` : '';
  };

  useEffect(() => {
    setPage(1);
    const timeout = setTimeout(loadSales, 300);
    return () => clearTimeout(timeout);
  }, [search, dateFilter]);

  const loadSales = async () => {
    try {
      const result = await api.getSales(buildParams());
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
      setProducts(productsData);
      setCustomers(customersData);
      setCart([]);
      setSelectedCustomer(null);
      setTipoPago('efectivo');
      setProductSearch('');
      setCustomerSearch('');
      setCustomerResults([]);
      setShowCustomerSearch(false);
      setShowQuickForm(false);
      setQuickName('');
      setQuickPhone('');
      setPuntosToUse(0);
      setShowCreateModal(true);
    } catch (error) {
      toast.error('Error al cargar datos: ' + error.message);
    }
  };

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product_id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product_id === product.id
            ? { ...item, cantidad: item.cantidad + 1, subtotal: (item.cantidad + 1) * item.precio_unitario }
            : item
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          product_name: product.nombre,
          sku: product.sku,
          precio_unitario: product.precio,
          cantidad: 1,
          subtotal: product.precio,
          stock: product.stock,
        },
      ];
    });
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.product_id !== productId));
  };

  const updateQuantity = (productId, cantidad) => {
    if (cantidad < 1) return;
    const item = cart.find((i) => i.product_id === productId);
    if (cantidad > item.stock) cantidad = item.stock;

    setCart((prev) =>
      prev.map((item) =>
        item.product_id === productId
          ? { ...item, cantidad, subtotal: cantidad * item.precio_unitario }
          : item
      )
    );
  };

  const handleAddCustomer = (customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch('');
    setCustomerResults([]);
    setShowCustomerSearch(false);
    setShowQuickForm(false);
  };

  const handleQuickCreate = async () => {
    if (!quickName.trim()) return;
    try {
      const newCustomer = await api.quickCreateCustomer({
        nombre: quickName.trim(),
        telefono: quickPhone.trim() || null,
      });
      setCustomers(prev => [...prev, newCustomer]);
      setSelectedCustomer(newCustomer);
      setQuickName('');
      setQuickPhone('');
      setShowQuickForm(false);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleRemoveCustomer = () => {
    setSelectedCustomer(null);
    setCustomerSearch('');
    setPuntosToUse(0);
  };

  const handleCreateSale = async () => {
    if (cart.length === 0) {
      toast.warning('Agrega al menos un producto');
      return;
    }
    setSaving(true);
    try {
      await api.createSale({
        customer_id: selectedCustomer ? selectedCustomer.id : null,
        items: cart.map((item) => ({
          product_id: item.product_id,
          cantidad: item.cantidad,
        })),
        tipo_pago: tipoPago,
        puntos_usados: descuentoPuntos,
      });
      setShowCreateModal(false);
      toast.success('Venta registrada correctamente');
      loadSales();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (sale) => {
    if (!confirm(`¿Anular la venta #${sale.id}?`)) return;
    try {
      await api.deleteSale(sale.id);
      toast.success('Venta anulada correctamente');
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

  const filteredProducts = products.filter(
    (p) =>
      p.nombre.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(productSearch.toLowerCase())
  );

  if (loading && sales.length === 0) {
    return (
      <div className="page-container">
        <Skeleton.Table rows={5} columns={7} />
      </div>
    );
  }

  const puntosDisponibles = selectedCustomer ? selectedCustomer.puntos : 0;
  const maxPuntosUsables = Math.min(puntosDisponibles, subtotal);

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
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => (
              <tr key={sale.id}>
                <td><span className="sale-id">#{sale.id}</span></td>
                <td>{formatDate(sale.created_at)}</td>
                <td>{sale.customer_name || <span className="text-muted">Sin cliente</span>}</td>
                <td>{sale.total_items} producto(s)</td>
                <td className="currency">{formatCurrency(sale.total)}</td>
                <td>
                  <span className={`badge badge-${sale.tipo_pago}`}>
                    {sale.tipo_pago}
                  </span>
                </td>
                <td>
                  <div className="actions">
                    <button className="btn-icon" onClick={() => viewDetail(sale)} title="Ver detalle">
                      <Eye size={16} />
                    </button>
                    <button
                      className="btn-icon danger"
                      onClick={() => handleDelete(sale)}
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
                <td colSpan={7} className="empty-cell">
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

      {/* Create Sale Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nueva {t('sale')}</h2>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="sale-form-grid">
                {/* Left side - Product selection */}
                <div className="sale-products">
                  <h3>{t('product_plural')}</h3>
                  <div className="search-box sale-search">
                    <Search size={16} />
                    <input
                      type="text"
                      placeholder="Buscar producto..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                    />
                  </div>
                  <div className="product-list">
                    {filteredProducts.map((product) => (
                      <div
                        key={product.id}
                        className={`product-list-item ${product.stock <= 0 ? 'out-of-stock' : ''}`}
                        onClick={() => product.stock > 0 && addToCart(product)}
                      >
                        <div className="pli-info">
                          <span className="pli-name">{product.nombre}</span>
                          <span className="pli-sku">{product.sku}</span>
                        </div>
                        <div className="pli-right">
                          <span className="pli-price">{formatCurrency(product.precio)}</span>
                          <span className={`pli-stock ${product.stock <= product.stock_minimo ? 'low' : ''}`}>
                            Stock: {product.stock}
                          </span>
                        </div>
                      </div>
                    ))}
                    {filteredProducts.length === 0 && (
                      <p className="text-muted">No se encontraron productos</p>
                    )}
                  </div>
                </div>

                {/* Right side - Cart */}
                <div className="sale-cart">
                  <h3>Carrito ({cart.length} items)</h3>
                  <div className="cart-items">
                    {cart.map((item) => (
                      <div key={item.product_id} className="cart-item">
                        <div className="cart-item-info">
                          <span className="cart-item-name">{item.product_name}</span>
                          <span className="cart-item-price">{formatCurrency(item.precio_unitario)}</span>
                        </div>
                        <div className="cart-item-actions">
                          <button
                            className="qty-btn"
                            onClick={() => updateQuantity(item.product_id, item.cantidad - 1)}
                          >
                            <Minus size={14} />
                          </button>
                          <span className="qty-value">{item.cantidad}</span>
                          <button
                            className="qty-btn"
                            onClick={() => updateQuantity(item.product_id, item.cantidad + 1)}
                            disabled={item.cantidad >= item.stock}
                          >
                            <Plus size={14} />
                          </button>
                          <span className="cart-item-subtotal">{formatCurrency(item.subtotal)}</span>
                          <button
                            className="btn-icon danger sm"
                            onClick={() => removeFromCart(item.product_id)}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {cart.length === 0 && (
                      <p className="text-muted">Selecciona productos del listado</p>
                    )}
                  </div>

                  <div className="cart-summary">
                    {/* === CUSTOMER SECTION === */}
                    <div className="customer-section">
                      {!selectedCustomer ? (
                        <>
                          <div className="customer-default">
                            <div className="customer-default-badge">
                              <Users size={16} />
                              <span>Venta Directa</span>
                            </div>
                            <p className="customer-default-hint">
                              Venta sin cliente registrado
                            </p>
                            <div className="customer-actions-row">
                              <button
                                className="btn btn-sm btn-outline"
                                onClick={() => setShowCustomerSearch(!showCustomerSearch)}
                              >
                                <Search size={14} />
                                Buscar cliente
                              </button>
                              <button
                                className="btn btn-sm btn-outline"
                                onClick={() => {
                                  setShowQuickForm(true);
                                  setShowCustomerSearch(false);
                                }}
                              >
                                <Plus size={14} />
                                Registrar
                              </button>
                            </div>
                          </div>

                          {/* Customer Search */}
                          {showCustomerSearch && (
                            <div className="customer-search-panel">
                              <div className="search-box customer-search-input">
                                <Search size={14} />
                                <input
                                  ref={customerSearchRef}
                                  type="text"
                                  placeholder="Buscar por nombre o teléfono..."
                                  value={customerSearch}
                                  onChange={(e) => setCustomerSearch(e.target.value)}
                                  autoFocus
                                />
                                {customerSearch && (
                                  <button className="clear-btn" onClick={() => setCustomerSearch('')}>
                                    <X size={14} />
                                  </button>
                                )}
                              </div>
                              {customerResults.length > 0 && (
                                <div className="customer-results">
                                  {customerResults.map((c) => (
                                    <div
                                      key={c.id}
                                      className="customer-result-item"
                                      onClick={() => handleAddCustomer(c)}
                                    >
                                      <div className="customer-result-avatar">
                                        {c.nombre.charAt(0).toUpperCase()}
                                      </div>
                                      <div className="customer-result-info">
                                        <span className="customer-result-name">{c.nombre}</span>
                                        {c.telefono && (
                                          <span className="customer-result-phone">{c.telefono}</span>
                                        )}
                                      </div>
                                      <span className="customer-result-points">
                                        <Star size={12} />
                                        {c.puntos || 0}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {customerSearch && customerResults.length === 0 && (
                                <p className="text-muted customer-no-results">
                                  No se encontraron clientes. 
                                  <button
                                    className="link-btn"
                                    onClick={() => {
                                      setQuickName(customerSearch);
                                      setShowQuickForm(true);
                                      setShowCustomerSearch(false);
                                    }}
                                  >
                                    Registrar &quot;{customerSearch}&quot;
                                  </button>
                                </p>
                              )}
                            </div>
                          )}

                          {/* Quick Registration Form */}
                          {showQuickForm && (
                            <div className="quick-customer-form">
                              <div className="quick-form-row">
                                <input
                                  type="text"
                                  placeholder="Nombre *"
                                  value={quickName}
                                  onChange={(e) => setQuickName(e.target.value)}
                                  className="quick-form-input"
                                  autoFocus
                                />
                                <input
                                  type="text"
                                  placeholder="Teléfono"
                                  value={quickPhone}
                                  onChange={(e) => setQuickPhone(e.target.value)}
                                  className="quick-form-input"
                                />
                              </div>
                              <div className="quick-form-actions">
                                <button
                                  className="btn btn-sm btn-primary"
                                  onClick={handleQuickCreate}
                                  disabled={!quickName.trim()}
                                >
                                  <User size={14} />
                                  Registrar y seleccionar
                                </button>
                                <button
                                  className="btn btn-sm btn-secondary"
                                  onClick={() => setShowQuickForm(false)}
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        /* Customer Selected */
                        <div className="customer-selected">
                          <div className="customer-selected-header">
                            <div className="customer-selected-info">
                              <div className="customer-selected-avatar">
                                {selectedCustomer.nombre.charAt(0).toUpperCase()}
                              </div>
                              <div className="customer-selected-details">
                                <span className="customer-selected-name">
                                  {selectedCustomer.nombre}
                                </span>
                                {selectedCustomer.telefono && (
                                  <span className="customer-selected-phone">
                                    <Phone size={12} />
                                    {selectedCustomer.telefono}
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              className="btn-icon"
                              onClick={handleRemoveCustomer}
                              title="Desvincular cliente"
                            >
                              <X size={14} />
                            </button>
                          </div>

                          <div className="customer-selected-stats">
                            <div className="cstat">
                              <span className="cstat-label">Compras</span>
                              <span className="cstat-value">{selectedCustomer.total_compras || 0}</span>
                            </div>
                            <div className="cstat">
                              <span className="cstat-label">Gastado</span>
                              <span className="cstat-value">{formatCurrency(selectedCustomer.total_gastado || 0)}</span>
                            </div>
                            <div className="cstat points">
                              <span className="cstat-label">
                                <Star size={12} /> Puntos
                              </span>
                              <span className="cstat-value">{puntosDisponibles}</span>
                            </div>
                          </div>

                          {/* Points usage */}
                          {puntosDisponibles > 0 && (
                            <div className="points-section">
                              <label className="points-label">
                                Usar puntos como descuento
                              </label>
                              <div className="points-control">
                                <input
                                  type="range"
                                  min={0}
                                  max={maxPuntosUsables}
                                  value={puntosToUse}
                                  onChange={(e) => setPuntosToUse(parseInt(e.target.value) || 0)}
                                  className="points-slider"
                                />
                                <div className="points-input-group">
                                  <input
                                    type="number"
                                    min={0}
                                    max={maxPuntosUsables}
                                    value={puntosToUse}
                                    onChange={(e) => {
                                      const v = parseInt(e.target.value) || 0;
                                      setPuntosToUse(Math.min(v, maxPuntosUsables));
                                    }}
                                    className="points-number-input"
                                  />
                                  <span className="points-unit">pts</span>
                                </div>
                              </div>
                              {puntosToUse > 0 && (
                                <div className="points-discount">
                                  Descuento por puntos: -{formatCurrency(puntosToUse)}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="form-group">
                      <label>Tipo de Pago</label>
                      <select value={tipoPago} onChange={(e) => setTipoPago(e.target.value)}>
                        <option value="efectivo">Efectivo</option>
                        <option value="tarjeta">Tarjeta</option>
                        <option value="transferencia">Transferencia</option>
                      </select>
                    </div>

                    <div className="cart-total">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    {descuentoPuntos > 0 && (
                      <div className="cart-total puntos-descuento">
                        <span>Dto. puntos:</span>
                        <span>-{formatCurrency(descuentoPuntos)}</span>
                      </div>
                    )}
                    <div className="cart-total cart-total-final">
                      <span>Total:</span>
                      <span className="total-value">{formatCurrency(totalVenta)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreateSale}
                disabled={cart.length === 0 || saving}
              >
                {saving ? 'Procesando...' : `Completar ${t('sale').toLowerCase()} - ${formatCurrency(totalVenta)}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sale Detail Modal */}
      {showDetailModal && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(null)}>
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('sale')} #{showDetailModal.id}</h2>
              <button className="close-btn" onClick={() => setShowDetailModal(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="sale-detail-info">
                <div className="detail-row">
                  <span className="detail-label">Fecha</span>
                  <span>{formatDate(showDetailModal.created_at)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Cliente</span>
                  <span>{showDetailModal.customer_name || 'Sin cliente'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Email</span>
                  <span>{showDetailModal.customer_email || '-'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Teléfono</span>
                  <span>{showDetailModal.customer_phone || '-'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Tipo Pago</span>
                  <span className="badge">{showDetailModal.tipo_pago}</span>
                </div>
                {showDetailModal.puntos_usados > 0 && (
                  <div className="detail-row">
                    <span className="detail-label">Puntos usados</span>
                    <span>{showDetailModal.puntos_usados} pts (-{formatCurrency(showDetailModal.puntos_usados)})</span>
                  </div>
                )}
                {showDetailModal.puntos_ganados > 0 && (
                  <div className="detail-row">
                    <span className="detail-label">Puntos ganados</span>
                    <span className="badge badge-success">+{showDetailModal.puntos_ganados} pts</span>
                  </div>
                )}
              </div>

              <hr />

              <table className="data-table detail-table">
                <thead>
                  <tr>
                    <th>{t('product')}</th>
                    <th>Cant.</th>
                    <th>{t('price')}</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {showDetailModal.items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.product_name}</td>
                      <td>{item.cantidad}</td>
                      <td>{formatCurrency(item.precio_unitario)}</td>
                      <td className="currency">{formatCurrency(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} className="text-right"><strong>Total</strong></td>
                    <td className="currency"><strong>{formatCurrency(showDetailModal.total)}</strong></td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDetailModal(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
