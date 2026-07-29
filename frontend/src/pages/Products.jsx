import { useState, useEffect } from 'react';
import { api } from '../api/client';
import Logo from '../components/Logo';
import { useBusinessConfig } from '../context/BusinessConfig';
import { useToast } from '../components/Toast';
import Skeleton from '../components/Skeleton';
import Pagination from '../components/Pagination';
import { exportProductsCSV, exportProductsPDF } from '../utils/export';

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
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    sku: '',
    precio: '',
    costo: '',
    stock: '',
    stock_minimo: '5',
    category_id: '',
  });
  const [saving, setSaving] = useState(false);

  // Single unified load function that includes all filters + page
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

  // When page changes, reload with current filters
  useEffect(() => {
    loadProducts();
  }, [page]);

  // When filters change, reset to page 1 and debounce
  useEffect(() => {
    setPage(1);
    const timeout = setTimeout(() => loadProducts(1), 300);
    return () => clearTimeout(timeout);
  }, [search, filterCategory, filterLowStock]);

  const openCreateModal = () => {
    setEditingProduct(null);
    setForm({
      nombre: '',
      descripcion: '',
      sku: '',
      precio: '',
      costo: '',
      stock: '',
      stock_minimo: '5',
      category_id: '',
    });
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    // Parse extra fields from stored JSON
    let extra = {};
    try {
      extra = typeof product.extra_data === 'string' ? JSON.parse(product.extra_data) : (product.extra_data || {});
    } catch (e) { extra = {}; }
    setForm({
      nombre: product.nombre || '',
      descripcion: product.descripcion || '',
      sku: product.sku || '',
      precio: product.precio?.toString() || '',
      costo: product.costo?.toString() || '',
      stock: product.stock?.toString() || '',
      stock_minimo: product.stock_minimo?.toString() || '5',
      category_id: product.category_id?.toString() || '',
      ...extra,
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Build extra_data from business-specific fields
      const extraFields = getExtraFields('product');
      const extra_data = {};
      if (extraFields.length > 0) {
        for (const field of extraFields) {
          if (form[field.key] !== undefined && form[field.key] !== '') {
            extra_data[field.key] = form[field.key];
          }
        }
      }

      const data = {
        nombre: form.nombre,
        descripcion: form.descripcion,
        sku: form.sku,
        precio: parseFloat(form.precio),
        costo: parseFloat(form.costo) || 0,
        stock: parseInt(form.stock) || 0,
        stock_minimo: parseInt(form.stock_minimo) || 5,
        category_id: form.category_id ? parseInt(form.category_id) : null,
        extra_data: Object.keys(extra_data).length > 0 ? extra_data : undefined,
      };

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
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product) => {
    if (!confirm(`¿Eliminar "${product.nombre}"?`)) return;
    try {
      await api.deleteProduct(product.id);
      toast.success('Producto eliminado correctamente');
      loadProducts();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value);

  if (loading && products.length === 0) {
    return (
      <div className="page-container">
        <Skeleton.Table rows={6} columns={8} />
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-box">
          <div style={{width:18,height:18}} aria-hidden><Logo variant="glyph" size={18} label="S" /></div>
          <input
            type="text"
            placeholder="Buscar por nombre o SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="clear-btn" onClick={() => setSearch('')}>
              ×
            </button>
          )}
        </div>

        <div className="toolbar-filters">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="filter-select"
          >
            <option value="">Todas las categorías</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nombre}
              </option>
            ))}
          </select>

          <label className="filter-checkbox">
            <input
              type="checkbox"
              checked={filterLowStock}
              onChange={(e) => setFilterLowStock(e.target.checked)}
            />
            <span style={{width:14,height:14,display:'inline-block',textAlign:'center',color:'#f59e0b'}}>!</span>
            Stock bajo
          </label>

          <div className="export-buttons">
            <button
              className="btn btn-export"
              onClick={() => exportProductsCSV(products)}
              disabled={products.length === 0}
              title={products.length === 0 ? 'No hay datos para exportar' : 'Exportar a CSV'}
            >
              <span>CSV</span>
            </button>
            <button
              className="btn btn-export pdf"
              onClick={() => exportProductsPDF(products)}
              disabled={products.length === 0}
              title={products.length === 0 ? 'No hay datos para exportar' : 'Exportar a PDF'}
            >
              <span>PDF</span>
            </button>
          </div>

          <button className="btn btn-primary" onClick={openCreateModal}>
            <span>Nuevo {t('product')}</span>
          </button>
        </div>
      </div>

      {/* Products Table */}
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
                      <div className="product-icon">
                        <div style={{width:28,height:28}} aria-hidden><Logo variant="glyph" size={20} label={product.nombre?.charAt(0)} /></div>
                      </div>
                      <div>
                        <span className="product-name">{product.nombre}</span>
                        {product.descripcion && (
                          <span className="product-desc">{product.descripcion}</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td><code>{product.sku}</code></td>
                  <td>
                    <span className="badge badge-category">
                      {product.category_name || 'Sin categoría'}
                    </span>
                  </td>
                  <td className="currency">{formatCurrency(product.precio)}</td>
                  <td className="currency">{formatCurrency(product.costo)}</td>
                  <td>
                    <div className="stock-cell">
                      <span className={`stock-badge ${isLowStock ? 'low' : 'ok'}`}>
                        {product.stock}
                      </span>
                      {isLowStock && <span className="low-icon">!</span>}
                    </div>
                  </td>
                  <td className="currency">
                    {formatCurrency(product.stock * product.costo)}
                  </td>
                  <td>
                    <div className="actions">
                      <button
                        className="btn-icon"
                        onClick={() => openEditModal(product)}
                        title="Editar"
                      >
                      E
                      </button>
                      <button
                        className="btn-icon danger"
                        onClick={() => handleDelete(product)}
                        title="Eliminar"
                      >
                      X
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
                  <div style={{width:64,height:64}} aria-hidden><Logo variant="glyph" size={64} label="P" /></div>
                    <h3>No hay productos</h3>
                    <p>Crea tu primer producto para comenzar</p>
                    <button className="btn btn-primary" onClick={openCreateModal}>
                    Crear Producto
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination pagination={pagination} onPageChange={setPage} />

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingProduct ? `Editar ${t('product')}` : `Nuevo ${t('product')}`}</h2>
            <button className="close-btn" onClick={() => setShowModal(false)} aria-label="Cerrar">
              <Logo variant="close" size={18} />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Nombre *</label>
                    <input
                      type="text"
                      required
                      value={form.nombre}
                      onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                      placeholder="Nombre del producto"
                    />
                  </div>
                  <div className="form-group">
                    <label>SKU *</label>
                    <input
                      type="text"
                      required
                      value={form.sku}
                      onChange={(e) => setForm({ ...form, sku: e.target.value.toUpperCase() })}
                      placeholder="Código único"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Descripción</label>
                  <textarea
                    value={form.descripcion}
                    onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                    placeholder="Descripción del producto"
                    rows={2}
                  />
                </div>
                <div className="form-row three">
                  <div className="form-group">
                    <label>Precio *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={form.precio}
                      onChange={(e) => setForm({ ...form, precio: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="form-group">
                    <label>Costo</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.costo}
                      onChange={(e) => setForm({ ...form, costo: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="form-group">
                    <label>Stock</label>
                    <input
                      type="number"
                      min="0"
                      value={form.stock}
                      onChange={(e) => setForm({ ...form, stock: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Extra fields from business type config */}
                {getExtraFields('product').length > 0 && (
                  <div className="form-row three">
                    {getExtraFields('product').map((field) => (
                      <div className="form-group" key={field.key}>
                        <label>{field.label}</label>
                        <input
                          type={field.type || 'text'}
                          value={form[field.key] || ''}
                          onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                          placeholder={field.placeholder || ''}
                        />
                      </div>
                    ))}
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label>{t('stock_minimo')}</label>
                    <input
                      type="number"
                      min="0"
                      value={form.stock_minimo}
                      onChange={(e) => setForm({ ...form, stock_minimo: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('category')}</label>
                    <select
                      value={form.category_id}
                      onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                    >
                      <option value="">Sin categoría</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
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
                  {saving ? 'Guardando...' : editingProduct ? 'Actualizar' : `Crear ${t('product')}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
