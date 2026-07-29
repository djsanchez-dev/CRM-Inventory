const express = require('express');
const { queryAll, queryOne } = require('../database');

const router = express.Router();

// GET /api/categories
router.get('/', async (req, res) => {
  try {
    const business_id = req.user.business_id;
    const categories = await queryAll(
      `SELECT c.*, COUNT(p.id)::int as product_count
       FROM categories c
       LEFT JOIN products p ON c.id = p.category_id AND p.business_id = $1
       WHERE c.business_id = $2
       GROUP BY c.id
       ORDER BY c.nombre ASC`,
      [business_id, business_id]
    );
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/categories/:id
router.get('/:id', async (req, res) => {
  try {
    const business_id = req.user.business_id;
    const category = await queryOne(
      `SELECT c.*, COUNT(p.id)::int as product_count
       FROM categories c
       LEFT JOIN products p ON c.id = p.category_id AND p.business_id = $1
       WHERE c.id = $2 AND c.business_id = $3
       GROUP BY c.id`,
      [business_id, req.params.id, business_id]
    );

    if (!category) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/categories
router.post('/', async (req, res) => {
  try {
    const business_id = req.user.business_id;
    const { nombre, descripcion } = req.body;

    if (!nombre) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    const existing = await queryOne(
      'SELECT id FROM categories WHERE nombre = $1 AND business_id = $2',
      [nombre, business_id]
    );
    if (existing) {
      return res.status(400).json({ error: 'Ya existe una categoría con este nombre' });
    }

    const category = await queryOne(
      'INSERT INTO categories (business_id, nombre, descripcion) VALUES ($1, $2, $3) RETURNING *',
      [business_id, nombre, descripcion]
    );
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/categories/:id
router.put('/:id', async (req, res) => {
  try {
    const business_id = req.user.business_id;
    const { nombre, descripcion } = req.body;

    const existing = await queryOne(
      'SELECT id FROM categories WHERE id = $1 AND business_id = $2',
      [req.params.id, business_id]
    );
    if (!existing) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    if (nombre) {
      const nameExists = await queryOne(
        'SELECT id FROM categories WHERE nombre = $1 AND id != $2 AND business_id = $3',
        [nombre, req.params.id, business_id]
      );
      if (nameExists) {
        return res.status(400).json({ error: 'Ya existe otra categoría con este nombre' });
      }
    }

    const category = await queryOne(
      `UPDATE categories SET 
         nombre = COALESCE($1, nombre),
         descripcion = COALESCE($2, descripcion),
         updated_at = NOW()
       WHERE id = $3 AND business_id = $4 RETURNING *`,
      [nombre, descripcion, req.params.id, business_id]
    );

    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/categories/:id
router.delete('/:id', async (req, res) => {
  try {
    const business_id = req.user.business_id;

    const hasProducts = await queryOne(
      'SELECT COUNT(*)::int as count FROM products WHERE category_id = $1 AND business_id = $2',
      [req.params.id, business_id]
    );
    if (hasProducts.count > 0) {
      return res.status(400).json({
        error: `No se puede eliminar la categoría porque tiene ${hasProducts.count} producto(s) asociado(s)`
      });
    }

    const result = await queryOne(
      'DELETE FROM categories WHERE id = $1 AND business_id = $2 RETURNING id',
      [req.params.id, business_id]
    );

    if (!result) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    res.json({ message: 'Categoría eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
