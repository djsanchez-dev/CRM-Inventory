import { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import CartItem from './CartItem';
import CustomerSection from './CustomerSection';
import PointsSection from './PointsSection';

export default function SaleCreateModal({
  onClose,
  products,
  customers,
  onCreateSale,
  onQuickCreateCustomer,
}) {
  const [cart, setCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [tipoPago, setTipoPago] = useState('efectivo');
  const [productSearch, setProductSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [puntosToUse, setPuntosToUse] = useState(0);

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

  const handleCreateSale = async () => {
    if (cart.length === 0) return;
    setSaving(true);
    try {
      await onCreateSale({
        customer_id: selectedCustomer ? selectedCustomer.id : null,
        items: cart.map((item) => ({
          product_id: item.product_id,
          cantidad: item.cantidad,
        })),
        tipo_pago: tipoPago,
        puntos_usados: descuentoPuntos,
      });
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
          <h2>Nueva Venta</h2>
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
            onClick={handleCreateSale}
            disabled={cart.length === 0 || saving}
          >
            {saving
              ? 'Procesando...'
              : `Completar venta - ${formatCurrency(totalVenta)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
