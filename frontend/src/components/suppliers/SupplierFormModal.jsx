import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function SupplierFormModal({ editing, onSave, onClose, t }) {
  const [form, setForm] = useState({
    nombre: '', contacto: '', email: '', telefono: '', direccion: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      setForm({
        nombre: editing.nombre || '',
        contacto: editing.contacto || '',
        email: editing.email || '',
        telefono: editing.telefono || '',
        direccion: editing.direccion || '',
      });
    } else {
      setForm({ nombre: '', contacto: '', email: '', telefono: '', direccion: '' });
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

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editing ? `Editar ${t('supplier')}` : `Nuevo ${t('supplier')}`}</h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label>Nombre *</label>
                <input type="text" required value={form.nombre}
                  onChange={(e) => update('nombre', e.target.value)} placeholder="Nombre del proveedor" autoFocus />
              </div>
              <div className="form-group">
                <label>Contacto</label>
                <input type="text" value={form.contacto}
                  onChange={(e) => update('contacto', e.target.value)} placeholder="Persona de contacto" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={form.email}
                  onChange={(e) => update('email', e.target.value)} placeholder="correo@ejemplo.com" />
              </div>
              <div className="form-group">
                <label>Teléfono</label>
                <input type="text" value={form.telefono}
                  onChange={(e) => update('telefono', e.target.value)} placeholder="555-0000" />
              </div>
            </div>
            <div className="form-group">
              <label>Dirección</label>
              <textarea value={form.direccion} rows={2}
                onChange={(e) => update('direccion', e.target.value)} placeholder="Dirección completa" />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Guardando...' : editing ? 'Actualizar' : `Crear ${t('supplier')}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
