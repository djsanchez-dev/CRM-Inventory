import { useState, useEffect } from 'react';
import { X, Search, MapPin, Bike } from 'lucide-react';
import CartItem from './CartItem';
import CustomerSection from './CustomerSection';
import PointsSection from './PointsSection';
import DestinationPicker from '../DestinationPicker';
import { useBusinessConfig } from '../../context/BusinessConfig';
import { canUseDelivery } from '../../utils/deliveryTypes';
import { StickyNote } from '../Icons';

export default function SaleCreateModal({
  onClose,
  products,
  customers,
  onCreateSale,
  onUpdateSale,
  onQuickCreateCustomer,
  deliveryMode = false,
  initialSale = null,
}) {
  const { tipo } = useBusinessConfig();
  const [cart, setCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [tipoPago, setTipoPago] = useState('efectivo');
  const [productSearch, setProductSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [puntosToUse, setPuntosToUse] = useState(0);
  const [esDelivery, setEsDelivery] = useState(deliveryMode);
  const [direccionEntrega, setDireccionEntrega] = useState('');
  const [destino, setDestino] = useState(null); // { lat, lng } from the map picker
  const [repartidor, setRepartidor] = useState('');
  const [nota, setNota] = useState('');

  const isEditing = !!initialSale;
  // Delivery only makes sense for businesses that ship, unless this modal was
  // opened in delivery-only mode (Delivery page) or the sale being edited is
  // already a delivery order (keep it editable).
  const deliveryAvailable =
    canUseDelivery(tipo) || deliveryMode || (isEditing && !!initialSale.es_delivery);

  // Prefill everything when editing an existing sale.
  useEffect(() => {
    if (!initialSale) return;
    setTipoPago(initialSale.tipo_pago || 'efectivo');
    setNota(initialSale.nota || '');
    setEsDelivery(!!initialSale.es_delivery);
    setDireccionEntrega(initialSale.direccion_entrega || '');
    setRepartidor(initialSale.repartidor || '');
    setDestino(
      initialSale.destino_lat != null && initialSale.destino_lng != null
        ? { lat: initialSale.destino_lat, lng: initialSale.destino_lng }
        : null
    );
    const cust = initialSale.customer_id
      ? customers.find((c) => c.id === initialSale.customer_id) || null
      : null;
    setSelectedCustomer(cust);
    setPuntosToUse(initialSale.puntos_usados || 0);
    if (Array.isArray(initialSale.items)) {
      // Old quantities will be returned to stock on save, so while editing the
      // same product we can temporarily allow stock + oldQty units.
      const oldQty = {};
      initialSale.items.forEach((it) => {
        oldQty[it.product_id] = (oldQty[it.product_id] || 0) + it.cantidad;
      });
      setCart(
        initialSale.items.map((it) => {
          const prod = products.find((p) => p.id === it.product_id);
          return {
            product_id: it.product_id,
            product_name: it.product_name || prod?.nombre || `Producto #${it.product_id}`,
            sku: it.product_sku || prod?.sku || '',
            precio_unitario: Number(it.precio_unitario) || 0,
            cantidad: it.cantidad,
            subtotal: Number(it.subtotal) || 0,
            stock: (prod ? prod.stock : 0) + (oldQty[it.product_id] || 0),
          };
        })
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSale?.id]);

  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const descuentoPuntos = selectedCustomer
    ? Math.min(puntosToUse, selectedCustomer.puntos, subtotal)
    : 0;
  const totalVenta = Math.max(0, subtotal - descuentoPuntos);

  useEffect(() => {
    setPuntosToUse(0);
  }, [selectedCustomer?.id]);

  const formatCurrency = (v) =>
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(v);

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product_id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product_id === product.id
            ? {
                ...item,
                cantidad: item.cantidad + 1,
                subtotal: (item.cantidad + 1) * item.precio_unitario,
              }
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

  const handleSubmitSale = async () => {
    if (cart.length === 0) return;
    if (esDelivery && !direccionEntrega.trim()) {
      // Address is required for delivery orders
      const input = document.querySelector('#destination-input');
      if (input) input.focus();
      input?.setAttribute('data-invalid', '1');
      setTimeout(() => input?.removeAttribute('data-invalid'), 1500);
      return;
    }
    setSaving(true);
    const payload = {
      customer_id: selectedCustomer ? selectedCustomer.id : null,
      items: cart.map((item) => ({
        product_id: item.product_id,
        cantidad: item.cantidad,
      })),
      tipo_pago: tipoPago,
      puntos_usados: descuentoPuntos,
      nota: nota.trim() || null,
      es_delivery: esDelivery,
      direccion_entrega: esDelivery ? direccionEntrega.trim() : null,
      destino_lat: esDelivery && destino ? destino.lat : null,
      destino_lng: esDelivery && destino ? destino.lng : null,
      repartidor: esDelivery && repartidor.trim() ? repartidor.trim() : null,
    };
    try {
      if (isEditing) {
        await onUpdateSale(initialSale.id, payload);
      } else {
        await onCreateSale(payload);
      }
      onClose();
    } catch (e) {
      // error handled by parent
    } finally {
      setSaving(false);
    }
  };

  const handleQuickCreateCustomer = async (nombre, telefono) => {
    const newCustomer = await onQuickCreateCustomer(nombre, telefono);
    setSelectedCustomer(newCustomer);
    return newCustomer;
  };

  const filteredProducts = products.filter(
    (p) =>
      p.nombre.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            {isEditing
              ? esDelivery ? 'Editar Pedido Delivery' : 'Editar Venta'
              : esDelivery ? 'Nuevo Pedido Delivery' : 'Nueva Venta'}
          </h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">
          <div className="sale-form-grid">
            {/* Left - Product selection */}
            <div className="sale-products">
              <h3>Productos</h3>
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
                      <span
                        className={`pli-stock ${product.stock <= product.stock_minimo ? 'low' : ''}`}
                      >
                        Stock: {product.stock}
                      </span>
                    </div>
                  </div>
                ))}
                {filteredProducts.length === 0 && (
                  <p className="text-muted" style={{ padding: 12, textAlign: 'center' }}>
                    No se encontraron productos
                  </p>
                )}
              </div>
            </div>

            {/* Right - Cart */}
            <div className="sale-cart">
              <h3>Carrito ({cart.length} items)</h3>
              <div className="cart-items">
                {cart.map((item) => (
                  <CartItem
                    key={item.product_id}
                    item={item}
                    onUpdateQuantity={updateQuantity}
                    onRemove={removeFromCart}
                    formatCurrency={formatCurrency}
                  />
                ))}
                {cart.length === 0 && (
                  <p className="text-muted">Selecciona productos del listado</p>
                )}
              </div>

              <div className="cart-summary">
                <CustomerSection
                  customers={customers}
                  selectedCustomer={selectedCustomer}
                  onSelectCustomer={setSelectedCustomer}
                  onRemoveCustomer={() => {
                    setSelectedCustomer(null);
                    setPuntosToUse(0);
                  }}
                  onQuickCreate={handleQuickCreateCustomer}
                />

                <PointsSection
                  puntosDisponibles={selectedCustomer?.puntos || 0}
                  puntosToUse={puntosToUse}
                  onPuntosChange={setPuntosToUse}
                  subtotal={subtotal}
                  formatCurrency={formatCurrency}
                />

                <div className="form-group">
                  <label>Tipo de Pago</label>
                  <select value={tipoPago} onChange={(e) => setTipoPago(e.target.value)}>
                    <option value="efectivo">Efectivo</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="transferencia">Transferencia</option>
                  </select>
                </div>

                {/* Delivery section — only for businesses that ship (optional) */}
                {deliveryAvailable && (
                  <div className="delivery-section">
                    <button
                      type="button"
                      className={`delivery-toggle ${esDelivery ? 'active' : ''}`}
                      onClick={() => setEsDelivery(!esDelivery)}
                      disabled={deliveryMode}
                      title={
                        deliveryMode
                          ? 'Pedido de delivery obligatorio en esta sección'
                          : 'Activa el delivery solo si el cliente pide entrega a domicilio'
                      }
                    >
                      <Bike size={16} />
                      <span>Entrega a domicilio (opcional)</span>
                    </button>
                    {esDelivery && (
                      <div className="delivery-fields">
                        <DestinationPicker
                          value={direccionEntrega}
                          onChange={(address, coords) => {
                            setDireccionEntrega(address);
                            setDestino(coords);
                          }}
                        />
                        <div className="form-group">
                          <label htmlFor="sale-delivery-rep">Repartidor (opcional)</label>
                          <input
                            id="sale-delivery-rep"
                            type="text"
                            value={repartidor}
                            onChange={(e) => setRepartidor(e.target.value)}
                            placeholder="Ej: Pedro"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Notes — optional for any sale */}
                <div className="form-group">
                  <label htmlFor="sale-nota">
                    <StickyNote size={13} style={{ verticalAlign: 'text-bottom', marginRight: 4 }} />
                    Notas / Observaciones (opcional)
                  </label>
                  <textarea
                    id="sale-nota"
                    value={nota}
                    onChange={(e) => setNota(e.target.value)}
                    placeholder="Ej: Cliente pidió que llamen al llegar..."
                    rows={2}
                  />
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
          <button className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmitSale}
            disabled={cart.length === 0 || saving}
          >
            {saving
              ? 'Procesando...'
              : isEditing
                ? `Guardar cambios - ${formatCurrency(totalVenta)}`
                : `Completar venta - ${formatCurrency(totalVenta)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
