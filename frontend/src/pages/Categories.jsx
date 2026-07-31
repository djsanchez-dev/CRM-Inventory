import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useBusinessConfig } from '../context/BusinessConfig';
import { useToast } from '../components/Toast';
import Skeleton from '../components/Skeleton';
import { Plus, Edit, Trash, Tags, Search, X } from '../components/Icons';
import ConfirmDialog from '../components/ConfirmDialog';
import CategoryFormModal from '../components/categories/CategoryFormModal';

export default function Categories() {
  const { t } = useBusinessConfig();
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => { loadCategories(); }, []);

  const loadCategories = async () => {
    try {
      const data = await api.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => { setEditing(null); setShowModal(true); };
  const openEdit = (cat) => { setEditing(cat); setShowModal(true); };

  const handleSave = async (form) => {
    try {
      if (editing) {
        await api.updateCategory(editing.id, form);
        toast.success('Categoría actualizada correctamente');
      } else {
        await api.createCategory(form);
        toast.success('Categoría creada correctamente');
      }
      setShowModal(false);
      loadCategories();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await api.deleteCategory(confirmDelete.id);
      toast.success('Categoría eliminada correctamente');
      setConfirmDelete(null);
      loadCategories();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const filtered = categories.filter((cat) =>
    !search || cat.nombre.toLowerCase().includes(search.toLowerCase())
      || (cat.descripcion || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="page-container"><Skeleton.CardGrid count={6} /></div>;
  }

  return (
    <div className="page-container">
      <div className="toolbar">
        <div className="toolbar-info"><span>{filtered.length} {t('category_plural').toLowerCase()}</span></div>
        <div className="toolbar-filters">
          <div className="search-box">
            <Search size={18} />
            <input type="text" placeholder="Buscar categorías..."
              value={search} onChange={(e) => setSearch(e.target.value)} />
            {search && <button className="clear-btn" onClick={() => setSearch('')}><X size={16} /></button>}
          </div>
          <button className="btn btn-primary" onClick={openCreate}>
            <Plus size={18} /> Nueva {t('category')}
          </button>
        </div>
      </div>

      <div className="categories-grid">
        {filtered.map((cat) => (
          <div key={cat.id} className="category-card">
            <div className="category-card-header">
              <div className="category-icon"><Tags size={20} /></div>
              <div className="category-actions">
                <button className="btn-icon" onClick={() => openEdit(cat)} title="Editar"><Edit size={14} /></button>
                <button className="btn-icon danger" onClick={() => setConfirmDelete(cat)} title="Eliminar"><Trash size={14} /></button>
              </div>
            </div>
            <h3 className="category-name">{cat.nombre}</h3>
            {cat.descripcion && <p className="category-desc">{cat.descripcion}</p>}
            <div className="category-footer">
              <span className="badge">{cat.product_count} {t('product_plural').toLowerCase()}</span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="empty-state full-width">
            <Tags size={48} />
            {categories.length > 0 ? (
              <>
                <h3>Sin resultados para tu búsqueda</h3>
                <p>Prueba con otro término o limpia la búsqueda</p>
                <button className="btn btn-secondary" onClick={() => setSearch('')}>
                  <X size={16} /> Limpiar búsqueda
                </button>
              </>
            ) : (
              <>
                <h3>No hay {t('category_plural').toLowerCase()}</h3>
                <p>Crea tu primer {t('category').toLowerCase()}</p>
                <button className="btn btn-primary" onClick={openCreate}>
                  <Plus size={16} /> Crear {t('category')}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <CategoryFormModal editing={editing} onSave={handleSave}
          onClose={() => setShowModal(false)} t={t} />
      )}

      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Eliminar Categoría"
        message={`¿Estás seguro de eliminar la categoría "${confirmDelete?.nombre}"?`}
        confirmText="Eliminar"
        onConfirm={handleDelete}
        onClose={() => setConfirmDelete(null)}
      />
    </div>
  );
}
