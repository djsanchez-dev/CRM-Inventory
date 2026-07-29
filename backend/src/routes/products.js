const express = require('express');
const { queryAll, queryOne } = require('../database');

const router = express.Router();

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const business_id = req.user.business_id;
    const { search, category, low_stock, page = '1', limit = '100' } = req.query;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(500, Math.max(1, parseInt(limit) || 100));
    const offset = (pageNum - 1) * limitNum;

    let whereClause = 'WHERE p.business_id = $1';
    const params = [business_id];
    let paramIdx = 2;

    if (search) {
      whereClause += ` AND (p.nombre ILIKE $${paramIdx} OR p.sku ILIKE $${paramIdx + 1})`;
      params.push(`%${search}%`, `%${search}%`);
      paramIdx += 2;
    }

    if (category) {
      whereClause += ` AND p.category_id = $${paramIdx}`;
      params.push(category);
      paramIdx++;
    }

    if (low_stock === 'true') {
      whereClause += ' AND p.stock <= p.stock_minimo';
    }

    // Count total
    const countResult = await queryOne(
      `SELECT COUNT(*)::int as total FROM products p ${whereClause}`,
      params
    );

    const products = await queryAll(
      `SELECT p.*, c.nombre as category_name 
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id
       ${whereClause}
       ORDER BY p.nombre ASC
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, limitNum, offset]
    );

    res.json({
      data: products,
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

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const business_id = req.user.business_id;
    const product = await queryOne(
      `SELECT p.*, c.nombre as category_name 
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       WHERE p.id = $1 AND p.business_id = $2`,
      [req.params.id, business_id]
    );

    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/products
router.post('/', async (req, res) => {
  try {
    const business_id = req.user.business_id;
    const { nombre, descripcion, sku, precio, costo, stock, stock_minimo, category_id, extra_data } = req.body;

    if (!nombre || !sku || !precio) {
      return res.status(400).json({ error: 'Nombre, SKU y precio son requeridos' });
    }

    const existing = await queryOne(
      'SELECT id FROM products WHERE sku = $1 AND business_id = $2',
      [sku, business_id]
    );
    if (existing) {
      return res.status(400).json({ error: 'Ya existe un producto con este SKU' });
    }

    const extra_json = extra_data ? JSON.stringify(extra_data) : '{}';
    const product = await queryOne(
      `INSERT INTO products (business_id, nombre, descripcion, sku, precio, costo, stock, stock_minimo, extra_data, category_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [business_id, nombre, descripcion, sku, precio, costo || 0, stock || 0, stock_minimo || 5, extra_json, category_id || null]
    );
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/products/:id
router.put('/:id', async (req, res) => {
  try {
    const business_id = req.user.business_id;
    const { nombre, descripcion, sku, precio, costo, stock, stock_minimo, category_id, extra_data } = req.body;

    const existing = await queryOne(
      'SELECT id FROM products WHERE id = $1 AND business_id = $2',
      [req.params.id, business_id]
    );
    if (!existing) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    if (sku) {
      const skuExists = await queryOne(
        'SELECT id FROM products WHERE sku = $1 AND id != $2 AND business_id = $3',
        [sku, req.params.id, business_id]
      );
      if (skuExists) {
        return res.status(400).json({ error: 'Ya existe otro producto con este SKU' });
      }
    }

    const extra_json = extra_data ? JSON.stringify(extra_data) : undefined;
    const product = await queryOne(
      `UPDATE products SET 
         nombre = COALESCE($1, nombre),
         descripcion = COALESCE($2, descripcion),
         sku = COALESCE($3, sku),
         precio = COALESCE($4, precio),
         costo = COALESCE($5, costo),
         stock = COALESCE($6, stock),
         stock_minimo = COALESCE($7, stock_minimo),
         extra_data = COALESCE($8, extra_data),
         category_id = $9,
         updated_at = NOW()
       WHERE id = $10 AND business_id = $11 RETURNING *`,
      [nombre, descripcion, sku, precio, costo, stock, stock_minimo, extra_json, category_id ?? null, req.params.id, business_id]
    );

    // Fetch with category name
    const productWithCategory = await queryOne(
      `SELECT p.*, c.nombre as category_name 
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       WHERE p.id = $1`,
      [req.params.id]
    );

    res.json(productWithCategory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/products/:id
router.delete('/:id', async (req, res) => {
  try {
    const business_id = req.user.business_id;
    const result = await queryOne(
      'DELETE FROM products WHERE id = $1 AND business_id = $2 RETURNING id',
      [req.params.id, business_id]
    );

    if (!result) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json({ message: 'Producto eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
