const express = require('express');
const { queryAll, queryOne } = require('../database');

const router = express.Router();

// GET /api/dashboard/stats
router.get('/stats', async (req, res) => {
  try {
    const business_id = req.user.business_id;
    const b = business_id;

    // Single query for overview stats
    const overview = await queryOne(`
      SELECT
        (SELECT COUNT(*)::int FROM products WHERE business_id = $1) as "totalProducts",
        (SELECT COUNT(*)::int FROM categories WHERE business_id = $2) as "totalCategories",
        (SELECT COUNT(*)::int FROM customers WHERE business_id = $3) as "totalCustomers",
        (SELECT COUNT(*)::int FROM suppliers WHERE business_id = $4) as "totalSuppliers",
        (SELECT COUNT(*)::int FROM products WHERE business_id = $5 AND stock <= stock_minimo) as "lowStockCount",
        (SELECT COALESCE(SUM(stock * costo), 0) FROM products WHERE business_id = $6) as "totalInversion",
        (SELECT COALESCE(SUM(stock * precio), 0) FROM products WHERE business_id = $7) as "valorVenta",
        (SELECT COALESCE(SUM(total), 0) FROM sales WHERE business_id = $8) as "totalIngresos"
    `, [b, b, b, b, b, b, b, b]);

    // Total sales count & average
    const totalSales = await queryOne(
      'SELECT COUNT(*)::int as count, COALESCE(AVG(total), 0) as promedio FROM sales WHERE business_id = $1',
      [b]
    );

    // Recent sales (last 7)
    const recentSales = await queryAll(
      `SELECT s.*, c.nombre as customer_name,
         (SELECT COUNT(*)::int FROM sale_items si WHERE si.sale_id = s.id) as total_items
       FROM sales s
       LEFT JOIN customers c ON s.customer_id = c.id
       WHERE s.business_id = $1
       ORDER BY s.created_at DESC LIMIT 7`,
      [b]
    );

    // Products by category
    const productsByCategory = await queryAll(
      `SELECT c.nombre, COUNT(p.id)::int as count
       FROM categories c
       LEFT JOIN products p ON c.id = p.category_id
       WHERE c.business_id = $1
       GROUP BY c.id ORDER BY count DESC`,
      [b]
    );

    // Top products (by sales)
    const topProducts = await queryAll(
      `SELECT p.nombre, p.sku, SUM(si.cantidad)::int as total_vendido, SUM(si.subtotal) as total_ingresos
       FROM sale_items si
       JOIN products p ON si.product_id = p.id AND p.business_id = $1
       GROUP BY si.product_id, p.nombre, p.sku
       ORDER BY total_vendido DESC LIMIT 5`,
      [b]
    );

    // Monthly summary (last 6 months)
    const monthlySummary = await queryAll(
      `SELECT TO_CHAR(created_at, 'YYYY-MM') as mes,
         COUNT(*)::int as ventas,
         COALESCE(SUM(total), 0) as total
       FROM sales
       WHERE business_id = $1 AND created_at >= NOW() - INTERVAL '6 months'
       GROUP BY TO_CHAR(created_at, 'YYYY-MM')
       ORDER BY mes ASC`,
      [b]
    );

    res.json({
      totalProducts: overview.totalProducts,
      totalCategories: overview.totalCategories,
      totalCustomers: overview.totalCustomers,
      totalSuppliers: overview.totalSuppliers,
      totalInversion: parseFloat(overview.totalInversion),
      valorVenta: parseFloat(overview.valorVenta),
      gananciaPotencial: parseFloat(overview.valorVenta) - parseFloat(overview.totalInversion),
      totalSales: totalSales.count,
      totalIngresos: parseFloat(overview.totalIngresos),
      promedioVenta: parseFloat(totalSales.promedio),
      lowStockCount: overview.lowStockCount,
      recentSales,
      productsByCategory,
      topProducts,
      monthlySummary
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
