const express = require('express');
const { queryAll, queryOne, transaction } = require('../database');

const router = express.Router();

// GET /api/sales
router.get('/', async (req, res) => {
  try {
    const business_id = req.user.business_id;
    const { search, startDate, endDate, customer_id, tipo_pago, page = '1', limit = '100' } = req.query;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(500, Math.max(1, parseInt(limit) || 100));
    const offset = (pageNum - 1) * limitNum;

    let whereClause = 'WHERE s.business_id = $1';
    const params = [business_id];
    let paramIdx = 2;

    if (search) {
      whereClause += ` AND (s.id::TEXT ILIKE $${paramIdx} OR c.nombre ILIKE $${paramIdx + 1})`;
      params.push(`%${search}%`, `%${search}%`);
      paramIdx += 2;
    }

    if (startDate) {
      whereClause += ` AND s.created_at::DATE >= $${paramIdx}::DATE`;
      params.push(startDate);
      paramIdx++;
    }

    if (endDate) {
      whereClause += ` AND s.created_at::DATE <= $${paramIdx}::DATE`;
      params.push(endDate);
      paramIdx++;
    }

    if (customer_id) {
      whereClause += ` AND s.customer_id = $${paramIdx}`;
      params.push(customer_id);
      paramIdx++;
    }

    if (tipo_pago) {
      whereClause += ` AND s.tipo_pago = $${paramIdx}`;
      params.push(tipo_pago);
      paramIdx++;
    }

    // Count total
    const countResult = await queryOne(
      `SELECT COUNT(*)::int as total FROM sales s
       LEFT JOIN customers c ON s.customer_id = c.id
       ${whereClause}`,
      params
    );

    const sales = await queryAll(
      `SELECT s.*, c.nombre as customer_name,
         (SELECT COUNT(*)::int FROM sale_items si WHERE si.sale_id = s.id) as total_items
       FROM sales s
       LEFT JOIN customers c ON s.customer_id = c.id
       ${whereClause}
       ORDER BY s.created_at DESC
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, limitNum, offset]
    );

    res.json({
      data: sales,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: countResult.total,
        totalPages: Math.ceil(countResult.total / limitNum)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/sales/:id
router.get('/:id', async (req, res) => {
  try {
    const business_id = req.user.business_id;
    const sale = await queryOne(
      `SELECT s.*, c.nombre as customer_name, c.email as customer_email, c.telefono as customer_phone
       FROM sales s
       LEFT JOIN customers c ON s.customer_id = c.id
       WHERE s.id = $1 AND s.business_id = $2`,
      [req.params.id, business_id]
    );

    if (!sale) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }

    const items = await queryAll(
      `SELECT si.*, p.nombre as product_name, p.sku as product_sku
       FROM sale_items si
       LEFT JOIN products p ON si.product_id = p.id
       WHERE si.sale_id = $1`,
      [req.params.id]
    );

    res.json({ ...sale, items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/sales - Create a new sale
router.post('/', async (req, res) => {
  try {
    const business_id = req.user.business_id;
    const { customer_id, items, tipo_pago, descuento, puntos_usados } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'La venta debe tener al menos un producto' });
    }

    // Validate stock and get prices
    let total = 0;
    const saleItems = [];
    
    for (const item of items) {
      const product = await queryOne(
        'SELECT stock, nombre, precio FROM products WHERE id = $1 AND business_id = $2',
        [item.product_id, business_id]
      );
      if (!product) {
        return res.status(400).json({ error: `Producto ID ${item.product_id} no encontrado` });
      }
      if (product.stock < item.cantidad) {
        return res.status(400).json({
          error: `Stock insuficiente para "${product.nombre}". Disponible: ${product.stock}`
        });
      }
      const subtotal = parseFloat(product.precio) * item.cantidad;
      total += subtotal;
      saleItems.push({
        product_id: item.product_id,
        cantidad: item.cantidad,
        precio_unitario: parseFloat(product.precio),
        subtotal
      });
    }

    // Apply discount and points
    let descuentoAplicado = descuento || 0;
    let puntosUsados = 0;

    if (customer_id && puntos_usados && puntos_usados > 0) {
      const customer = await queryOne(
        'SELECT puntos FROM customers WHERE id = $1 AND business_id = $2',
        [customer_id, business_id]
      );
      if (customer) {
        const maxUsable = Math.min(puntos_usados, customer.puntos);
        puntosUsados = maxUsable;
        descuentoAplicado += maxUsable;
      }
    }

    total = total - descuentoAplicado;
    if (total < 0) total = 0;

    const totalBruto = saleItems.reduce((sum, item) => sum + (item.precio_unitario * item.cantidad), 0);
    const puntosGanados = customer_id ? Math.floor(totalBruto / 100) : 0;

    // Create sale in transaction
    const saleId = await transaction(async (client) => {
      const result = await client.query(
        `INSERT INTO sales (business_id, customer_id, total, tipo_pago, puntos_ganados, puntos_usados)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [business_id, customer_id || null, total, tipo_pago || 'efectivo', puntosGanados, puntosUsados]
      );
      const newSaleId = result.rows[0].id;

      const insertItem = (saleId, product_id, cantidad, precio_unitario, subtotal) =>
        client.query(
          'INSERT INTO sale_items (sale_id, product_id, cantidad, precio_unitario, subtotal) VALUES ($1, $2, $3, $4, $5)',
          [saleId, product_id, cantidad, precio_unitario, subtotal]
        );

      const updateStock = (cantidad, product_id) =>
        client.query(
          'UPDATE products SET stock = stock - $1 WHERE id = $2 AND business_id = $3',
          [cantidad, product_id, business_id]
        );

      for (const item of saleItems) {
        await insertItem(newSaleId, item.product_id, item.cantidad, item.precio_unitario, item.subtotal);
        await updateStock(item.cantidad, item.product_id);
      }

      // Update customer points
      if (customer_id) {
        const netPoints = puntosGanados - puntosUsados;
        if (netPoints !== 0) {
          await client.query(
            'UPDATE customers SET puntos = puntos + $1 WHERE id = $2 AND business_id = $3',
            [netPoints, customer_id, business_id]
          );
        }
      }

      return newSaleId;
    });

    // Fetch completed sale
    const sale = await queryOne(
      `SELECT s.*, c.nombre as customer_name, c.puntos as customer_puntos
       FROM sales s
       LEFT JOIN customers c ON s.customer_id = c.id
       WHERE s.id = $1`,
      [saleId]
    );

    const items_result = await queryAll(
      `SELECT si.*, p.nombre as product_name
       FROM sale_items si
       LEFT JOIN products p ON si.product_id = p.id
       WHERE si.sale_id = $1`,
      [saleId]
    );

    res.status(201).json({ ...sale, items: items_result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/sales/:id
router.delete('/:id', async (req, res) => {
  try {
    const business_id = req.user.business_id;

    const sale = await queryOne(
      'SELECT id FROM sales WHERE id = $1 AND business_id = $2',
      [req.params.id, business_id]
    );
    if (!sale) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }

    const items = await queryAll(
      'SELECT * FROM sale_items WHERE sale_id = $1',
      [req.params.id]
    );

    await transaction(async (client) => {
      // Restore stock
      for (const item of items) {
        await client.query(
          'UPDATE products SET stock = stock + $1 WHERE id = $2 AND business_id = $3',
          [item.cantidad, item.product_id, business_id]
        );
      }
      await client.query('DELETE FROM sale_items WHERE sale_id = $1', [req.params.id]);
      const result = await client.query(
        'DELETE FROM sales WHERE id = $1 AND business_id = $2',
        [req.params.id, business_id]
      );
      return result.rowCount;
    });

    res.json({ message: 'Venta eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
