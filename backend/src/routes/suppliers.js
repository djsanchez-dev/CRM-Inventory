const express = require('express');
const { queryAll, queryOne } = require('../database');

const router = express.Router();

// GET /api/suppliers
router.get('/', async (req, res) => {
  try {
    const business_id = req.user.business_id;
    const { search, startDate, endDate, page = '1', limit = '100' } = req.query;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(500, Math.max(1, parseInt(limit) || 100));
    const offset = (pageNum - 1) * limitNum;

    let whereClause = 'WHERE s.business_id = $1';
    const params = [business_id];
    let paramIdx = 2;

    if (search) {
      whereClause += ` AND (s.nombre ILIKE $${paramIdx} OR s.contacto ILIKE $${paramIdx + 1} OR s.email ILIKE $${paramIdx + 2})`;
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

    // Count total
    const countResult = await queryOne(
      `SELECT COUNT(*)::int as total FROM suppliers s ${whereClause}`,
      params
    );

    const suppliers = await queryAll(
      `SELECT s.*,
         COALESCE(stats.total_invertido, 0) as total_invertido,
         COALESCE(stats.total_productos, 0)::int as total_productos,
         COALESCE(stats.num_compras, 0)::int as num_compras,
         stats.ultima_compra
       FROM suppliers s
       LEFT JOIN (
         SELECT supplier_id,
           SUM(total) as total_invertido,
           SUM(cantidad) as total_productos,
           COUNT(*)::int as num_compras,
           MAX(created_at) as ultima_compra
         FROM purchases
         WHERE supplier_id IS NOT NULL AND business_id = $1
         GROUP BY supplier_id
       ) stats ON s.id = stats.supplier_id
       ${whereClause}
       ORDER BY s.nombre ASC
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, limitNum, offset]
    );

    res.json({
      data: suppliers,
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

// GET /api/suppliers/:id
router.get('/:id', async (req, res) => {
  try {
    const business_id = req.user.business_id;
    const supplier = await queryOne(
      'SELECT * FROM suppliers WHERE id = $1 AND business_id = $2',
      [req.params.id, business_id]
    );

    if (!supplier) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }
    res.json(supplier);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/suppliers
router.post('/', async (req, res) => {
  try {
    const business_id = req.user.business_id;
    const { nombre, contacto, email, telefono, direccion } = req.body;

    if (!nombre) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    const supplier = await queryOne(
      `INSERT INTO suppliers (business_id, nombre, contacto, email, telefono, direccion)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [business_id, nombre, contacto, email, telefono, direccion]
    );
    res.status(201).json(supplier);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/suppliers/:id
router.put('/:id', async (req, res) => {
  try {
    const business_id = req.user.business_id;
    const { nombre, contacto, email, telefono, direccion } = req.body;

    const existing = await queryOne(
      'SELECT id FROM suppliers WHERE id = $1 AND business_id = $2',
      [req.params.id, business_id]
    );
    if (!existing) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    const supplier = await queryOne(
      `UPDATE suppliers SET
         nombre = COALESCE($1, nombre),
         contacto = COALESCE($2, contacto),
         email = COALESCE($3, email),
         telefono = COALESCE($4, telefono),
         direccion = COALESCE($5, direccion),
         updated_at = NOW()
       WHERE id = $6 AND business_id = $7 RETURNING *`,
      [nombre, contacto, email, telefono, direccion, req.params.id, business_id]
    );

    res.json(supplier);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/suppliers/:id
router.delete('/:id', async (req, res) => {
  try {
    const business_id = req.user.business_id;
    const result = await queryOne(
      'DELETE FROM suppliers WHERE id = $1 AND business_id = $2 RETURNING id',
      [req.params.id, business_id]
    );

    if (!result) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    res.json({ message: 'Proveedor eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
