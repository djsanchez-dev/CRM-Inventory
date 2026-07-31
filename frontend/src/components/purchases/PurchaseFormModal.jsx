import { useState, useEffect } from 'react';
import { X, Package } from 'lucide-react';

export default function PurchaseFormModal({ products, suppliers, onSave, onClose, t }) {
  const [form, setForm] = useState({
    supplier_id: '', product_id: '', cantidad: '', costo_unitario: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({ supplier_id: '', product_id: '', cantidad: '', costo_unitario: '' });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        product_id: parseInt(form.product_id),
        supplier_id: form.supplier_id ? parseInt(form.supplier_id) : null,
        cantidad: parseInt(form.cantidad),
        costo_unitario: parseFloat(form.costo_unitario),
      });
      onClose();
    } catch (e) { /* parent handles */ } finally { setSaving(false); }
  };

  const selectedProduct = products.find(p => p.id === parseInt(form.product_id));
  const total = (parseInt(form.cantidad) || 0) * (parseFloat(form.costo_unitario) || 0);
  const formatCurrency = (v) =>
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(v);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Nueva {t('purchase')}</h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Producto *</label>
              <select required value={form.product_id}
                onChange={(e) => {
                  const prod = products.find(p => p.id === parseInt(e.target.value));
                  update('product_id', e.target.value);
                  if (prod) update('costo_unitario', prod.costo.toString());
                }} autoFocus>
                <option value="">Seleccionar producto...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} ({p.sku}) — Stock: {p.stock}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Proveedor</label>
                <select value={form.supplier_id} onChange={(e) => update('supplier_id', e.target.value)}>
                  <option value="">Sin proveedor</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Cantidad *</label>
                <input type="number" min="1" required value={form.cantidad}
                  onChange={(e) => update('cantidad', e.target.value)} placeholder="0" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Costo Unitario *</label>
                <input type="number" step="0.01" min="0" required value={form.costo_unitario}
                  onChange={(e) => update('costo_unitario', e.target.value)} placeholder="0.00" />
              </div>
              <div className="form-group">
                <label>Total</label>
                <div className="total-display">{formatCurrency(total)}</div>
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
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Procesando...' : 'Registrar Compra'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
