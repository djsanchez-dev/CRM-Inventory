/* Test SQLite conversion of PostgreSQL-style queries used in routes */
const os = require('os');
const path = require('path');
const fs = require('fs');

// Force SQLite mode and point to an ISOLATED temp DB so the real
// local inventario.db (user data) is never touched by tests.
process.env.DATABASE_URL = '';
const tmpDb = path.join(os.tmpdir(), `crm-sqlite-test-${Date.now()}.db`);
process.env.SQLITE_DB_PATH = tmpDb;

const db = require('./src/database');

const overview = `SELECT
  (SELECT COUNT(*)::int FROM products WHERE business_id = $1) as "totalProducts",
  (SELECT COUNT(*)::int FROM categories WHERE business_id = $2) as "totalCategories",
  (SELECT COUNT(*)::int FROM customers WHERE business_id = $3) as "totalCustomers",
  (SELECT COUNT(*)::int FROM suppliers WHERE business_id = $4) as "totalSuppliers",
  (SELECT COUNT(*)::int FROM products WHERE business_id = $5 AND stock <= stock_minimo) as "lowStockCount",
  (SELECT COALESCE(SUM(stock * costo), 0) FROM products WHERE business_id = $6) as "totalInversion",
  (SELECT COALESCE(SUM(stock * precio), 0) FROM products WHERE business_id = $7) as "valorVenta",
  (SELECT COALESCE(SUM(total), 0) FROM sales WHERE business_id = $8) as "totalIngresos"
`;

const monthly = `SELECT TO_CHAR(created_at, 'YYYY-MM') as mes,
   COUNT(*)::int as ventas,
   COALESCE(SUM(total), 0) as total
 FROM sales
 WHERE business_id = $1 AND created_at >= NOW() - INTERVAL '6 months'
 GROUP BY TO_CHAR(created_at, 'YYYY-MM')
 ORDER BY mes ASC`;

const topProducts = `SELECT p.nombre, p.sku, SUM(si.cantidad)::int as total_vendido, SUM(si.subtotal) as total_ingresos
 FROM sale_items si
 JOIN products p ON si.product_id = p.id AND p.business_id = $1
 GROUP BY si.product_id, p.nombre, p.sku
 ORDER BY total_vendido DESC LIMIT 5`;

const supplierReport = `SELECT
    s.id, s.nombre, s.contacto, s.email, s.telefono,
    COALESCE(SUM(p.total), 0) as total_gastado,
    COALESCE(SUM(p.cantidad), 0)::int as total_productos,
    COUNT(p.id)::int as num_compras,
    COALESCE(AVG(p.costo_unitario), 0) as costo_promedio,
    MAX(p.created_at) as ultima_compra,
    MIN(p.created_at) as primera_compra
  FROM suppliers s
  LEFT JOIN purchases p ON s.id = p.supplier_id AND p.business_id = $1
  WHERE s.business_id = $2
    AND p.created_at::DATE >= $3::DATE
    AND p.created_at::DATE <= $4::DATE
  GROUP BY s.id
  HAVING COUNT(p.id) > 0
  ORDER BY total_gastado DESC`;

const monthlyProfitability = `SELECT
    meses.mes,
    COALESCE(purchases.total_gastado, 0) as total_gastado,
    COALESCE(sales.total_vendido, 0) as total_vendido
  FROM (
    SELECT DISTINCT TO_CHAR(created_at, 'YYYY-MM') as mes
    FROM purchases WHERE business_id = $1 AND created_at >= NOW() - INTERVAL '12 months'
    UNION
    SELECT DISTINCT TO_CHAR(created_at, 'YYYY-MM') as mes
    FROM sales WHERE business_id = $2 AND created_at >= NOW() - INTERVAL '12 months'
  ) meses
  LEFT JOIN (
    SELECT TO_CHAR(p.created_at, 'YYYY-MM') as mes,
      COALESCE(SUM(p.total), 0) as total_gastado
    FROM purchases p
    WHERE p.business_id = $3
      AND p.created_at >= NOW() - INTERVAL '12 months'
    GROUP BY TO_CHAR(p.created_at, 'YYYY-MM')
  ) purchases ON meses.mes = purchases.mes
  LEFT JOIN (
    SELECT TO_CHAR(sa.created_at, 'YYYY-MM') as mes,
      COALESCE(SUM(si.subtotal), 0) as total_vendido
    FROM sales sa
    JOIN sale_items si ON sa.id = si.sale_id
    WHERE sa.business_id = $4
      AND sa.created_at >= NOW() - INTERVAL '12 months'
    GROUP BY TO_CHAR(sa.created_at, 'YYYY-MM')
  ) sales ON meses.mes = sales.mes
  ORDER BY meses.mes ASC`;

