import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit, Trash, Shield, ShieldOff, X, User } from '../components/Icons';
import { useBusinessConfig } from '../context/BusinessConfig';
import { useToast } from '../components/Toast';
import Skeleton from '../components/Skeleton';

export default function Users() {
  const { t } = useBusinessConfig();
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ username: '', password: '', nombre: '', rol: 'user' });
  const [saving, setSaving] = useState(false);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ username: '', password: '', nombre: '', rol: 'user' });
    setShowModal(true);
  };

  const openEdit = (user) => {
    setEditing(user);
    setForm({
      username: user.username,
      password: '',
      nombre: user.nombre,
      rol: user.rol,
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        const data = { username: form.username, nombre: form.nombre, rol: form.rol };
        if (form.password) data.password = form.password;
        await api.updateUser(editing.id, data);
        toast.success('Usuario actualizado correctamente');
      } else {
        await api.createUser(form);
        toast.success('Usuario creado correctamente');
      }
      setShowModal(false);
      loadUsers();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (targetUser) => {
    if (targetUser.id === currentUser?.id) {
      toast.warning('No puedes eliminarte a ti mismo');
      return;
    }
    if (!confirm(`¿Eliminar al usuario "${targetUser.nombre}" (${targetUser.username})?`)) return;
    try {
      await api.deleteUser(targetUser.id);
      toast.success('Usuario eliminado correctamente');
      loadUsers();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('es-PE', {
      year: 'numeric', month: 'short', day: 'numeric',
    });

  if (loading) {
    return (
      <div className="page-container">
        <Skeleton.CardGrid count={6} />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="toolbar">
        <div className="toolbar-info">
          <span>{users.length} usuario(s)</span>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={18} />            <span>Nuevo {t('user')}</span>
        </button>
      </div>

      <div className="users-grid">
        {users.map((u) => {
          const isSelf = u.id === currentUser?.id;
          return (
            <div key={u.id} className={`user-card ${u.rol === 'admin' ? 'admin' : ''} ${isSelf ? 'self' : ''}`}>
              <div className="user-card-header">
                <div className={`user-card-avatar ${u.rol === 'admin' ? 'admin-avatar' : ''}`}>
                  {u.nombre.charAt(0).toUpperCase()}
                </div>
                <div className="user-card-role">
                  {u.rol === 'admin' ? (
                    <span className="badge badge-admin">
                      <Shield size={12} /> Admin
                    </span>
                  ) : (
                    <span className="badge badge-user">
                      <ShieldOff size={12} /> Usuario
                    </span>
                  )}
                </div>
              </div>
              <h3 className="user-card-name">
                {u.nombre}
                {isSelf && <span className="self-badge">(Tú)</span>}
              </h3>
              <div className="user-card-detail">
                <User size={14} />
                <span>@{u.username}</span>
              </div>
              <div className="user-card-footer">
                <span className="user-card-date">Creado: {formatDate(u.created_at)}</span>
                <div className="user-card-actions">
                  <button className="btn-icon" onClick={() => openEdit(u)} title="Editar">
                    <Edit size={14} />
                  </button>
                  {!isSelf && (
                    <button className="btn-icon danger" onClick={() => handleDelete(u)} title="Eliminar">
                      <Trash size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? `Editar ${t('user')}` : `Nuevo ${t('user')}`}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Nombre *</label>
                  <input
                    type="text"
                    required
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    placeholder="Nombre completo"
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label>Usuario *</label>
                  <input
                    type="text"
                    required={!editing}
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    placeholder="Nombre de usuario"
                  />
                </div>
                <div className="form-group">
                  <label>{editing ? 'Nueva contraseña (dejar vacío para mantener)' : 'Contraseña *'}</label>
                  <input
                    type="password"
                    required={!editing}
                    minLength={6}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder={editing ? '•••••• (dejar vacío = sin cambios)' : 'Mínimo 6 caracteres'}
                  />
                </div>
                <div className="form-group">
                  <label>Rol</label>
                  <select
                    value={form.rol}
                    onChange={(e) => setForm({ ...form, rol: e.target.value })}
                  >
                    <option value="user">Usuario</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : editing ? 'Actualizar' : `Crear ${t('user')}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
