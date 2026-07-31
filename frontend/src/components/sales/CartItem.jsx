import { Minus, Plus, X } from 'lucide-react';

export default function CartItem({ item, onUpdateQuantity, onRemove, formatCurrency }) {
  return (
    <div className="cart-item">
      <div className="cart-item-info">
        <span className="cart-item-name">{item.product_name}</span>
        <span className="cart-item-price">{formatCurrency(item.precio_unitario)}</span>
      </div>
      <div className="cart-item-actions">
        <button
          className="qty-btn"
          onClick={() => onUpdateQuantity(item.product_id, item.cantidad - 1)}
        >
          <Minus size={14} />
        </button>
        <span className="qty-value">{item.cantidad}</span>
        <button
          className="qty-btn"
          onClick={() => onUpdateQuantity(item.product_id, item.cantidad + 1)}
          disabled={item.cantidad >= item.stock}
        >
          <Plus size={14} />
        </button>
        <span className="cart-item-subtotal">{formatCurrency(item.subtotal)}</span>
        <button
          className="btn-icon danger sm"
          onClick={() => onRemove(item.product_id)}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
