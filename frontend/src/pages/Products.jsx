import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Package, Search, Edit, Trash, Plus, X } from '../components/Icons';
import ConfirmDialog from '../components/ConfirmDialog';
import { useBusinessConfig } from '../context/BusinessConfig';
import { useToast } from '../components/Toast';
import Skeleton from '../components/Skeleton';
import Pagination from '../components/Pagination';
import { exportProductsCSV, exportProductsPDF } from '../utils/export';
import ProductFormModal from '../components/products/ProductFormModal';

export default function Products() {
  const { t, getExtraFields } = useBusinessConfig();
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const loadProducts = async (pageOverride) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (filterCategory) params.set('category', filterCategory);
      if (filterLowStock) params.set('low_stock', 'true');
      params.set('page', (pageOverride || page).toString());
      const [productsResult, categoriesData] = await Promise.all([
        api.getProducts(`?${params.toString()}`),
        api.getCategories(),
      ]);
      setProducts(productsResult.data || []);
      setPagination(productsResult.pagination);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProducts(); }, [page]);
  useEffect(() => {
    setPage(1);
    const timeout = setTimeout(() => loadProducts(1), 300);
    return () => clearTimeout(timeout);
  }, [search, filterCategory, filterLowStock]);

  const clearFilters = () => {
    setSearch('');
    setFilterCategory('');
    setFilterLowStock(false);
    setPage(1);
  };

  const activeFilterCount = [search, filterCategory, filterLowStock].filter(Boolean).length;

  const openCreate = () => { setEditingProduct(null); setShowModal(true); };
  const openEdit = (product) => { setEditingProduct(product); setShowModal(true); };

  const handleSave = async (data) => {
    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, data);
        toast.success('Producto actualizado correctamente');
      } else {
        await api.createProduct(data);
        toast.success('Producto creado correctamente');
      }
      setShowModal(false);
      loadProducts();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await api.deleteProduct(confirmDelete.id);
      toast.success('Producto eliminado correctamente');
      setConfirmDelete(null);
      loadProducts();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value);

  if (loading && products.length === 0) {
    return <div className="page-container"><Skeleton.Table rows={6} columns={8} /></div>;
  }

  return (
    <div className="page-container">
      <div className="toolbar">
        <div className="search-box">
          <Search size={18} />
          <input type="text" placeholder="Buscar por nombre o SKU..." value={search}
            onChange={(e) => setSearch(e.target.value)} />
          {search && <button className="clear-btn" onClick={() => setSearch('')}>×</button>}
        </div>
        <div className="toolbar-filters">
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="filter-select">
            <option value="">Todas las categorías</option>
            {categories.map((cat) => (<option key={cat.id} value={cat.id}>{cat.nombre}</option>))}
          </select>
          <label className="filter-checkbox">
            <input type="checkbox" checked={filterLowStock} onChange={(e) => setFilterLowStock(e.target.checked)} />
            <span className="low-icon" style={{ marginRight: 4 }}>!</span>
            Stock bajo
          </label>
          {activeFilterCount > 0 && (
            <button className="clear-btn btn-clear-filters" onClick={clearFilters} title="Limpiar todos los filtros">
              <X size={14} /> Limpiar ({activeFilterCount})
            </button>
          )}
          <div className="export-buttons">
            <button className="btn btn-export" onClick={() => exportProductsCSV(products)}
              disabled={products.length === 0}>CSV</button>
            <button className="btn btn-export pdf" onClick={() => exportProductsPDF(products)}
              disabled={products.length === 0}>PDF</button>
          </div>
          <button className="btn btn-primary" onClick={openCreate}>
            <Plus size={18} /> Nuevo {t('product')}
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>{t('product')}</th>
              <th>{t('sku')}</th>
              <th>{t('category')}</th>
              <th>{t('price')}</th>
              <th>{t('cost')}</th>
              <th>{t('stock')}</th>
              <th>Valor Inventario</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const isLowStock = product.stock <= product.stock_minimo;
              return (
                <tr key={product.id} className={isLowStock ? 'low-stock' : ''}>
                  <td>
                    <div className="product-name-cell">
                      <div className="product-icon"><Package size={16} /></div>
                      <div>
                        <span className="product-name">{product.nombre}</span>
                        {product.descripcion && <span className="product-desc">{product.descripcion}</span>}
                      </div>
                    </div>
                  </td>
                  <td><code>{product.sku}</code></td>
                  <td><span className="badge badge-category">{product.category_name || 'Sin categoría'}</span></td>
                  <td className="currency">{formatCurrency(product.precio)}</td>
                  <td className="currency">{formatCurrency(product.costo)}</td>
                  <td>
                    <div className="stock-cell">
                      <span className={`stock-badge ${isLowStock ? 'low' : 'ok'}`}>{product.stock}</span>
                      {isLowStock && <span className="low-icon">!</span>}
                    </div>
                  </td>
                  <td className="currency">{formatCurrency(product.stock * product.costo)}</td>
                  <td>
                    <div className="actions">
                      <button className="btn-icon" onClick={() => openEdit(product)} title="Editar">
                        <Edit size={14} />
                      </button>
                      <button className="btn-icon danger" onClick={() => setConfirmDelete(product)} title="Eliminar">
                        <Trash size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {products.length === 0 && (
              <tr>
                <td colSpan={8} className="empty-cell">
                  <div className="empty-state">
                    <Package size={48} />
                    <h3>No hay productos</h3>
                    <p>Crea tu primer producto para comenzar</p>
                    <button className="btn btn-primary" onClick={openCreate}>
                      <Plus size={16} /> Crear Producto
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination pagination={pagination} onPageChange={setPage} />

      {showModal && (
        <ProductFormModal
          editingProduct={editingProduct}
          categories={categories}
          extraFields={getExtraFields('product')}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
          t={t}
        />
      )}

      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Eliminar Producto"
        message={`¿Estás seguro de eliminar "${confirmDelete?.nombre}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        onConfirm={handleDelete}
        onClose={() => setConfirmDelete(null)}
      />
    </div>
  );
}