const productProfitability = `SELECT
    pr.id, pr.nombre, pr.sku, pr.costo, pr.precio, pr.stock, pr.stock_minimo,
    ROUND((pr.precio - pr.costo)::numeric, 2) as margen_unitario,
    CASE
      WHEN pr.costo > 0 AND pr.costo IS NOT NULL
      THEN ROUND((pr.precio - pr.costo) / pr.costo * 100, 1)
      ELSE 0
    END as margen_porcentaje,
    ROUND((pr.stock * pr.costo)::numeric, 2) as valor_inventario
  FROM products pr
  WHERE pr.business_id = $1
  ORDER BY margen_porcentaje DESC`;

const searchQuery = `SELECT * FROM customers c
  WHERE c.business_id = $1
  AND (c.nombre ILIKE $2 OR c.email ILIKE $3 OR c.telefono ILIKE $4)`;

const dateFilter = `SELECT COUNT(*) as total FROM sales s
  WHERE s.business_id = $1
  AND s.created_at::DATE >= $2::DATE
  AND s.created_at::DATE <= $3::DATE`;

// Services list query — daily control (date filter + joins + casts)
const servicesList = `SELECT s.*, c.nombre as customer_name, c.telefono as customer_phone
  FROM services s
  LEFT JOIN customers c ON s.cliente_id = c.id
  WHERE s.business_id = $1 AND s.created_at::DATE = $2::DATE
  ORDER BY s.created_at DESC, s.id DESC
  LIMIT $3 OFFSET $4`;

// Services summary — GROUP BY tipo with CASE casts
const servicesSummary = `SELECT s.tipo,
    COUNT(*)::int as total,
    COALESCE(SUM(s.precio), 0) as ingreso
  FROM services s
  WHERE s.business_id = $1 AND s.created_at::DATE = $2::DATE
  GROUP BY s.tipo`;

// Services report — totals with CASE + date range
const servicesReport = `SELECT
    COUNT(*)::int as total_servicios,
    COALESCE(SUM(s.precio), 0) as ingreso_total,
    SUM(CASE WHEN s.tipo = 'carwash' THEN 1 ELSE 0 END)::int as carwash_count,
    SUM(CASE WHEN s.tipo = 'mecanica' THEN s.precio ELSE 0 END) as mecanica_ingreso
  FROM services s
  WHERE s.business_id = $1
  AND s.created_at::DATE >= $2::DATE
  AND s.created_at::DATE <= $3::DATE`;

// Services daily trend — ::DATE::TEXT double-cast → date() then TEXT stripped
const servicesDailyTrend = `SELECT s.created_at::DATE::TEXT as fecha,
    COUNT(*)::int as total,
    COALESCE(SUM(s.precio), 0) as ingreso
  FROM services s
  WHERE s.business_id = $1
  GROUP BY s.created_at::DATE::TEXT
  ORDER BY fecha ASC`;

// Sales list with tipo_pago filter
const salesWithTipoPago = `SELECT s.*, c.nombre as customer_name,
    (SELECT COUNT(*)::int FROM sale_items si WHERE si.sale_id = s.id) as total_items
  FROM sales s
  LEFT JOIN customers c ON s.customer_id = c.id
  WHERE s.business_id = $1 AND s.tipo_pago = $2
  ORDER BY s.created_at DESC
  LIMIT $3 OFFSET $4`;

