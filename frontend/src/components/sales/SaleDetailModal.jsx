import { X, Printer, Bike, MapPin, StickyNote } from 'lucide-react';
import { DELIVERY_STATE_LABEL } from '../../utils/deliveryTypes';

export default function SaleDetailModal({ sale, onClose, onPrint }) {
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Venta #{sale.id}</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">
          <div className="sale-detail-info">
            <div className="detail-row">
              <span className="detail-label">Fecha</span>
              <span>{formatDate(sale.created_at)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Cliente</span>
              <span>{sale.customer_name || 'Sin cliente'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Email</span>
              <span>{sale.customer_email || '-'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Teléfono</span>
              <span>{sale.customer_phone || '-'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Tipo Pago</span>
              <span className="badge">{sale.tipo_pago}</span>
            </div>
            {sale.puntos_usados > 0 && (
              <div className="detail-row">
                <span className="detail-label">Puntos usados</span>
                <span>
                  {sale.puntos_usados} pts (-{formatCurrency(sale.puntos_usados)})
                </span>
              </div>
            )}
            {sale.puntos_ganados > 0 && (
              <div className="detail-row">
                <span className="detail-label">Puntos ganados</span>
                <span className="badge badge-success">+{sale.puntos_ganados} pts</span>
              </div>
            )}
            {sale.es_delivery && (
              <div className="detail-row">
                <span className="detail-label">Delivery</span>
                <span className={`badge badge-delivery badge-delivery-${sale.estado_delivery || 'pendiente'}`}>
                  <Bike size={12} />
                  {DELIVERY_STATE_LABEL[sale.estado_delivery] || 'Delivery'}
                </span>
              </div>
            )}
            {sale.es_delivery && sale.direccion_entrega && (
              <div className="detail-row">
                <span className="detail-label">Dirección</span>
                <span><MapPin size={13} style={{ verticalAlign: 'text-bottom', marginRight: 3 }} />{sale.direccion_entrega}</span>
              </div>
            )}
            {sale.nota && (
              <div className="detail-row">
                <span className="detail-label">Notas</span>
                <span><StickyNote size={13} style={{ verticalAlign: 'text-bottom', marginRight: 3 }} />{sale.nota}</span>
              </div>
            )}
          </div>

          <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid var(--border)' }} />

          <table className="data-table detail-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cant.</th>
                <th>Precio</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item) => (
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
                <td colSpan={3} className="text-right">
                  <strong>Total</strong>
                </td>
                <td className="currency">
                  <strong>{formatCurrency(sale.total)}</strong>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="modal-footer">
          {onPrint && (
            <button className="btn btn-secondary" onClick={() => onPrint(sale)}>
              <Printer size={16} />
              Imprimir ticket
            </button>
          )}
          <button className="btn btn-secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
