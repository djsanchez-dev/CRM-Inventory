import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import Skeleton from '../components/Skeleton';
import Pagination from '../components/Pagination';
import { Search, X, Building2, Trash, Users, Package, ShoppingCart, Dollar as DollarSign, Eye, Calendar } from '../components/Icons';
import ConfirmDialog from '../components/ConfirmDialog';

export default function AdminBusinesses() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    if (user?.rol !== 'super_admin') { navigate('/app'); return; }
  }, []);

  useEffect(() => { loadBusinesses(); }, [page]);
  useEffect(() => {
    setPage(1);
    const timeout = setTimeout(() => loadBusinesses(), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const loadBusinesses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      params.set('page', page.toString());
      const result = await api.getAdminBusinesses(`?${params.toString()}`);
      setBusinesses(result.data || []);
      setPagination(result.pagination);
    } catch (error) {
      console.error('Error loading businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewDetail = async (business) => {
    setDetailLoading(true);
    try {
      const detail = await api.getAdminBusiness(business.id);
      setSelectedBusiness(detail);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await api.deleteAdminBusiness(confirmDelete.id);
      toast.success(`Negocio "${confirmDelete.nombre}" eliminado`);
      setConfirmDelete(null);
      setSelectedBusiness(null);
      loadBusinesses();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('es-PE', { year: 'numeric', month: 'short', day: 'numeric' });

  const formatCurrency = (v) =>
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(v);

  if (loading && businesses.length === 0) {
    return <div className="page-container"><Skeleton.CardGrid count={6} /></div>;
  }

  return (
    <div className="page-container">
      <div className="toolbar">
        <div className="search-box">
          <Search size={18} />
          <input type="text" placeholder="Buscar negocios..." value={search}
            onChange={(e) => setSearch(e.target.value)} />
          {search && <button className="clear-btn" onClick={() => setSearch('')}><X size={16} /></button>}
        </div>
        <div className="toolbar-info">
          <span>{pagination?.total || 0} negocio(s)</span>
        </div>
      </div>

      <div className="admin-business-grid">
        {businesses.map((biz) => (
          <div key={biz.id} className="admin-biz-card" onClick={() => viewDetail(biz)}>
            <div className="admin-biz-header">
              <div className="admin-biz-icon"><Building2 size={20} /></div>
              <div className="admin-biz-actions" onClick={(e) => e.stopPropagation()}>
                <button className="btn-icon danger" onClick={() => setConfirmDelete(biz)} title="Eliminar negocio">
                  <Trash size={14} />
                </button>
              </div>
            </div>
            <h3 className="admin-biz-name">{biz.nombre}</h3>
            <span className="badge badge-category">{biz.tipo_negocio}</span>
            <div className="admin-biz-meta">
              <span><Calendar size={12} /> {formatDate(biz.created_at)}</span>
            </div>
            <div className="admin-biz-stats">
              <div className="admin-biz-stat">
                <Users size={14} /> <span>{biz.user_count} usuarios</span>
              </div>
              <div className="admin-biz-stat">
                <Package size={14} /> <span>{biz.product_count} prod.</span>
              </div>
              <div className="admin-biz-stat">
                <ShoppingCart size={14} /> <span>{biz.sale_count} ventas</span>
              </div>
            </div>
          </div>
        ))}
        {businesses.length === 0 && (
          <div className="empty-state full-width">
            <Building2 size={48} />
            <h3>No hay negocios registrados</h3>
            <p>Los negocios aparecerán aquí cuando los usuarios se registren</p>
          </div>
        )}
      </div>

      <Pagination pagination={pagination} onPageChange={setPage} />

      {/* Detail Modal */}
      {selectedBusiness && (
        <div className="modal-overlay" onClick={() => setSelectedBusiness(null)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><Building2 size={18} /> {selectedBusiness.nombre}</h2>
              <button className="close-btn" onClick={() => setSelectedBusiness(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              {detailLoading ? (
                <div className="loading-container"><div className="spinner" /></div>
              ) : (
                <>
                  <div className="admin-detail-grid">
                    <div className="admin-detail-item">
                      <span className="admin-detail-label">Tipo</span>
                      <span className="badge badge-category">{selectedBusiness.tipo_negocio}</span>
                    </div>
                    <div className="admin-detail-item">
                      <span className="admin-detail-label">Creado</span>
                      <span>{formatDate(selectedBusiness.created_at)}</span>
                    </div>
                    <div className="admin-detail-item">
                      <span className="admin-detail-label">Admin</span>
                      <span>{selectedBusiness.adminUser?.nombre || '—'}</span>
                    </div>
                    <div className="admin-detail-item">
                      <span className="admin-detail-label">Usuario admin</span>
                      <span>@{selectedBusiness.adminUser?.username || '—'}</span>
                    </div>
                  </div>

                  <div className="admin-stats-row">
                    <div className="admin-stat-box">
                      <Users size={18} />
                      <span className="admin-stat-num">{selectedBusiness.user_count}</span>
                      <span className="admin-stat-lbl">Usuarios</span>
                    </div>
                    <div className="admin-stat-box">
                      <Package size={18} />
                      <span className="admin-stat-num">{selectedBusiness.product_count}</span>
                      <span className="admin-stat-lbl">Productos</span>
                    </div>
                    <div className="admin-stat-box">
                      <ShoppingCart size={18} />
                      <span className="admin-stat-num">{selectedBusiness.sale_count}</span>
                      <span className="admin-stat-lbl">Ventas</span>
                    </div>
                    <div className="admin-stat-box">
                      <DollarSign size={18} />
                      <span className="admin-stat-num">{formatCurrency(selectedBusiness.total_sales_amount)}</span>
                      <span className="admin-stat-lbl">Ventas totales</span>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => navigate(`/admin/users?business_id=${selectedBusiness.id}`)}>
                <Eye size={16} /> Ver Usuarios
              </button>
              <button className="btn btn-danger" onClick={() => { setConfirmDelete(selectedBusiness); setSelectedBusiness(null); }}>
                <Trash size={16} /> Eliminar Negocio
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Eliminar Negocio"
        message={`¿Estás seguro de eliminar "${confirmDelete?.nombre}"? Se eliminarán TODOS sus datos (productos, ventas, usuarios, etc.). Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        onConfirm={handleDelete}
        onClose={() => setConfirmDelete(null)}
      />
    </div>
  );
}