// Purchases list with search + pagination + totals over filtered set
const purchasesSearchPaged = `SELECT p.*,
    s.nombre as supplier_name,
    pr.nombre as product_name,
    pr.sku as product_sku
  FROM purchases p
  LEFT JOIN suppliers s ON p.supplier_id = s.id
  LEFT JOIN products pr ON p.product_id = pr.id
  WHERE p.business_id = $1
    AND (pr.nombre ILIKE $2 OR pr.sku ILIKE $3 OR s.nombre ILIKE $4)
  ORDER BY p.created_at DESC
  LIMIT $5 OFFSET $6`;

const purchasesTotals = `SELECT
    COALESCE(SUM(p.cantidad), 0)::int as cantidad,
    COALESCE(SUM(p.total), 0) as total,
    COUNT(DISTINCT p.supplier_id)::int as proveedores
  FROM purchases p
  LEFT JOIN suppliers s ON p.supplier_id = s.id
  LEFT JOIN products pr ON p.product_id = pr.id
  WHERE p.business_id = $1
    AND (pr.nombre ILIKE $2 OR pr.sku ILIKE $3 OR s.nombre ILIKE $4)`;

// Customers list with has_points filter + dynamic ORDER BY alias
const customersFiltered = `SELECT c.*,
    COUNT(s.id)::int as total_compras,
    COALESCE(SUM(s.total), 0) as total_gastado
  FROM customers c
  LEFT JOIN sales s ON c.id = s.customer_id AND s.business_id = $1
  WHERE c.business_id = $1 AND c.puntos > 0
  GROUP BY c.id
  ORDER BY total_gastado DESC
  LIMIT $2 OFFSET $3`;

// Customers list query — $1 (business_id) is referenced TWICE (JOIN + WHERE).
// PostgreSQL allows re-referencing $1; SQLite requires one ? per occurrence,
// so params must be expanded. This validates the param-expansion fix.
const customersList = `SELECT c.*,
    COUNT(s.id)::int as total_compras,
    COALESCE(SUM(s.total), 0) as total_gastado
  FROM customers c
  LEFT JOIN sales s ON c.id = s.customer_id AND s.business_id = $1
  WHERE c.business_id = $1
  GROUP BY c.id
  ORDER BY c.nombre ASC
  LIMIT $2 OFFSET $3`;

// Suppliers list query — same repeated-$1 pattern
const suppliersList = `SELECT s.*,
    COALESCE(stats.total_invertido, 0) as total_invertido
  FROM suppliers s
  LEFT JOIN (
    SELECT supplier_id, SUM(total) as total_invertido
    FROM purchases
    WHERE supplier_id IS NOT NULL AND business_id = $1
    GROUP BY supplier_id
  ) stats ON s.id = stats.supplier_id
  WHERE s.business_id = $1
  ORDER BY s.nombre ASC
  LIMIT $2 OFFSET $3`;

// WITH ... SELECT — must route to all() and return rows
const withSelect = `WITH recent AS (
    SELECT id, total FROM sales WHERE business_id = $1
  )
  SELECT COUNT(*)::int as total FROM recent`;

// WITH ... UPDATE (no RETURNING) — must route to run(), not all()
const withUpdate = `WITH target AS (
    SELECT id FROM sales WHERE business_id = $1 AND total = $2
  )
  UPDATE sales SET total = $3 WHERE id IN (SELECT id FROM target)`;

// WITH ... SELECT that CONTAINS write keywords in a string literal/alias —
// must still route to all() (regression guard for reader-based dispatch)
const withSelectContainsWriteWords = `WITH t AS (
    SELECT id, 'DELETE' as tipo, 'UPDATE' as accion FROM sales WHERE business_id = $1
  )
  SELECT COUNT(*)::int as total FROM t`;

