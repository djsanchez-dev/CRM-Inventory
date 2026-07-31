const express = require('express');
const { queryAll, queryOne } = require('../database');

const router = express.Router();

// GET /api/customers
router.get('/', async (req, res) => {
  try {
    const business_id = req.user.business_id;
    const { search, has_points, sort, page = '1', limit = '100' } = req.query;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(500, Math.max(1, parseInt(limit) || 100));
    const offset = (pageNum - 1) * limitNum;

    let whereClause = 'WHERE c.business_id = $1';
    const params = [business_id];
    let paramIndex = 2;

    if (search) {
      whereClause += ` AND (c.nombre ILIKE $${paramIndex} OR c.email ILIKE $${paramIndex + 1} OR c.telefono ILIKE $${paramIndex + 2})`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      paramIndex += 3;
    }

    if (has_points === 'true') {
      whereClause += ' AND c.puntos > 0';
    }

    let orderBy = 'c.nombre ASC';
    if (sort === 'gasto') orderBy = 'total_gastado DESC';
    else if (sort === 'compras') orderBy = 'total_compras DESC';
    else if (sort === 'puntos') orderBy = 'c.puntos DESC';

    // Count total
    const countResult = await queryOne(
      `SELECT COUNT(*)::int as total FROM customers c ${whereClause}`,
      params
    );

    const customers = await queryAll(
      `SELECT c.*, 
         COUNT(s.id)::int as total_compras,
         COALESCE(SUM(s.total), 0) as total_gastado,
         COALESCE(SUM(s.puntos_ganados), 0) as total_puntos_ganados
       FROM customers c
       LEFT JOIN sales s ON c.id = s.customer_id AND s.business_id = $1
       ${whereClause}
       GROUP BY c.id
       ORDER BY ${orderBy}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limitNum, offset]
    );

    res.json({
      data: customers,
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

// GET /api/customers/:id
router.get('/:id', async (req, res) => {
  try {
    const business_id = req.user.business_id;
    const customer = await queryOne(
      `SELECT c.*,
         COUNT(s.id)::int as total_compras,
         COALESCE(SUM(s.total), 0) as total_gastado,
         COALESCE(SUM(s.puntos_ganados), 0) as total_puntos_ganados
       FROM customers c
       LEFT JOIN sales s ON c.id = s.customer_id AND s.business_id = $1
       WHERE c.id = $2 AND c.business_id = $3
       GROUP BY c.id`,
      [business_id, req.params.id, business_id]
    );

    if (!customer) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/customers
router.post('/', async (req, res) => {
  try {
    const business_id = req.user.business_id;
    const { nombre, email, telefono, direccion, tipo_documento, num_documento } = req.body;

    if (!nombre) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    if (email) {
      const existing = await queryOne(
        'SELECT id FROM customers WHERE email = $1 AND business_id = $2',
        [email, business_id]
      );
      if (existing) {
        return res.status(400).json({ error: 'Ya existe un cliente con este email' });
      }
    }

    const customer = await queryOne(
      `INSERT INTO customers (business_id, nombre, email, telefono, direccion, tipo_documento, num_documento, puntos)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 0) RETURNING *`,
      [business_id, nombre, email, telefono, direccion, tipo_documento || 'DNI', num_documento]
    );
    res.status(201).json(customer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/customers/:id
router.put('/:id', async (req, res) => {
  try {
    const business_id = req.user.business_id;
    const { nombre, email, telefono, direccion, tipo_documento, num_documento } = req.body;

    const existing = await queryOne(
      'SELECT id FROM customers WHERE id = $1 AND business_id = $2',
      [req.params.id, business_id]
    );
    if (!existing) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    if (email) {
      const emailExists = await queryOne(
        'SELECT id FROM customers WHERE email = $1 AND id != $2 AND business_id = $3',
        [email, req.params.id, business_id]
      );
      if (emailExists) {
        return res.status(400).json({ error: 'Ya existe otro cliente con este email' });
      }
    }

    const customer = await queryOne(
      `UPDATE customers SET
         nombre = COALESCE($1, nombre),
         email = COALESCE($2, email),
         telefono = COALESCE($3, telefono),
         direccion = COALESCE($4, direccion),
         tipo_documento = COALESCE($5, tipo_documento),
         num_documento = COALESCE($6, num_documento),
         updated_at = NOW()
       WHERE id = $7 AND business_id = $8 RETURNING *`,
      [nombre, email, telefono, direccion, tipo_documento, num_documento, req.params.id, business_id]
    );

    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/customers/quick
router.post('/quick', async (req, res) => {
  try {
    const business_id = req.user.business_id;
    const { nombre, telefono } = req.body;

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    const customer = await queryOne(
      `INSERT INTO customers (business_id, nombre, telefono, puntos)
       VALUES ($1, $2, $3, 0) RETURNING *`,
      [business_id, nombre.trim(), telefono || null]
    );
    res.status(201).json(customer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/customers/:id
router.delete('/:id', async (req, res) => {
  try {
    const business_id = req.user.business_id;
    const result = await queryOne(
      'DELETE FROM customers WHERE id = $1 AND business_id = $2 RETURNING id',
      [req.params.id, business_id]
    );

    if (!result) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    res.json({ message: 'Cliente eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
