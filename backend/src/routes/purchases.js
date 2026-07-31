const express = require('express');
const { queryAll, queryOne, transaction } = require('../database');

const router = express.Router();

// GET /api/purchases
router.get('/', async (req, res) => {
  try {
    const business_id = req.user.business_id;
    const { search, startDate, endDate, supplier_id, page = '1', limit = '50' } = req.query;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(500, Math.max(1, parseInt(limit) || 50));
    const offset = (pageNum - 1) * limitNum;

    let whereClause = 'WHERE p.business_id = $1';
    const params = [business_id];
    let paramIdx = 2;

    if (search) {
      whereClause += ` AND (pr.nombre ILIKE $${paramIdx} OR pr.sku ILIKE $${paramIdx + 1} OR s.nombre ILIKE $${paramIdx + 2})`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      paramIdx += 3;
    }

    if (startDate) {
      whereClause += ` AND p.created_at::DATE >= $${paramIdx}::DATE`;
      params.push(startDate);
      paramIdx++;
    }

    if (endDate) {
      whereClause += ` AND p.created_at::DATE <= $${paramIdx}::DATE`;
      params.push(endDate);
      paramIdx++;
    }

    if (supplier_id) {
      whereClause += ` AND p.supplier_id = $${paramIdx}`;
      params.push(supplier_id);
      paramIdx++;
    }

    const fromJoin = `
      FROM purchases p
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      LEFT JOIN products pr ON p.product_id = pr.id
    `;

    // Totals over the full filtered set (not just current page)
    const totals = await queryOne(
      `SELECT
         COALESCE(SUM(p.cantidad), 0)::int as cantidad,
         COALESCE(SUM(p.total), 0) as total,
         COUNT(DISTINCT p.supplier_id)::int as proveedores
       ${fromJoin}
       ${whereClause}`,
      params
    );

    // Count total
    const countResult = await queryOne(
      `SELECT COUNT(*)::int as total ${fromJoin} ${whereClause}`,
      params
    );

    const purchases = await queryAll(
      `SELECT p.*,
         s.nombre as supplier_name,
         pr.nombre as product_name,
         pr.sku as product_sku
       ${fromJoin}
       ${whereClause}
       ORDER BY p.created_at DESC
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, limitNum, offset]
    );

    res.json({
      data: purchases,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: countResult.total,
        totalPages: Math.ceil(countResult.total / limitNum)
      },
      totals: {
        cantidad: totals?.cantidad || 0,
        total: totals?.total || 0,
        proveedores: totals?.proveedores || 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/purchases/:id
router.get('/:id', async (req, res) => {
  try {
    const business_id = req.user.business_id;
    const purchase = await queryOne(
      `SELECT p.*,
         s.nombre as supplier_name,
         pr.nombre as product_name,
         pr.sku as product_sku
       FROM purchases p
       LEFT JOIN suppliers s ON p.supplier_id = s.id
       LEFT JOIN products pr ON p.product_id = pr.id
       WHERE p.id = $1 AND p.business_id = $2`,
      [req.params.id, business_id]
    );

    if (!purchase) {
      return res.status(404).json({ error: 'Compra no encontrada' });
    }
    res.json(purchase);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/purchases
router.post('/', async (req, res) => {
  try {
    const business_id = req.user.business_id;
    const { supplier_id, product_id, cantidad, costo_unitario } = req.body;

    if (!product_id || !cantidad || !costo_unitario) {
      return res.status(400).json({
        error: 'Producto, cantidad y costo unitario son requeridos'
      });
    }

    if (cantidad <= 0) {
      return res.status(400).json({ error: 'La cantidad debe ser mayor a 0' });
    }

    // Verify product exists
    const product = await queryOne(
      'SELECT id, nombre, stock FROM products WHERE id = $1 AND business_id = $2',
      [product_id, business_id]
    );
    if (!product) {
      return res.status(400).json({ error: 'Producto no encontrado' });
    }

    // Verify supplier if provided
    if (supplier_id) {
      const supplier = await queryOne(
        'SELECT id FROM suppliers WHERE id = $1 AND business_id = $2',
        [supplier_id, business_id]
      );
      if (!supplier) {
        return res.status(400).json({ error: 'Proveedor no encontrado' });
      }
    }

    const total = cantidad * costo_unitario;

    // Execute in transaction
    const purchaseId = await transaction(async (client) => {
      const result = await client.query(
        `INSERT INTO purchases (business_id, supplier_id, product_id, cantidad, costo_unitario, total)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [business_id, supplier_id || null, product_id, cantidad, costo_unitario, total]
      );

      await client.query(
        'UPDATE products SET stock = stock + $1, costo = $2, updated_at = NOW() WHERE id = $3 AND business_id = $4',
        [cantidad, costo_unitario, product_id, business_id]
      );

      return result.rows[0].id;
    });

    const purchase = await queryOne(
      `SELECT p.*,
         s.nombre as supplier_name,
         pr.nombre as product_name,
         pr.sku as product_sku
       FROM purchases p
       LEFT JOIN suppliers s ON p.supplier_id = s.id
       LEFT JOIN products pr ON p.product_id = pr.id
       WHERE p.id = $1`,
      [purchaseId]
    );

    res.status(201).json(purchase);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/purchases/:id
router.delete('/:id', async (req, res) => {
  try {
    const business_id = req.user.business_id;
    const purchase = await queryOne(
      `SELECT p.*, pr.nombre as product_name, pr.stock as stock_actual
       FROM purchases p
       JOIN products pr ON p.product_id = pr.id
       WHERE p.id = $1 AND p.business_id = $2`,
      [req.params.id, business_id]
    );

    if (!purchase) {
      return res.status(404).json({ error: 'Compra no encontrada' });
    }

    if (purchase.cantidad > purchase.stock_actual) {
      return res.status(400).json({
        error: `No se puede eliminar esta compra. El stock actual (${purchase.stock_actual}) es menor que la cantidad comprada (${purchase.cantidad}). Se han vendido productos de este lote.`
      });
    }

    await transaction(async (client) => {
      await client.query(
        'DELETE FROM purchases WHERE id = $1 AND business_id = $2',
        [req.params.id, business_id]
      );
      await client.query(
        'UPDATE products SET stock = stock - $1, updated_at = NOW() WHERE id = $2 AND business_id = $3',
        [purchase.cantidad, purchase.product_id, business_id]
      );
    });

    res.json({ message: 'Compra eliminada correctamente. Stock revertido.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
