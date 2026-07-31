import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function UserFormModal({ editing, onSave, onClose, t }) {
  const [form, setForm] = useState({ username: '', password: '', nombre: '', rol: 'user' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      setForm({
        username: editing.username,
        password: '',
        nombre: editing.nombre,
        rol: editing.rol,
      });
    } else {
      setForm({ username: '', password: '', nombre: '', rol: 'user' });
    }
  }, [editing]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { username: form.username, nombre: form.nombre, rol: form.rol };
      if (form.password) data.password = form.password;
      await onSave(data);
      onClose();
    } catch (e) { /* parent handles */ } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editing ? `Editar ${t('user')}` : `Nuevo ${t('user')}`}</h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Nombre *</label>
              <input type="text" required value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder="Nombre completo" autoFocus />
            </div>
            <div className="form-group">
              <label>Usuario *</label>
              <input type="text" required={!editing} value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="Nombre de usuario" />
            </div>
            <div className="form-group">
              <label>{editing ? 'Nueva contraseña (dejar vacío para mantener)' : 'Contraseña *'}</label>
              <input type="password" required={!editing} minLength={6} value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={editing ? '•••••• (vacío = sin cambios)' : 'Mínimo 6 caracteres'} />
            </div>
            <div className="form-group">
              <label>Rol</label>
              <select value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })}>
                <option value="user">Usuario</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Guardando...' : editing ? 'Actualizar' : `Crear ${t('user')}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
