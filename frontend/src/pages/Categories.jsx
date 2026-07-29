import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useBusinessConfig } from '../context/BusinessConfig';
import { useToast } from '../components/Toast';
import Skeleton from '../components/Skeleton';
import { Plus, Edit, Trash, Tags, X } from '../components/Icons';

export default function Categories() {
  const { t } = useBusinessConfig();
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ nombre: '', descripcion: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

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

  const openCreate = () => {
    setEditing(null);
    setForm({ nombre: '', descripcion: '' });
    setShowModal(true);
  };

  const openEdit = (cat) => {
    setEditing(cat);
    setForm({ nombre: cat.nombre, descripcion: cat.descripcion || '' });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
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
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat) => {
    if (!confirm(`¿Eliminar ${t('category').toLowerCase()} "${cat.nombre}"?`)) return;
    try {
      await api.deleteCategory(cat.id);
      toast.success('Categoría eliminada correctamente');
      loadCategories();
    } catch (error) {
      toast.error(error.message);
    }
  };

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
          <span className="toolbar-count">{categories.length} {t('category_plural').toLowerCase()}</span>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={18} />
          <span>Nueva {t('category')}</span>
        </button>
      </div>

      <div className="categories-grid">
        {categories.map((cat) => (
          <div key={cat.id} className="category-card">
            <div className="category-card-header">
              <div className="category-icon">
                <Tags size={20} />
              </div>
              <div className="category-actions">
                <button className="btn-icon" onClick={() => openEdit(cat)} title="Editar">
                  <Edit size={14} />
                </button>
                <button
                  className="btn-icon danger"
                  onClick={() => handleDelete(cat)}
                  title="Eliminar"
                >
                  <Trash size={14} />
                </button>
              </div>
            </div>
            <h3 className="category-name">{cat.nombre}</h3>
            {cat.descripcion && <p className="category-desc">{cat.descripcion}</p>}
            <div className="category-footer">
              <span className="badge">{cat.product_count} {t('product_plural').toLowerCase()}</span>
            </div>
          </div>
        ))}

        {categories.length === 0 && (
          <div className="empty-state full-width">
            <Tags size={48} />
            <h3>No hay {t('category_plural').toLowerCase()}</h3>
            <p>Crea tu primer {t('category').toLowerCase()}</p>
            <button className="btn btn-primary" onClick={openCreate}>
              <Plus size={16} /> Crear {t('category')}
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? `Editar ${t('category')}` : `Nueva ${t('category')}`}</h2>
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
                    placeholder={`Nombre de ${t('category').toLowerCase()}`}
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label>Descripción</label>
                  <textarea
                    value={form.descripcion}
                    onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                    placeholder={`Descripción de ${t('category').toLowerCase()}`}
                    rows={3}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : editing ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
