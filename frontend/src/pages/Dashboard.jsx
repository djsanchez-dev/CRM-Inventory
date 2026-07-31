import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useNavigate } from 'react-router-dom';
import { useBusinessConfig } from '../context/BusinessConfig';
import Skeleton from '../components/Skeleton';
import { FileDown, FileText, Package, Tags, Users, Truck, Dollar, Trending, TrendingDown, AlertCircle } from '../components/Icons';
import { exportDashboardCSV, exportDashboardPDF } from '../utils/export';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

export default function Dashboard() {
  const { t } = useBusinessConfig();
  const [data, setData] = useState(null);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
    loadLowStock();
  }, []);

  const loadData = async () => {
    try {
      const stats = await api.getDashboard();
      setData(stats);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
  };

  const loadLowStock = async () => {
    try {
      const products = await api.getProducts('?low_stock=true');
      setLowStockProducts(products);
    } catch (error) {
      console.error('Error loading low stock:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
    }).format(value);
  };

  if (loading) {
    return (
      <div className="dashboard">
        <Skeleton.Stats count={4} />
        <Skeleton.FinCards count={4} />
        <div className="charts-grid">
          <Skeleton.Chart />
          <Skeleton.Chart />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="empty-state">
        <p>Error al cargar los datos</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Low Stock Alert Banner */}
      {lowStockProducts.length > 0 && (            <div className="low-stock-alert-banner">
          <div className="alert-banner-content">
            <div className="alert-banner-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
              <AlertCircle size={24} />
            </div>
            <div className="alert-banner-text">
              <strong>{lowStockProducts.length} {t('product_plural').toLowerCase()}</strong> con {t('stock').toLowerCase()} bajo
              <span className="alert-banner-sub">
                {lowStockProducts.slice(0, 3).map(p => p.nombre).join(', ')}
                {lowStockProducts.length > 3 && ` y ${lowStockProducts.length - 3} más`}
              </span>
            </div>
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => navigate('/products?low_stock=1')}
          >
            Revisar Inventario
          </button>
        </div>
      )}

      {/* Export Controls */}
      <div className="dashboard-export-bar">
        <span className="toolbar-info">Resumen general del sistema</span>
        <div className="export-buttons">
          <button
            className="btn btn-export"
            onClick={() => exportDashboardCSV(data)}
            title="Exportar a CSV"
          >
            <FileDown size={16} />
            <span>CSV</span>
          </button>
          <button
            className="btn btn-export pdf"
            onClick={() => exportDashboardPDF(data)}
            title="Exportar a PDF"
          >
            <FileText size={16} />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card" onClick={() => navigate('/products')}>            <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
              <Package size={28} />
            </div>
            <div className="stat-info">
              <span className="stat-label">{t('product_plural')}</span>
              <span className="stat-value">{data.totalProducts}</span>
            </div>
          </div>
          <div className="stat-card" onClick={() => navigate('/categories')}>
            <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
              <Tags size={28} />
            </div>
            <div className="stat-info">
              <span className="stat-label">{t('category_plural')}</span>
              <span className="stat-value">{data.totalCategories}</span>
            </div>
          </div>
          <div className="stat-card" onClick={() => navigate('/customers')}>
            <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <Users size={28} />
            </div>
            <div className="stat-info">
              <span className="stat-label">{t('customer_plural')}</span>
              <span className="stat-value">{data.totalCustomers}</span>
            </div>
          </div>
          <div className="stat-card" onClick={() => navigate('/suppliers')}>
            <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
              <Truck size={28} />
            </div>
          <div className="stat-info">
            <span className="stat-label">{t('supplier_plural')}</span>
            <span className="stat-value">{data.totalSuppliers}</span>
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="financial-cards">          <div className="fin-card ingresos">
          <div className="fin-icon">
            <Trending size={20} />
          </div>
          <div className="fin-info">
            <span className="fin-label">Ingresos Totales</span>
            <span className="fin-value">{formatCurrency(data.totalIngresos)}</span>
          </div>
        </div>
        <div className="fin-card inversion">
          <div className="fin-icon">
            <Dollar size={20} />
          </div>
          <div className="fin-info">
            <span className="fin-label">Inversión en Inventario</span>
            <span className="fin-value">{formatCurrency(data.totalInversion)}</span>
          </div>
        </div>
        <div className="fin-card ganancia">
          <div className="fin-icon">
            <TrendingDown size={20} />
          </div>
          <div className="fin-info">
            <span className="fin-label">Ganancia Potencial</span>
            <span className="fin-value">{formatCurrency(data.gananciaPotencial)}</span>
          </div>
        </div>
        <div
          className={`fin-card ${lowStockProducts.length > 0 ? 'alerta' : 'ok'}`}
          onClick={() => lowStockProducts.length > 0 && navigate('/products?low_stock=1')}
          style={lowStockProducts.length > 0 ? { cursor: 'pointer' } : {}}
        >
          <div className="fin-icon">
            <AlertCircle size={20} />
          </div>
          <div className="fin-info">
            <span className="fin-label">{t('stock')} Bajo</span>
            <span className="fin-value">{data.lowStockCount} {t('product_plural').toLowerCase()}</span>
          </div>
        </div>
      </div>

      {/* Low Stock Table (if any) */}
      {lowStockProducts.length > 0 && (
        <div className="low-stock-section">
          <div className="low-stock-header">
            <h3>
              <AlertCircle size={18} />
              Alertas de {t('stock')} Bajo
            </h3>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => navigate('/products?low_stock=1')}
            >
              Ver Todos
            </button>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('product')}</th>
                  <th>{t('sku')}</th>
                  <th>{t('category')}</th>
                  <th>{t('stock')} Actual</th>
                  <th>{t('stock_minimo')}</th>
                  <th>Faltante</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {lowStockProducts.map((product) => {
                  const faltante = product.stock_minimo - product.stock;
                  return (
                    <tr key={product.id} className="low-stock-row">
                      <td>
                        <div className="product-name-cell">
                          <div className="product-icon">
                            <Package size={16} />
                          </div>
                          <span className="product-name">{product.nombre}</span>
                        </div>
                      </td>
                      <td><code>{product.sku}</code></td>
                      <td>
                        <span className="badge badge-category">
                          {product.category_name || 'Sin categoría'}
                        </span>
                      </td>
                      <td>
                        <span className="stock-badge low">{product.stock}</span>
                      </td>
                      <td>{product.stock_minimo}</td>
                      <td className="currency" style={{ color: '#ef4444' }}>
                        -{faltante}
                      </td>
                      <td>
                        <button
                          className="btn btn-primary btn-xs"
                          onClick={() => navigate('/purchases')}
                        >
                          Abastecer
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-header">
            <h3>{t('sale_plural')} Mensuales</h3>
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.monthlySummary}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="mes" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                  }}
                  formatter={(value) => [formatCurrency(value), 'Total']}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ fill: '#6366f1', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#6366f1' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h3>{t('product_plural')} por {t('category')}</h3>
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.productsByCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="nombre"
                >
                  {data.productsByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="bottom-grid">
        <div className="table-card">
          <div className="table-card-header">
            <h3>{t('product_plural')} Más Vendidos</h3>
          </div>
          <div className="table-card-body">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('product')}</th>
                  <th>{t('sku')}</th>
                  <th>Vendidos</th>
                  <th>Ingresos</th>
                </tr>
              </thead>
              <tbody>
                {data.topProducts.map((product, index) => (
                  <tr key={index}>
                    <td className="product-cell">
                      <div className="product-rank">{index + 1}</div>
                      {product.nombre}
                    </td>
                    <td><code>{product.sku}</code></td>
                    <td>{product.total_vendido}</td>
                    <td className="currency">{formatCurrency(product.total_ingresos)}</td>
                  </tr>
                ))}
                {data.topProducts.length === 0 && (
                  <tr><td colSpan={4} className="empty-cell">No hay ventas registradas</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="table-card">
          <div className="table-card-header">
            <h3>{t('sale_plural')} Recientes</h3>
          </div>
          <div className="table-card-body">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Cliente</th>
                  <th>Items</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {data.recentSales.map((sale) => (
                  <tr key={sale.id}>
                    <td>#{sale.id}</td>
                    <td>{sale.customer_name || 'Sin cliente'}</td>
                    <td>{sale.total_items}</td>
                    <td className="currency">{formatCurrency(sale.total)}</td>
                  </tr>
                ))}
                {data.recentSales.length === 0 && (
                  <tr><td colSpan={4} className="empty-cell">No hay ventas recientes</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
