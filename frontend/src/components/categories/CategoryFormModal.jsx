import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function CategoryFormModal({ editing, onSave, onClose, t }) {
  const [form, setForm] = useState({ nombre: '', descripcion: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      setForm({ nombre: editing.nombre, descripcion: editing.descripcion || '' });
    } else {
      setForm({ nombre: '', descripcion: '' });
    }
  }, [editing]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (e) { /* parent handles */ } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editing ? `Editar ${t('category')}` : `Nueva ${t('category')}`}</h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Nombre *</label>
              <input type="text" required value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder={`Nombre de ${t('category').toLowerCase()}`} autoFocus />
            </div>
            <div className="form-group">
              <label>Descripción</label>
              <textarea value={form.descripcion} rows={3}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                placeholder={`Descripción de ${t('category').toLowerCase()}`} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Guardando...' : editing ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