async function main() {
  await db.initSchema();

  // Seed a business so FK constraints are satisfied (isolation: temp DB)
  const biz = await db.queryOne(
    "INSERT INTO businesses (nombre, tipo_negocio) VALUES ('Test', 'general') RETURNING id"
  );
  const bizId = biz ? biz.id : 1;

  // Insert a sale at midday to verify ::DATE boundary semantics (inclusive end date)
  await db.queryAll(
    `INSERT INTO sales (business_id, customer_id, total, tipo_pago, estado, created_at)
     VALUES (?, NULL, 100, 'efectivo', 'completada', '2026-07-15 12:30:00')`,
    [bizId]
  );

  const tests = [
    ['overview', overview, [bizId, bizId, bizId, bizId, bizId, bizId, bizId, bizId]],
    ['monthly', monthly, [bizId]],
    ['topProducts', topProducts, [bizId]],
    ['supplierReport', supplierReport, [bizId, bizId, '2026-01-01', '2026-12-31']],
    ['monthlyProfitability', monthlyProfitability, [bizId, bizId, bizId, bizId]],
    ['productProfitability', productProfitability, [bizId]],
    ['searchQuery ILIKE', searchQuery, [bizId, 'x', 'x', 'x']],
    // End-date inclusive: sale on 2026-07-15 12:30 must be counted when end = '2026-07-15'
    ['dateFilter inclusive end', dateFilter, [bizId, '2026-07-01', '2026-07-15']],
    ['dateFilter excludes next day', dateFilter, [bizId, '2026-07-01', '2026-07-14']],
    ['customersList repeated $1', customersList, [bizId, 100, 0]],
    ['suppliersList repeated $1', suppliersList, [bizId, 100, 0]],
    ['salesWithTipoPago', salesWithTipoPago, [bizId, 'efectivo', 50, 0]],
    ['purchasesSearchPaged', purchasesSearchPaged, [bizId, 'x', 'x', 'x', 50, 0]],
    ['purchasesTotals DISTINCT', purchasesTotals, [bizId, 'x', 'x', 'x']],
    ['customersFiltered has_points', customersFiltered, [bizId, 100, 0]],
    ['servicesList daily', servicesList, [bizId, '2026-07-15', 50, 0]],
    ['servicesSummary by tipo', servicesSummary, [bizId, '2026-07-15']],
    ['servicesReport CASE', servicesReport, [bizId, '2026-07-01', '2026-07-31']],
    ['servicesDailyTrend ::DATE::TEXT', servicesDailyTrend, [bizId]],
    ['withSelect routes to all()', withSelect, [bizId]],
    ['withSelect with write words still reads', withSelectContainsWriteWords, [bizId]],
  ];

  const assert = (name, actual, expected) => {
    const ok = actual === expected;
    console.log(`${ok ? '✓' : '✗'} ${name}: got ${actual}, expected ${expected}`);
    return ok;
  };
  const dateRows = await db.queryAll(dateFilter, [bizId, '2026-07-01', '2026-07-15']);
  const boundaryOk = assert('boundary inclusive', Number(dateRows[0].total), 1);
  const dateRows2 = await db.queryAll(dateFilter, [bizId, '2026-07-01', '2026-07-14']);
  const excludeOk = assert('boundary exclusive next day', Number(dateRows2[0].total), 0);
  if (!boundaryOk || !excludeOk) process.exitCode = 1;

  // WITH ... UPDATE must run (change rows) and return no rows.
  // Runs AFTER the boundary assertions (which need the seed sale untouched).
  const withUpdateResult = await db.query(withUpdate, [bizId, 100, 101]);
  const withUpdateOk = Array.isArray(withUpdateResult.rows) &&
    withUpdateResult.rows.length === 0 &&
    withUpdateResult.changes === 1;
  console.log(`${withUpdateOk ? '✓' : '✗'} withUpdate routes to run(): changes=${withUpdateResult.changes}`);

  // cleanup
  await db.queryAll('DELETE FROM sales', []);
  let ok = 0;
  for (const [name, sql, params] of tests) {
    try {
      const rows = await db.queryAll(sql, params);
      console.log(`✓ ${name}: OK (${rows.length} rows)`);
      ok++;
    } catch (e) {
      console.log(`✗ ${name}: ${e.message}`);
    }
  }
  console.log(`\n${ok}/${tests.length} queries passed`);

  // Cleanup temp DB files
  for (const suffix of ['', '-shm', '-wal']) {
    try { fs.unlinkSync(tmpDb + suffix); } catch { /* ignore */ }
  }

  // Include the standalone withUpdate assertion in the final exit code so a
  // failure there can't be masked by the array-based pass count.
  process.exit(ok === tests.length && withUpdateOk ? 0 : 1);
}

main().catch((e) => { console.error('FATAL:', e.message); process.exit(1); });
