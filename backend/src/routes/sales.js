const express = require('express');
const crypto = require('crypto');
const { queryAll, queryOne, transaction } = require('../database');

const router = express.Router();

/** Generate an unguessable token for the public delivery-tracking link */
function generateTrackingToken() {
  return crypto.randomBytes(16).toString('hex');
}

// GET /api/sales
router.get('/', async (req, res) => {
  try {
    const business_id = req.user.business_id;
    const { search, startDate, endDate, customer_id, tipo_pago, delivery, estado_delivery, page = '1', limit = '100' } = req.query;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(500, Math.max(1, parseInt(limit) || 100));
    const offset = (pageNum - 1) * limitNum;

    let whereClause = 'WHERE s.business_id = $1';
    const params = [business_id];
    let paramIdx = 2;

    if (delivery === 'true' || delivery === '1') {
      whereClause += ' AND s.es_delivery = TRUE';
    } else if (delivery === 'false' || delivery === '0') {
      whereClause += ' AND s.es_delivery = FALSE';
    }

    if (estado_delivery) {
      whereClause += ` AND s.estado_delivery = $${paramIdx}`;
      params.push(estado_delivery);
      paramIdx++;
    }

    if (search) {
      whereClause += ` AND (s.id::TEXT ILIKE $${paramIdx} OR c.nombre ILIKE $${paramIdx + 1} OR s.direccion_entrega ILIKE $${paramIdx + 2})`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      paramIdx += 3;
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
    const { customer_id, items, tipo_pago, descuento, puntos_usados, es_delivery, direccion_entrega, repartidor, destino_lat, destino_lng } = req.body;

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

    // Validate delivery fields (only when the sale is a delivery order)
    const isDelivery = !!es_delivery;
    if (isDelivery) {
      if (typeof direccion_entrega !== 'string' || !direccion_entrega.trim()) {
        return res.status(400).json({ error: 'La dirección de entrega es obligatoria para pedidos de delivery' });
      }
      // Optional destination coordinates (map pin from the taxi-style picker)
      const hasDestLat = typeof destino_lat === 'number' && isFinite(destino_lat);
      const hasDestLng = typeof destino_lng === 'number' && isFinite(destino_lng);
      if (hasDestLat !== hasDestLng) {
        return res.status(400).json({ error: 'Debes enviar lat y lng del destino juntas' });
      }
      if (hasDestLat && (Math.abs(destino_lat) > 90 || Math.abs(destino_lng) > 180)) {
        return res.status(400).json({ error: 'Coordenadas del destino fuera de rango' });
      }
    }

    // Every delivery order gets a tracking token so the owner can share a
    // public real-time link with the customer (via WhatsApp / phone call).
    const trackingToken = isDelivery ? generateTrackingToken() : null;
    const destLat = isDelivery && typeof destino_lat === 'number' ? destino_lat : null;
    const destLng = isDelivery && typeof destino_lng === 'number' ? destino_lng : null;

    // Create sale in transaction
    const saleId = await transaction(async (client) => {
      const result = await client.query(
        `INSERT INTO sales (business_id, customer_id, total, tipo_pago, puntos_ganados, puntos_usados,
           es_delivery, direccion_entrega, repartidor, estado_delivery, tracking_token, destino_lat, destino_lng)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id`,
        [business_id, customer_id || null, total, tipo_pago || 'efectivo', puntosGanados, puntosUsados,
         isDelivery, isDelivery ? (direccion_entrega || null) : null,
         isDelivery ? (repartidor || null) : null, isDelivery ? 'pendiente' : null, trackingToken, destLat, destLng]
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

// PUT /api/sales/:id — edit an existing sale (items, customer, payment,
// notes and optional delivery). Stock and loyalty points are reconciled:
// old items are returned to stock first, then the new ones are deducted.
router.put('/:id', async (req, res) => {
  try {
    const business_id = req.user.business_id;
    const saleId = req.params.id;
    const {
      customer_id, items, tipo_pago, descuento, puntos_usados,
      nota, es_delivery, direccion_entrega, repartidor,
      destino_lat, destino_lng,
    } = req.body;

    const existing = await queryOne(
      'SELECT * FROM sales WHERE id = $1 AND business_id = $2',
      [saleId, business_id]
    );
    if (!existing) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'La venta debe tener al menos un producto' });
    }

    // Load old items so we can return them to stock before applying the new ones.
    const oldItems = await queryAll(
      'SELECT * FROM sale_items WHERE sale_id = $1',
      [saleId]
    );

    // Validate every new item: must exist in this business and the resulting
    // stock (current + returned old quantity) must cover the new quantity.
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
      const oldQty = oldItems
        .filter((o) => o.product_id === item.product_id)
        .reduce((sum, o) => sum + o.cantidad, 0);
      const available = product.stock + oldQty;
      if (available < item.cantidad) {
        return res.status(400).json({
          error: `Stock insuficiente para "${product.nombre}". Disponible: ${available}`
        });
      }
      const subtotal = parseFloat(product.precio) * item.cantidad;
      total += subtotal;
      saleItems.push({
        product_id: item.product_id,
        cantidad: item.cantidad,
        precio_unitario: parseFloat(product.precio),
        subtotal,
      });
    }

    // Discounts + loyalty points (same rules as create)
    let descuentoAplicado = descuento || 0;
    let puntosUsados = 0;
    if (customer_id && puntos_usados && puntos_usados > 0) {
      const customer = await queryOne(
        'SELECT puntos FROM customers WHERE id = $1 AND business_id = $2',
        [customer_id, business_id]
      );
      if (customer) {
        const maxUsable = Math.min(puntos_usados, customer.puntos + (existing.puntos_usados || 0));
        puntosUsados = maxUsable;
        descuentoAplicado += maxUsable;
      }
    }
    total = Math.max(0, total - descuentoAplicado);
    const totalBruto = saleItems.reduce((sum, i) => sum + (i.precio_unitario * i.cantidad), 0);
    const puntosGanados = customer_id ? Math.floor(totalBruto / 100) : 0;

    // Delivery fields (optional) — same validation as create
    const isDelivery = !!es_delivery;
    if (isDelivery && (typeof direccion_entrega !== 'string' || !direccion_entrega.trim())) {
      return res.status(400).json({ error: 'La dirección de entrega es obligatoria para pedidos de delivery' });
    }
    const hasDestLat = typeof destino_lat === 'number' && isFinite(destino_lat);
    const hasDestLng = typeof destino_lng === 'number' && isFinite(destino_lng);
    if (isDelivery && hasDestLat !== hasDestLng) {
      return res.status(400).json({ error: 'Debes enviar lat y lng del destino juntas' });
    }
    const destLat = isDelivery && hasDestLat ? destino_lat : null;
    const destLng = isDelivery && hasDestLng ? destino_lng : null;
    // Keep the existing tracking token when it stays a delivery order
    const trackingToken = isDelivery ? (existing.tracking_token || generateTrackingToken()) : null;

    await transaction(async (client) => {
      // 1) Return old items to stock
      for (const o of oldItems) {
        await client.query(
          'UPDATE products SET stock = stock + $1 WHERE id = $2 AND business_id = $3',
          [o.cantidad, o.product_id, business_id]
        );
      }
      // 2) Update the sale row
      await client.query(
        `UPDATE sales SET customer_id = $1, total = $2, tipo_pago = $3,
           puntos_ganados = $4, puntos_usados = $5, nota = $6,
           es_delivery = $7, direccion_entrega = $8, repartidor = $9,
           estado_delivery = $10, tracking_token = $11,
           destino_lat = $12, destino_lng = $13, updated_at = NOW()
         WHERE id = $14 AND business_id = $15`,
        [
          customer_id || null, total, tipo_pago || 'efectivo',
          puntosGanados, puntosUsados, nota || null,
          isDelivery, isDelivery ? (direccion_entrega || null) : null,
          isDelivery ? (repartidor || null) : null,
          isDelivery ? (existing.estado_delivery || 'pendiente') : null,
          trackingToken, destLat, destLng, saleId, business_id,
        ]
      );
      // 3) Replace sale items and deduct new stock
      await client.query('DELETE FROM sale_items WHERE sale_id = $1', [saleId]);
      for (const item of saleItems) {
        await client.query(
          'INSERT INTO sale_items (sale_id, product_id, cantidad, precio_unitario, subtotal) VALUES ($1, $2, $3, $4, $5)',
          [saleId, item.product_id, item.cantidad, item.precio_unitario, item.subtotal]
        );
        await client.query(
          'UPDATE products SET stock = stock - $1 WHERE id = $2 AND business_id = $3',
          [item.cantidad, item.product_id, business_id]
        );
      }
      // 4) Reconcile customer loyalty points (old net vs new net)
      const oldNet = (existing.puntos_ganados || 0) - (existing.puntos_usados || 0);
      const newNet = puntosGanados - puntosUsados;
      if (existing.customer_id && oldNet !== 0) {
        await client.query(
          'UPDATE customers SET puntos = puntos - $1 WHERE id = $2 AND business_id = $3',
          [oldNet, existing.customer_id, business_id]
        );
      }
      if (customer_id && newNet !== 0) {
        await client.query(
          'UPDATE customers SET puntos = puntos + $1 WHERE id = $2 AND business_id = $3',
          [newNet, customer_id, business_id]
        );
      }
    });

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
    res.json({ ...sale, items: items_result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/sales/:id/delivery — update delivery status and/or destination
// (pendiente → en_camino → entregado, address + map pin from the picker).
router.put('/:id/delivery', async (req, res) => {
  try {
    const business_id = req.user.business_id;
    const { estado_delivery, repartidor, direccion_entrega, destino_lat, destino_lng } = req.body;
    const validStates = ['pendiente', 'en_camino', 'entregado', 'cancelado'];

    if (estado_delivery && !validStates.includes(estado_delivery)) {
      return res.status(400).json({ error: 'Estado de delivery inválido' });
    }

    // Validate the new destination when provided
    let destLat = null;
    let destLng = null;
    if (typeof destino_lat === 'number' && typeof destino_lng === 'number' &&
        isFinite(destino_lat) && isFinite(destino_lng)) {
      if (Math.abs(destino_lat) > 90 || Math.abs(destino_lng) > 180) {
        return res.status(400).json({ error: 'Coordenadas del destino fuera de rango' });
      }
      destLat = destino_lat;
      destLng = destino_lng;
    } else if (destino_lat != null || destino_lng != null) {
      return res.status(400).json({ error: 'Coordenadas del destino inválidas' });
    }

    const sale = await queryOne(
      'SELECT id, es_delivery FROM sales WHERE id = $1 AND business_id = $2',
      [req.params.id, business_id]
    );
    if (!sale) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }
    if (!sale.es_delivery) {
      return res.status(400).json({ error: 'Esta venta no es un pedido de delivery' });
    }

    if (direccion_entrega !== undefined && typeof direccion_entrega !== 'string') {
      return res.status(400).json({ error: 'Dirección de entrega inválida' });
    }

    // When BOTH keys are explicitly sent (even as null, e.g. the picker has
    // only a typed address with no pin), honor the value — so editing the
    // address clears a stale map pin. When absent, keep the stored coords.
    const destExplicit =
      Object.prototype.hasOwnProperty.call(req.body, 'destino_lat') &&
      Object.prototype.hasOwnProperty.call(req.body, 'destino_lng');
    const destSql = destExplicit
      ? 'destino_lat = $4, destino_lng = $5'
      : 'destino_lat = COALESCE($4, destino_lat), destino_lng = COALESCE($5, destino_lng)';

    const updated = await queryOne(
      `UPDATE sales SET
         estado_delivery = COALESCE($1, estado_delivery),
         repartidor = COALESCE($2, repartidor),
         direccion_entrega = COALESCE($3, direccion_entrega),
         ${destSql},
         updated_at = NOW()
       WHERE id = $6 AND business_id = $7 RETURNING *`,
      [estado_delivery || null, repartidor || null, direccion_entrega || null, destLat, destLng, req.params.id, business_id]
    );

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/sales/:id/tracking — (re)generate the public tracking link token.
// Useful for delivery orders created before the tracking feature existed,
// or to rotate the link after it was shared.
router.post('/:id/tracking', async (req, res) => {
  try {
    const business_id = req.user.business_id;

    const sale = await queryOne(
      'SELECT id, es_delivery, estado_delivery FROM sales WHERE id = $1 AND business_id = $2',
      [req.params.id, business_id]
    );
    if (!sale) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }
    if (!sale.es_delivery) {
      return res.status(400).json({ error: 'Esta venta no es un pedido de delivery' });
    }

    // The tracking link must disappear once the order is finished — refuse to
    // (re)generate a token for delivered/cancelled orders.
    if (sale.estado_delivery === 'entregado' || sale.estado_delivery === 'cancelado') {
      return res.status(400).json({ error: 'El pedido ya finalizó, su link de seguimiento no está disponible' });
    }

    const token = generateTrackingToken();
    const updated = await queryOne(
      'UPDATE sales SET tracking_token = $1, updated_at = NOW() WHERE id = $2 AND business_id = $3 RETURNING tracking_token',
      [token, req.params.id, business_id]
    );

    res.json({ tracking_token: updated.tracking_token });
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
