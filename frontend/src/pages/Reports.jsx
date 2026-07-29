import { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { FileDown, FileText, Dollar, Package, ShoppingCart, Trending, Truck, TrendingDown } from '../components/Icons';
import DateRangeFilter from '../components/DateRangeFilter';
import { exportReportsCSV, exportReportsPDF } from '../utils/export';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#f97316', '#14b8a6'];

export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState({ startDate: '', endDate: '' });

  const buildParams = () => {
    const params = new URLSearchParams();
    if (dateFilter.startDate) params.set('startDate', dateFilter.startDate);
    if (dateFilter.endDate) params.set('endDate', dateFilter.endDate);
    const qs = params.toString();
    return qs ? `?${qs}` : '';
  };

  useEffect(() => {
    loadData();
  }, [dateFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await api.getSupplierSpending(buildParams());
      setData(result);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value);

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading && !data) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="loading-container">
        <p>Error al cargar los reportes</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="toolbar">
        <div className="toolbar-info">
          <span>Reportes de gastos por proveedor</span>
        </div>

        <div className="toolbar-filters">
          <DateRangeFilter onFilter={(f) => setDateFilter(f)} />
          <div className="export-buttons">
            <button
              className="btn btn-export"
              onClick={() => exportReportsCSV(data)}
              disabled={data.spendingBySupplier.length === 0}
              title="Exportar a CSV"
            >
              <FileDown size={18} />
              <span>CSV</span>
            </button>
            <button
              className="btn btn-export pdf"
              onClick={() => exportReportsPDF(data, dateFilter)}
              disabled={data.spendingBySupplier.length === 0}
              title="Exportar a PDF"
            >
              <FileText size={18} />
              <span>PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid">
        <div className="stat-card" style={{ cursor: 'default' }}>
          <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
            <Dollar size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Gastado</span>
            <span className="stat-value">{formatCurrency(data.totals.total_general)}</span>
          </div>
        </div>
        <div className="stat-card" style={{ cursor: 'default' }}>
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <ShoppingCart size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Compras</span>
            <span className="stat-value">{data.totals.total_compras}</span>
          </div>
        </div>
        <div className="stat-card" style={{ cursor: 'default' }}>
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
            <Package size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Productos</span>
            <span className="stat-value">{data.totals.total_productos}</span>
          </div>
        </div>
        <div className="stat-card" style={{ cursor: 'default' }}>
          <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
            <Truck size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Proveedores</span>
            <span className="stat-value">{data.totals.total_proveedores}</span>
          </div>
        </div>
      </div>

      {/* Monthly Profitability Trend */}
      {data.monthlyProfitability && data.monthlyProfitability.length > 0 && (
        <div className="chart-card" style={{ marginBottom: 24 }}>
          <div className="chart-header">
            <h3>Tendencia Mensual de Rentabilidad</h3>
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={data.monthlyProfitability} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="mes" stroke="#9ca3af" fontSize={12} />
                <YAxis yAxisId="left" stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                  }}
                  formatter={(value, name) => {
                    if (name === 'total_gastado') return [formatCurrency(value), 'Gastado'];
                    if (name === 'total_vendido') return [formatCurrency(value), 'Vendido'];
                    if (name === 'margen_porcentaje') return [`${value}%`, 'Margen %'];
                    if (name === 'margen') return [formatCurrency(value), 'Margen'];
                    return [value, name];
                  }}
                />
                <Legend
                  formatter={(value) => {
                    if (value === 'total_gastado') return 'Gastado';
                    if (value === 'total_vendido') return 'Vendido';
                    if (value === 'margen_porcentaje') return 'Margen %';
                    return value;
                  }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="total_gastado"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#ef4444' }}
                  name="total_gastado"
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="total_vendido"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#10b981' }}
                  name="total_vendido"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="margen_porcentaje"
                  stroke="#6366f1"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#6366f1' }}
                  name="margen_porcentaje"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="charts-grid">
        {/* Bar Chart - Spending by Supplier */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Gastos por Proveedor</h3>
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={data.spendingBySupplier} margin={{ top: 10, right: 10, left: 10, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="nombre"
                  stroke="#9ca3af"
                  fontSize={11}
                  angle={-25}
                  textAnchor="end"
                  interval={0}
                  height={80}
                />
                <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                  }}
                  formatter={(value) => [formatCurrency(value), 'Gastado']}
                />
                <Bar dataKey="total_gastado" fill="#6366f1" radius={[6, 6, 0, 0]}>
                  {data.spendingBySupplier.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart - Spending Distribution */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Distribución de Gastos</h3>
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={data.spendingBySupplier}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={110}
                  paddingAngle={4}
                  dataKey="total_gastado"
                  nameKey="nombre"
                >
                  {data.spendingBySupplier.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  formatter={(value, name) => [formatCurrency(value), name]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Supplier Spending Table */}
      <div className="table-card" style={{ marginBottom: 24 }}>
        <div className="table-card-header">
          <h3>Detalle de Gastos por Proveedor</h3>
        </div>
        <div className="table-card-body">
          <table className="data-table">
            <thead>
              <tr>
                <th>Proveedor</th>
                <th>Contacto</th>
                <th>Compras</th>
                <th>Productos</th>
                <th>Costo Prom.</th>
                <th>Total Gastado</th>
                <th>Primera Compra</th>
                <th>Última Compra</th>
              </tr>
            </thead>
            <tbody>
              {data.spendingBySupplier.map((supplier) => (
                <tr key={supplier.id}>
                  <td>
                    <div className="product-name-cell">
                      <div className="product-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                        <Truck size={16} />
                      </div>
                      <span className="product-name">{supplier.nombre}</span>
                    </div>
                  </td>
                  <td>{supplier.contacto || '—'}</td>
                  <td><span className="qty-badge">{supplier.num_compras}</span></td>
                  <td><span className="qty-badge">{supplier.total_productos}</span></td>
                  <td className="currency">{formatCurrency(supplier.costo_promedio)}</td>
                  <td className="currency">{formatCurrency(supplier.total_gastado)}</td>
                  <td>{formatDate(supplier.primera_compra)}</td>
                  <td>{formatDate(supplier.ultima_compra)}</td>
                </tr>
              ))}
              {data.spendingBySupplier.length === 0 && (
                <tr>
                  <td colSpan={8} className="empty-cell">
                    <div className="empty-state">
                      <TrendingUp size={48} />
                      <h3>No hay datos de gastos</h3>
                      <p>Registra compras con proveedores para ver los reportes</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gastos vs Ventas (comparativa) */}
      {data.supplierComparison.length > 0 && (
        <>
          <div className="charts-grid">
            {/* Combined Bar Chart */}
            <div className="chart-card">
              <div className="chart-header">
                <h3>Gastos vs Ventas por Proveedor</h3>
              </div>
              <div className="chart-body">
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={data.supplierComparison} margin={{ top: 10, right: 10, left: 10, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="nombre"
                      stroke="#9ca3af"
                      fontSize={11}
                      angle={-25}
                      textAnchor="end"
                      interval={0}
                      height={80}
                    />
                    <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{
                        background: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                      }}
                      formatter={(value, name) => {
                        if (name === 'total_gastado') return [formatCurrency(value), 'Gastado'];
                        if (name === 'total_vendido') return [formatCurrency(value), 'Vendido'];
                        return [value, name];
                      }}
                    />
                    <Legend
                      formatter={(value) => {
                        if (value === 'total_gastado') return 'Gastado';
                        if (value === 'total_vendido') return 'Vendido';
                        return value;
                      }}
                    />
                    <Bar dataKey="total_gastado" fill="#ef4444" radius={[4, 4, 0, 0]} name="total_gastado" />
                    <Bar dataKey="total_vendido" fill="#10b981" radius={[4, 4, 0, 0]} name="total_vendido" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Margin Chart */}
            <div className="chart-card">
              <div className="chart-header">
                <h3>Margen de Ganancia por Proveedor</h3>
              </div>
              <div className="chart-body">
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={data.supplierComparison} margin={{ top: 10, right: 10, left: 10, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="nombre"
                      stroke="#9ca3af"
                      fontSize={11}
                      angle={-25}
                      textAnchor="end"
                      interval={0}
                      height={80}
                    />
                    <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `${v}%`} />
                    <Tooltip
                      contentStyle={{
                        background: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                      }}
                      formatter={(value) => [`${value}%`, 'Margen']}
                    />
                    <Bar
                      dataKey="margen_porcentaje"
                      radius={[6, 6, 0, 0]}
                      name="margen_porcentaje"
                    >
                      {data.supplierComparison.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.margen_porcentaje >= 0 ? '#10b981' : '#ef4444'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="table-card" style={{ marginBottom: 24 }}>
            <div className="table-card-header">
              <h3>Comparativa Gastos vs Ventas</h3>
            </div>
            <div className="table-card-body">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Proveedor</th>
                    <th>Total Gastado</th>
                    <th>Productos Comp.</th>
                    <th>Total Vendido</th>
                    <th>Productos Vend.</th>
                    <th>Margen</th>
                    <th>% Margen</th>
                  </tr>
                </thead>
                <tbody>
                  {data.supplierComparison.map((supplier) => (
                    <tr key={supplier.id}>
                      <td>
                        <div className="product-name-cell">
                          <div className="product-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                            <Truck size={16} />
                          </div>
                          <span className="product-name">{supplier.nombre}</span>
                        </div>
                      </td>
                      <td className="currency" style={{ color: '#ef4444' }}>{formatCurrency(supplier.total_gastado)}</td>
                      <td><span className="qty-badge">{supplier.total_productos_comprados}</span></td>
                      <td className="currency" style={{ color: '#10b981' }}>{formatCurrency(supplier.total_vendido)}</td>
                      <td><span className="qty-badge">{supplier.total_productos_vendidos}</span></td>
                      <td className={`currency ${supplier.margen >= 0 ? '' : 'text-danger'}`}
                        style={{ color: supplier.margen >= 0 ? '#10b981' : '#ef4444' }}>
                        {supplier.margen >= 0 ? '+' : ''}{formatCurrency(supplier.margen)}
                      </td>
                      <td>
                        <span className={`badge ${supplier.margen_porcentaje >= 0 ? 'badge-efectivo' : 'badge-tarjeta'}`}
                          style={{
                            background: supplier.margen_porcentaje >= 0
                              ? 'rgba(16, 185, 129, 0.12)'
                              : 'rgba(239, 68, 68, 0.12)',
                            color: supplier.margen_porcentaje >= 0 ? '#10b981' : '#ef4444',
                          }}>
                          {supplier.margen_porcentaje >= 0 ? (
                            <TrendingUp size={12} style={{ marginRight: 4 }} />
                          ) : (
                            <TrendingDown size={12} style={{ marginRight: 4 }} />
                          )}
                          {supplier.margen_porcentaje >= 0 ? '+' : ''}{supplier.margen_porcentaje}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Product Profitability */}
      {data.productProfitability && data.productProfitability.length > 0 && (
        <>
          {/* Profitability KPIs */}
          {(() => {
            const products = data.productProfitability;
            const total = products.length;
            const avgMargin = products.reduce((s, p) => s + p.margen_porcentaje, 0) / total;
            const best = products.reduce((a, b) => a.margen_porcentaje > b.margen_porcentaje ? a : b);
            const worst = products.reduce((a, b) => a.margen_porcentaje < b.margen_porcentaje ? a : b);
            const positiveCount = products.filter(p => p.margen_porcentaje >= 0).length;
            const negativeCount = products.filter(p => p.margen_porcentaje < 0).length;
            const totalPotentialProfit = products.reduce((s, p) => s + p.ganancia_potencial, 0);
            return (
              <div className="financial-cards" style={{ marginBottom: 24 }}>
                <div className="fin-card ingresos">
                  <div className="fin-icon"><Trending size={20} /></div>
                  <div className="fin-info">
                    <span className="fin-label">Margen Promedio</span>
                    <span className="fin-value" style={{ color: avgMargin >= 0 ? '#10b981' : '#ef4444' }}>
                      {avgMargin >= 0 ? '+' : ''}{avgMargin.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="fin-card ok">
                  <div className="fin-icon"><Package size={20} /></div>
                  <div className="fin-info">
                    <span className="fin-label">Producto + Rentable</span>
                    <span className="fin-value" style={{ fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {best.nombre}
                    </span>
                    <span className="fin-label" style={{ fontSize: '0.72rem' }}>
                      {best.margen_porcentaje >= 0 ? '+' : ''}{best.margen_porcentaje}% · {formatCurrency(best.margen_unitario)}/ud
                    </span>
                  </div>
                </div>
                <div className="fin-card alerta">
                  <div className="fin-icon"><TrendingDown size={20} /></div>
                  <div className="fin-info">
                    <span className="fin-label">Producto - Rentable</span>
                    <span className="fin-value" style={{ fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {worst.nombre}
                    </span>
                    <span className="fin-label" style={{ fontSize: '0.72rem' }}>
                      {worst.margen_porcentaje >= 0 ? '+' : ''}{worst.margen_porcentaje}% · {formatCurrency(worst.margen_unitario)}/ud
                    </span>
                  </div>
                </div>
                <div className="fin-card ganancia">
                  <div className="fin-icon"><Dollar size={20} /></div>
                  <div className="fin-info">
                    <span className="fin-label">Ganancia Potencial Total</span>
                    <span className="fin-value">{formatCurrency(totalPotentialProfit)}</span>
                    <span className="fin-label" style={{ fontSize: '0.72rem' }}>
                      {positiveCount} productos con margen positivo · {negativeCount} con margen negativo
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

          <div className="charts-grid">
            {/* Margin by Product */}
            <div className="chart-card">
              <div className="chart-header">
                <h3>Margen de Ganancia por Producto</h3>
              </div>
              <div className="chart-body">
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart
                    data={data.productProfitability.slice(0, 10)}
                    margin={{ top: 10, right: 10, left: 10, bottom: 60 }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `${v}%`} />
                    <YAxis
                      type="category"
                      dataKey="nombre"
                      stroke="#9ca3af"
                      fontSize={11}
                      width={160}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                      }}
                      formatter={(value, name) => [`${value}%`, 'Margen']}
                    />
                    <Bar dataKey="margen_porcentaje" radius={[0, 6, 6, 0]}>
                      {data.productProfitability.slice(0, 10).map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.margen_porcentaje >= 0 ? '#10b981' : '#ef4444'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Cost vs Price by Category */}
            <div className="chart-card">
              <div className="chart-header">
                <h3>Costo vs Precio de Venta</h3>
              </div>
              <div className="chart-body">
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={data.productProfitability.slice(0, 10)} margin={{ top: 10, right: 10, left: 10, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="nombre"
                      stroke="#9ca3af"
                      fontSize={10}
                      angle={-25}
                      textAnchor="end"
                      interval={0}
                      height={80}
                    />
                    <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `$${v}`} />
                    <Tooltip
                      contentStyle={{
                        background: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                      }}
                      formatter={(value, name) => {
                        if (name === 'costo') return [formatCurrency(value), 'Costo'];
                        if (name === 'precio') return [formatCurrency(value), 'Precio Venta'];
                        return [value, name];
                      }}
                    />
                    <Legend
                      formatter={(value) => {
                        if (value === 'costo') return 'Costo';
                        if (value === 'precio') return 'Precio Venta';
                        return value;
                      }}
                    />
                    <Bar dataKey="costo" fill="#f59e0b" radius={[4, 4, 0, 0]} name="costo" />
                    <Bar dataKey="precio" fill="#6366f1" radius={[4, 4, 0, 0]} name="precio" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Profitability Table */}
          <div className="table-card" style={{ marginBottom: 24 }}>
            <div className="table-card-header">
              <h3>Rentabilidad por Producto</h3>
            </div>
            <div className="table-card-body">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>SKU</th>
                    <th>Categoría</th>
                    <th>Costo</th>
                    <th>Precio Venta</th>
                    <th>Margen Unit.</th>
                    <th>% Margen</th>
                    <th>Stock</th>
                    <th>Valor Inventario</th>
                    <th>Ganancia Potencial</th>
                    <th>Vendidos</th>
                  </tr>
                </thead>
                <tbody>
                  {data.productProfitability.map((product) => (
                    <tr key={product.id}>
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
                      <td className="currency">{formatCurrency(product.costo)}</td>
                      <td className="currency">{formatCurrency(product.precio)}</td>
                      <td className="currency" style={{ color: product.margen_porcentaje >= 0 ? '#10b981' : '#ef4444' }}>
                        {product.margen_unitario > 0 ? '+' : ''}{formatCurrency(product.margen_unitario)}
                      </td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            background: product.margen_porcentaje >= 30
                              ? 'rgba(16, 185, 129, 0.12)'
                              : product.margen_porcentaje >= 0
                                ? 'rgba(245, 158, 11, 0.12)'
                                : 'rgba(239, 68, 68, 0.12)',
                            color: product.margen_porcentaje >= 30
                              ? '#10b981'
                              : product.margen_porcentaje >= 0
                                ? '#f59e0b'
                                : '#ef4444',
                          }}
                        >
                          {product.margen_porcentaje >= 0 ? '+' : ''}{product.margen_porcentaje}%
                        </span>
                      </td>
                      <td>
                        <span className={`stock-badge ${product.stock <= product.stock_minimo ? 'low' : 'ok'}`}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="currency">{formatCurrency(product.valor_inventario)}</td>
                      <td className="currency" style={{ color: '#10b981' }}>
                        {formatCurrency(product.ganancia_potencial)}
                      </td>
                      <td>{product.total_vendido}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Top Products Table */}
      {data.topProducts.length > 0 && (
        <div className="table-card">
          <div className="table-card-header">
            <h3>Productos Más Comprados por Proveedor</h3>
          </div>
          <div className="table-card-body">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Producto</th>
                  <th>SKU</th>
                  <th>Proveedor</th>
                  <th>Total Comprado</th>
                  <th>Total Gastado</th>
                </tr>
              </thead>
              <tbody>
                {data.topProducts.map((product, index) => (
                  <tr key={index}>
                    <td><span className="purchase-id">#{index + 1}</span></td>
                    <td>
                      <div className="product-name-cell">
                        <div className="product-icon">
                          <Package size={16} />
                        </div>
                        <span className="product-name">{product.product_name}</span>
                      </div>
                    </td>
                    <td><code>{product.sku}</code></td>
                    <td>
                      <span className="badge badge-supplier">
                        <Truck size={12} />
                        {product.supplier_name}
                      </span>
                    </td>
                    <td><span className="qty-badge">{product.total_comprado}</span></td>
                    <td className="currency">{formatCurrency(product.total_gastado)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
