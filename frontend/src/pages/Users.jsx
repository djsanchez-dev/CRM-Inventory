import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit, Trash, Shield, ShieldOff, X, User, Search } from '../components/Icons';
import ConfirmDialog from '../components/ConfirmDialog';
import { useBusinessConfig } from '../context/BusinessConfig';
import { useToast } from '../components/Toast';
import Skeleton from '../components/Skeleton';
import UserFormModal from '../components/users/UserFormModal';

export default function Users() {
  const { t } = useBusinessConfig();
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const { user: currentUser } = useAuth();

  useEffect(() => { loadUsers(); }, []);

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

  const openCreate = () => { setEditing(null); setShowModal(true); };
  const openEdit = (user) => { setEditing(user); setShowModal(true); };

  const handleSave = async (data) => {
    try {
      if (editing) {
        await api.updateUser(editing.id, data);
        toast.success('Usuario actualizado correctamente');
      } else {
        await api.createUser(data);
        toast.success('Usuario creado correctamente');
      }
      setShowModal(false);
      loadUsers();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    if (confirmDelete.id === currentUser?.id) {
      toast.warning('No puedes eliminarte a ti mismo');
      setConfirmDelete(null);
      return;
    }
    try {
      await api.deleteUser(confirmDelete.id);
      toast.success('Usuario eliminado correctamente');
      setConfirmDelete(null);
      loadUsers();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('es-PE', { year: 'numeric', month: 'short', day: 'numeric' });

  const filtered = users.filter((u) => {
    const matchesSearch = !search
      || u.nombre.toLowerCase().includes(search.toLowerCase())
      || u.username.toLowerCase().includes(search.toLowerCase());
    const matchesRole = !roleFilter || u.rol === roleFilter;
    return matchesSearch && matchesRole;
  });

  const clearFilters = () => {
    setSearch('');
    setRoleFilter('');
  };

  const activeFilterCount = [search, roleFilter].filter(Boolean).length;

  if (loading) {
    return <div className="page-container"><Skeleton.CardGrid count={6} /></div>;
  }

  return (
    <div className="page-container">
      <div className="toolbar">
        <div className="toolbar-info"><span>{filtered.length} usuario(s)</span></div>
        <div className="toolbar-filters">
          <div className="search-box">
            <Search size={18} />
            <input type="text" placeholder="Buscar por nombre o usuario..."
              value={search} onChange={(e) => setSearch(e.target.value)} />
            {search && <button className="clear-btn" onClick={() => setSearch('')}><X size={16} /></button>}
          </div>
          <select className="filter-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} title="Filtrar por rol">
            <option value="">Todos los roles</option>
            <option value="admin">Admin</option>
            <option value="user">Usuario</option>
          </select>
          {activeFilterCount > 0 && (
            <button className="clear-btn btn-clear-filters" onClick={clearFilters} title="Limpiar todos los filtros">
              <X size={14} /> Limpiar ({activeFilterCount})
            </button>
          )}
          <button className="btn btn-primary" onClick={openCreate}>
            <Plus size={18} /> Nuevo {t('user')}
          </button>
        </div>
      </div>

      <div className="users-grid">
        {filtered.map((u) => {
          const isSelf = u.id === currentUser?.id;
          return (
            <div key={u.id} className={`user-card ${u.rol === 'admin' ? 'admin' : ''} ${isSelf ? 'self' : ''}`}>
              <div className="user-card-header">
                <div className={`user-card-avatar ${u.rol === 'admin' ? 'admin-avatar' : ''}`}>
                  {u.nombre.charAt(0).toUpperCase()}
                </div>
                <div className="user-card-role">
                  {u.rol === 'admin' ? (
                    <span className="badge badge-admin"><Shield size={12} /> Admin</span>
                  ) : (
                    <span className="badge badge-user"><ShieldOff size={12} /> Usuario</span>
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
                  <button className="btn-icon" onClick={() => openEdit(u)} title="Editar"><Edit size={14} /></button>
                  {!isSelf && (
                    <button className="btn-icon danger" onClick={() => setConfirmDelete(u)} title="Eliminar"><Trash size={14} /></button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <UserFormModal editing={editing} onSave={handleSave}
          onClose={() => setShowModal(false)} t={t} />
      )}

      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Eliminar Usuario"
        message={`¿Estás seguro de eliminar a "${confirmDelete?.nombre}" (@${confirmDelete?.username})? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        onConfirm={handleDelete}
        onClose={() => setConfirmDelete(null)}
      />
    </div>
  );
}
