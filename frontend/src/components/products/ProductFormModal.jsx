import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function ProductFormModal({
  editingProduct,
  categories,
  extraFields,
  onSave,
  onClose,
  t,
}) {
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    sku: '',
    precio: '',
    costo: '',
    stock: '',
    stock_minimo: '5',
    category_id: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingProduct) {
      let extra = {};
      try {
        extra = typeof editingProduct.extra_data === 'string'
          ? JSON.parse(editingProduct.extra_data)
          : (editingProduct.extra_data || {});
      } catch (e) { extra = {}; }
      setForm({
        nombre: editingProduct.nombre || '',
        descripcion: editingProduct.descripcion || '',
        sku: editingProduct.sku || '',
        precio: editingProduct.precio?.toString() || '',
        costo: editingProduct.costo?.toString() || '',
        stock: editingProduct.stock?.toString() || '',
        stock_minimo: editingProduct.stock_minimo?.toString() || '5',
        category_id: editingProduct.category_id?.toString() || '',
        ...extra,
      });
    } else {
      setForm({
        nombre: '', descripcion: '', sku: '', precio: '', costo: '',
        stock: '', stock_minimo: '5', category_id: '',
      });
    }
  }, [editingProduct]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const extra_data = {};
      if (extraFields.length > 0) {
        for (const field of extraFields) {
          if (form[field.key] !== undefined && form[field.key] !== '') {
            extra_data[field.key] = form[field.key];
          }
        }
      }
      await onSave({
        nombre: form.nombre,
        descripcion: form.descripcion,
        sku: form.sku,
        precio: parseFloat(form.precio),
        costo: parseFloat(form.costo) || 0,
        stock: parseInt(form.stock) || 0,
        stock_minimo: parseInt(form.stock_minimo) || 5,
        category_id: form.category_id ? parseInt(form.category_id) : null,
        extra_data: Object.keys(extra_data).length > 0 ? extra_data : undefined,
      });
      onClose();
    } catch (e) {
      // error handled by parent
    } finally {
      setSaving(false);
    }
  };

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editingProduct ? `Editar ${t('product')}` : `Nuevo ${t('product')}`}</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label>Nombre *</label>
                <input type="text" required value={form.nombre}
                  onChange={(e) => update('nombre', e.target.value)} placeholder="Nombre del producto" autoFocus />
              </div>
              <div className="form-group">
                <label>SKU *</label>
                <input type="text" required value={form.sku}
                  onChange={(e) => update('sku', e.target.value.toUpperCase())} placeholder="Código único" />
              </div>
            </div>
            <div className="form-group">
              <label>Descripción</label>
              <textarea value={form.descripcion} rows={2}
                onChange={(e) => update('descripcion', e.target.value)} placeholder="Descripción del producto" />
            </div>
            <div className="form-row three">
              <div className="form-group">
                <label>Precio *</label>
                <input type="number" step="0.01" min="0" required value={form.precio}
                  onChange={(e) => update('precio', e.target.value)} placeholder="0.00" />
              </div>
              <div className="form-group">
                <label>Costo</label>
                <input type="number" step="0.01" min="0" value={form.costo}
                  onChange={(e) => update('costo', e.target.value)} placeholder="0.00" />
              </div>
              <div className="form-group">
                <label>Stock</label>
                <input type="number" min="0" value={form.stock}
                  onChange={(e) => update('stock', e.target.value)} placeholder="0" />
              </div>
            </div>
            {extraFields.length > 0 && (
              <div className="form-row three">
                {extraFields.map((field) => (
                  <div className="form-group" key={field.key}>
                    <label>{field.label}</label>
                    <input type={field.type || 'text'} value={form[field.key] || ''}
                      onChange={(e) => update(field.key, e.target.value)} placeholder={field.placeholder || ''} />
                  </div>
                ))}
              </div>
            )}
            <div className="form-row">
              <div className="form-group">
                <label>{t('stock_minimo')}</label>
                <input type="number" min="0" value={form.stock_minimo}
                  onChange={(e) => update('stock_minimo', e.target.value)} />
              </div>
              <div className="form-group">
                <label>{t('category')}</label>
                <select value={form.category_id} onChange={(e) => update('category_id', e.target.value)}>
                  <option value="">Sin categoría</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Guardando...' : editingProduct ? 'Actualizar' : `Crear ${t('product')}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
