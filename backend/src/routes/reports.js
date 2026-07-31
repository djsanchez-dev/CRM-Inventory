const express = require('express');
const { queryAll, queryOne } = require('../database');

const router = express.Router();

/**
 * Build a parameterized date filter WHERE clause with correct $N indices.
 * @param {number} startIdx - The starting $N index for parameters
 * @param {string|null} startDate - Optional start date
 * @param {string|null} endDate - Optional end date
 * @param {string} prefix - Table alias prefix (e.g. 'p.', 'sa.')
 * @returns {{ where: string, params: Array }}
 */
function buildDateFilters(startIdx, startDate, endDate, prefix = '') {
  const parts = [];
  const params = [];
  let idx = startIdx;

  if (startDate) {
    parts.push(`${prefix}created_at::DATE >= $${idx}::DATE`);
    params.push(startDate);
    idx++;
  }
  if (endDate) {
    parts.push(`${prefix}created_at::DATE <= $${idx}::DATE`);
    params.push(endDate);
    idx++;
  }

  return {
    where: parts.length > 0 ? ' AND ' + parts.join(' AND ') : '',
    params,
  };
}

// GET /api/reports/supplier-spending
router.get('/supplier-spending', async (req, res) => {
  try {
    const business_id = req.user.business_id;
    const { startDate, endDate } = req.query;

    // ========================================
    // 1. Spending by supplier
    // Fixed params: $1=LEFT JOIN business_id, $2=WHERE business_id
    // Dynamic: $3+
    // ========================================
    const pf1 = buildDateFilters(3, startDate, endDate, 'p.');
    const spendingBySupplier = await queryAll(`
      SELECT
        s.id, s.nombre, s.contacto, s.email, s.telefono,
        COALESCE(SUM(p.total), 0) as total_gastado,
        COALESCE(SUM(p.cantidad), 0)::int as total_productos,
        COUNT(p.id)::int as num_compras,
        COALESCE(AVG(p.costo_unitario), 0) as costo_promedio,
        MAX(p.created_at) as ultima_compra,
        MIN(p.created_at) as primera_compra
      FROM suppliers s
      LEFT JOIN purchases p ON s.id = p.supplier_id AND p.business_id = $1
      WHERE s.business_id = $2${pf1.where}
      GROUP BY s.id
      HAVING COUNT(p.id) > 0
      ORDER BY total_gastado DESC
    `, [business_id, business_id, ...pf1.params]);

    // ========================================
    // 2. Monthly spending by supplier (last 12 months)
    // Fixed params: $1=business_id(p), $2=business_id(s)
    // Dynamic: $3+
    // ========================================
    const pf2 = buildDateFilters(3, startDate, endDate, 'p.');
    const monthlySpending = await queryAll(`
      SELECT
        TO_CHAR(p.created_at, 'YYYY-MM') as mes,
        s.id as supplier_id,
        s.nombre as supplier_name,
        COALESCE(SUM(p.total), 0) as total
      FROM purchases p
      JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.business_id = $1 AND s.business_id = $2
        AND p.created_at >= NOW() - INTERVAL '12 months'${pf2.where}
      GROUP BY TO_CHAR(p.created_at, 'YYYY-MM'), s.id, s.nombre
      ORDER BY mes ASC
    `, [business_id, business_id, ...pf2.params]);

    // ========================================
    // 3. Top products purchased (by supplier)
    // Fixed params: $1=b(purchases), $2=b(suppliers), $3=b(products)
    // Dynamic: $4+
    // ========================================
    const pf3 = buildDateFilters(4, startDate, endDate, 'p.');
    const topProducts = await queryAll(`
      SELECT
        s.id as supplier_id, s.nombre as supplier_name,
        pr.nombre as product_name, pr.sku,
        COALESCE(SUM(p.cantidad), 0)::int as total_comprado,
        COALESCE(SUM(p.total), 0) as total_gastado
      FROM purchases p
      JOIN suppliers s ON p.supplier_id = s.id
      JOIN products pr ON p.product_id = pr.id
      WHERE p.business_id = $1 AND s.business_id = $2
        AND pr.business_id = $3${pf3.where}
      GROUP BY s.id, s.nombre, pr.id, pr.nombre, pr.sku
      ORDER BY total_gastado DESC
      LIMIT 20
    `, [business_id, business_id, business_id, ...pf3.params]);

    // ========================================
    // 4. Totals
    // Fixed params: $1=business_id
    // Dynamic: $2+
    // ========================================
    const pf4 = buildDateFilters(2, startDate, endDate, 'p.');
    const totalsArr = await queryAll(`
      SELECT
        COALESCE(SUM(total), 0) as total_general,
        COALESCE(SUM(cantidad), 0)::int as total_productos,
        COUNT(*)::int as total_compras,
        COUNT(DISTINCT supplier_id)::int as total_proveedores
      FROM purchases p
      WHERE p.business_id = $1 AND p.supplier_id IS NOT NULL${pf4.where}
    `, [business_id, ...pf4.params]);

    // ========================================
    // 5. Supplier Comparison (purchases vs sales)
    // Outer: $1=b(purchases sub), $2=b(product-supplier sub), $3=b(products), $4=b(suppliers WHERE)
    // Inner subqueries can reference outer params.
    // Dynamic purchase filters start at $5 (purchaseParams)
    // Dynamic sale filters start after purchase params
    // ========================================
    const pf5 = buildDateFilters(5, startDate, endDate, 'p.');
    const sf5 = buildDateFilters(5 + pf5.params.length, startDate, endDate, 'sa.');
    
    const supplierComparison = await queryAll(`
      SELECT
        s.id, s.nombre,
        COALESCE(purchases.total_gastado, 0) as total_gastado,
        COALESCE(purchases.total_productos, 0)::int as total_productos_comprados,
        COALESCE(sales.total_vendido, 0) as total_vendido,
        COALESCE(sales.total_vendidos, 0)::int as total_productos_vendidos,
        COALESCE(sales.total_vendido, 0) - COALESCE(purchases.total_gastado, 0) as margen,
        CASE
          WHEN COALESCE(purchases.total_gastado, 0) > 0
          THEN ROUND((COALESCE(sales.total_vendido, 0) - COALESCE(purchases.total_gastado, 0)) / NULLIF(COALESCE(purchases.total_gastado, 0), 0) * 100, 1)
          ELSE 0
        END as margen_porcentaje
      FROM suppliers s
      LEFT JOIN (
        SELECT p.supplier_id, SUM(p.total) as total_gastado, SUM(p.cantidad) as total_productos
        FROM purchases p
        WHERE p.business_id = $1 AND p.supplier_id IS NOT NULL${pf5.where}
        GROUP BY p.supplier_id
      ) purchases ON s.id = purchases.supplier_id
      LEFT JOIN (
        SELECT pu.supplier_id,
          SUM(si.subtotal) as total_vendido, SUM(si.cantidad) as total_vendidos
        FROM sale_items si
        JOIN sales sa ON si.sale_id = sa.id
        JOIN products pr ON si.product_id = pr.id
        LEFT JOIN (
          SELECT product_id, supplier_id
          FROM purchases
          WHERE business_id = $2 AND supplier_id IS NOT NULL
          GROUP BY product_id, supplier_id
        ) pu ON pu.product_id = pr.id
        WHERE pr.business_id = $3
          AND pu.supplier_id IS NOT NULL${sf5.where}
        GROUP BY pu.supplier_id
      ) sales ON s.id = sales.supplier_id
      WHERE s.business_id = $4
        AND (COALESCE(purchases.total_gastado, 0) > 0 OR COALESCE(sales.total_vendido, 0) > 0)
      ORDER BY margen DESC
    `, [business_id, business_id, business_id, business_id, ...pf5.params, ...sf5.params]);

    // ========================================
    // 6. Monthly Profitability trend (last 12 months)
    // Subqueries in months UNION can reference outer $1-$4
    // Dynamic: purchase params start after $4, sale params after purchase params
    // ========================================
    const pf6 = buildDateFilters(5, startDate, endDate, 'p.');
    const sf6 = buildDateFilters(5 + pf6.params.length, startDate, endDate, 'sa.');

    const monthlyProfitability = await queryAll(`
      SELECT
        meses.mes,
        COALESCE(purchases.total_gastado, 0) as total_gastado,
        COALESCE(purchases.total_productos, 0)::int as productos_comprados,
        COALESCE(sales.total_vendido, 0) as total_vendido,
        COALESCE(sales.num_ventas, 0)::int as num_ventas,
        COALESCE(sales.total_vendido, 0) - COALESCE(purchases.total_gastado, 0) as margen,
        CASE
          WHEN COALESCE(purchases.total_gastado, 0) > 0
          THEN ROUND((COALESCE(sales.total_vendido, 0) - COALESCE(purchases.total_gastado, 0)) / NULLIF(COALESCE(purchases.total_gastado, 0), 0) * 100, 1)
          ELSE 0
        END as margen_porcentaje
      FROM (
        SELECT DISTINCT TO_CHAR(created_at, 'YYYY-MM') as mes
        FROM purchases WHERE business_id = $1 AND created_at >= NOW() - INTERVAL '12 months'
        UNION
        SELECT DISTINCT TO_CHAR(created_at, 'YYYY-MM') as mes
        FROM sales WHERE business_id = $2 AND created_at >= NOW() - INTERVAL '12 months'
      ) meses
      LEFT JOIN (
        SELECT TO_CHAR(p.created_at, 'YYYY-MM') as mes,
          COALESCE(SUM(p.total), 0) as total_gastado,
          COALESCE(SUM(p.cantidad), 0) as total_productos
        FROM purchases p
        WHERE p.business_id = $3
          AND p.created_at >= NOW() - INTERVAL '12 months'${pf6.where}
        GROUP BY TO_CHAR(p.created_at, 'YYYY-MM')
      ) purchases ON meses.mes = purchases.mes
      LEFT JOIN (
        SELECT TO_CHAR(sa.created_at, 'YYYY-MM') as mes,
          COALESCE(SUM(si.subtotal), 0) as total_vendido,
          COUNT(DISTINCT sa.id)::int as num_ventas
        FROM sales sa
        JOIN sale_items si ON sa.id = si.sale_id
        WHERE sa.business_id = $4
          AND sa.created_at >= NOW() - INTERVAL '12 months'${sf6.where}
        GROUP BY TO_CHAR(sa.created_at, 'YYYY-MM')
      ) sales ON meses.mes = sales.mes
      ORDER BY meses.mes ASC
    `, [business_id, business_id, business_id, business_id, ...pf6.params, ...sf6.params]);

    // ========================================
    // 7. Product profitability
    // Simple — no date filters
    // ========================================
    const productProfitability = await queryAll(`
      SELECT
        pr.id, pr.nombre, pr.sku, pr.costo, pr.precio, pr.stock, pr.stock_minimo,
        c.nombre as category_name,
        ROUND((pr.precio - pr.costo)::numeric, 2) as margen_unitario,
        CASE
          WHEN pr.costo > 0 AND pr.costo IS NOT NULL
          THEN ROUND((pr.precio - pr.costo) / pr.costo * 100, 1)
          ELSE 0
        END as margen_porcentaje,
        ROUND((pr.stock * pr.costo)::numeric, 2) as valor_inventario,
        ROUND((pr.stock * pr.precio)::numeric, 2) as valor_venta,
        ROUND((pr.stock * (pr.precio - pr.costo))::numeric, 2) as ganancia_potencial
      FROM products pr
      LEFT JOIN categories c ON pr.category_id = c.id
      WHERE pr.business_id = $1
      ORDER BY margen_porcentaje DESC
    `, [business_id]);

    // ========================================
    // 8. Product sales stats — merge with profitability
    // ========================================
    const productSalesStats = await queryAll(`
      SELECT
        p.id as product_id,
        COALESCE(SUM(si.cantidad), 0)::int as total_vendido,
        COALESCE(SUM(si.subtotal), 0) as total_ingresos,
        COALESCE(COUNT(DISTINCT si.sale_id), 0)::int as num_ventas
      FROM products p
      LEFT JOIN sale_items si ON p.id = si.product_id
      WHERE p.business_id = $1
      GROUP BY p.id
    `, [business_id]);

    // Merge sales stats into product profitability
    const salesMap = {};
    for (const stat of productSalesStats) {
      salesMap[stat.product_id] = stat;
    }
    for (const prod of productProfitability) {
      const stat = salesMap[prod.id];
      prod.total_vendido = stat ? stat.total_vendido : 0;
      prod.total_ingresos = stat ? parseFloat(stat.total_ingresos) : 0;
      prod.num_ventas = stat ? stat.num_ventas : 0;
    }

    res.json({
      spendingBySupplier,
      monthlySpending,
      topProducts,
      supplierComparison,
      monthlyProfitability,
      productProfitability,
      totals: totalsArr[0] || {
        total_general: 0, total_productos: 0, total_compras: 0, total_proveedores: 0,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/reports/services
// Services report (carwash + mechanic): totals by type, daily trend, top services
router.get('/services', async (req, res) => {
  try {
    const business_id = req.user.business_id;
    const { startDate, endDate } = req.query;

    // Dynamic date filter params start after $1
    const pf = buildDateFilters(2, startDate, endDate, 's.');

    const totals = await queryAll(
      `SELECT
        COUNT(*)::int as total_servicios,
        COALESCE(SUM(s.precio), 0) as ingreso_total,
        COALESCE(SUM(CASE WHEN s.tipo = 'carwash' THEN 1 ELSE 0 END), 0)::int as carwash_count,
        COALESCE(SUM(CASE WHEN s.tipo = 'carwash' THEN s.precio ELSE 0 END), 0) as carwash_ingreso,
        COALESCE(SUM(CASE WHEN s.tipo = 'mecanica' THEN 1 ELSE 0 END), 0)::int as mecanica_count,
        COALESCE(SUM(CASE WHEN s.tipo = 'mecanica' THEN s.precio ELSE 0 END), 0) as mecanica_ingreso
       FROM services s
       WHERE s.business_id = $1${pf.where}`,
      [business_id, ...pf.params]
    );

    const byTipo = await queryAll(
      `SELECT s.tipo, COUNT(*)::int as total, COALESCE(SUM(s.precio), 0) as ingreso
       FROM services s
       WHERE s.business_id = $1${pf.where}
       GROUP BY s.tipo`,
      [business_id, ...pf.params]
    );

    // Daily trend (grouped by date)
    // ::TEXT keeps the value as 'YYYY-MM-DD' string in BOTH engines
    // (PG DATE → 'YYYY-MM-DD', SQLite date() → 'YYYY-MM-DD')
    const dailyTrend = await queryAll(
      `SELECT s.created_at::DATE::TEXT as fecha,
         COUNT(*)::int as total,
         COALESCE(SUM(s.precio), 0) as ingreso
       FROM services s
       WHERE s.business_id = $1${pf.where}
       GROUP BY s.created_at::DATE::TEXT
       ORDER BY fecha ASC`,
      [business_id, ...pf.params]
    );

    const topServices = await queryAll(
      `SELECT s.nombre, s.tipo, COUNT(*)::int as total, COALESCE(SUM(s.precio), 0) as ingreso
       FROM services s
       WHERE s.business_id = $1${pf.where}
       GROUP BY s.nombre, s.tipo
       ORDER BY total DESC, ingreso DESC
       LIMIT 10`,
      [business_id, ...pf.params]
    );

    res.json({
      totals: totals[0] || {
        total_servicios: 0, ingreso_total: 0, carwash_count: 0, carwash_ingreso: 0,
        mecanica_count: 0, mecanica_ingreso: 0,
      },
      byTipo,
      dailyTrend,
      topServices,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
