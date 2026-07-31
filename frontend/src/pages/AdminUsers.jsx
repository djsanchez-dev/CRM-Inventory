import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import Skeleton from '../components/Skeleton';
import Pagination from '../components/Pagination';
import { Search, X, Users, Edit, Trash, Shield, ShieldOff, Key, Building2, Save } from '../components/Icons';
import ConfirmDialog from '../components/ConfirmDialog';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [resetPassId, setResetPassId] = useState(null);
  const [resetPassValue, setResetPassValue] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const businessFilter = searchParams.get('business_id');

  useEffect(() => {
    if (user?.rol !== 'super_admin') { navigate('/app'); return; }
  }, []);

  useEffect(() => { loadUsers(); }, [page, businessFilter]);
  useEffect(() => {
    setPage(1);
    const timeout = setTimeout(() => loadUsers(), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (businessFilter) params.set('business_id', businessFilter);
      params.set('page', page.toString());
      const result = await api.getAdminUsers(`?${params.toString()}`);
      setUsers(result.data || []);
      setPagination(result.pagination);
    } catch (error) {
      console.error('Error loading admin users:', error);
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (targetUser) => {
    setEditingUser(targetUser);
    setEditName(targetUser.nombre);
    setEditUsername(targetUser.username);
  };

  const handleEdit = async () => {
    if (!editName.trim()) { toast.warning('El nombre es requerido'); return; }
    try {
      await api.updateAdminUser(editingUser.id, { nombre: editName, username: editUsername });
      toast.success('Usuario actualizado correctamente');
      setEditingUser(null);
      loadUsers();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleResetPassword = async () => {
    if (!resetPassValue || resetPassValue.length < 6) {
      toast.warning('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    try {
      await api.resetAdminUserPassword(resetPassId, resetPassValue);
      toast.success('Contraseña restablecida correctamente');
      setResetPassId(null);
      setResetPassValue('');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await api.deleteAdminUser(confirmDelete.id);
      toast.success('Usuario eliminado correctamente');
      setConfirmDelete(null);
      loadUsers();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('es-PE', { year: 'numeric', month: 'short', day: 'numeric' });

  if (loading && users.length === 0) {
    return <div className="page-container"><Skeleton.Table rows={8} columns={6} /></div>;
  }

  return (
    <div className="page-container">
      <div className="toolbar">
        <div className="search-box">
          <Search size={18} />
          <input type="text" placeholder="Buscar usuarios..." value={search}
            onChange={(e) => setSearch(e.target.value)} />
          {search && <button className="clear-btn" onClick={() => setSearch('')}><X size={16} /></button>}
        </div>
        <div className="toolbar-info">
          <span>{pagination?.total || 0} usuario(s)</span>
          {businessFilter && (
            <span className="text-muted" style={{ marginLeft: 8, fontSize: '0.78rem' }}>
              (filtrado por negocio)
            </span>
          )}
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Usuario</th>
              <th>Rol</th>
              <th>Negocio</th>
              <th>Registro</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  <div className="product-name-cell">
                    <div className="product-icon"><Users size={16} /></div>
                    <span className="product-name">{u.nombre}</span>
                  </div>
                </td>
                <td><code>@{u.username}</code></td>
                <td>
                  {u.rol === 'admin' ? (
                    <span className="badge badge-admin"><Shield size={12} /> Dueño</span>
                  ) : (
                    <span className="badge badge-user"><ShieldOff size={12} /> Usuario</span>
                  )}
                </td>
                <td><span className="badge badge-category"><Building2 size={12} /> {u.business_name || '—'}</span></td>
                <td>{formatDate(u.created_at)}</td>
                <td>
                  <div className="actions">
                    <button className="btn-icon" onClick={() => openEdit(u)} title="Editar"><Edit size={14} /></button>
                    <button className="btn-icon" onClick={() => { setResetPassId(u.id); setResetPassValue(''); }}
                      title="Resetear contraseña" style={{ color: '#f59e0b' }}><Key size={14} /></button>
                    <button className="btn-icon danger" onClick={() => setConfirmDelete(u)} title="Eliminar"><Trash size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="empty-cell">
                  <div className="empty-state">
                    <Users size={48} />
                    <h3>No hay usuarios</h3>
                    <p>Los usuarios aparecerán aquí cuando se registren</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination pagination={pagination} onPageChange={setPage} />

      {/* Edit Modal */}
      {editingUser && (
        <div className="modal-overlay" onClick={() => setEditingUser(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><Edit size={16} /> Editar Usuario</h2>
              <button className="close-btn" onClick={() => setEditingUser(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Nombre completo</label>
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Nombre de usuario</label>
                <input type="text" value={editUsername} onChange={(e) => setEditUsername(e.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setEditingUser(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleEdit}><Save size={16} /> Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetPassId && (
        <div className="modal-overlay" onClick={() => { setResetPassId(null); setResetPassValue(''); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><Key size={16} /> Resetear Contraseña</h2>
              <button className="close-btn" onClick={() => { setResetPassId(null); setResetPassValue(''); }}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Nueva contraseña</label>
                <input type="text" value={resetPassValue}
                  onChange={(e) => setResetPassValue(e.target.value)}
                  placeholder="Mínimo 6 caracteres" autoFocus />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setResetPassId(null); setResetPassValue(''); }}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleResetPassword}><Key size={16} /> Resetear</button>
            </div>
          </div>
        </div>
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
