const express = require('express');
const { queryAll, queryOne } = require('../database');

const router = express.Router();

/**
 * GET /api/services
 * List services with filters: date (YYYY-MM-DD), tipo (carwash|mecanica), search
 */
router.get('/', async (req, res) => {
  try {
    const business_id = req.user.business_id;
    const { date, tipo, search, page = '1', limit = '50' } = req.query;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit) || 50));
    const offset = (pageNum - 1) * limitNum;

    let whereClause = 'WHERE s.business_id = $1';
    const params = [business_id];
    let paramIdx = 2;

    if (date) {
      whereClause += ` AND s.created_at::DATE = $${paramIdx}::DATE`;
      params.push(date);
      paramIdx++;
    }

    if (tipo) {
      whereClause += ` AND s.tipo = $${paramIdx}`;
      params.push(tipo);
      paramIdx++;
    }

    if (search) {
      whereClause += ` AND (s.nombre ILIKE $${paramIdx} OR s.placa ILIKE $${paramIdx + 1} OR c.nombre ILIKE $${paramIdx + 2})`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      paramIdx += 3;
    }

    // Count total
    const countResult = await queryOne(
      `SELECT COUNT(*)::int as total FROM services s
       LEFT JOIN customers c ON s.cliente_id = c.id
       ${whereClause}`,
      params
    );

    const services = await queryAll(
      `SELECT s.*, c.nombre as customer_name, c.telefono as customer_phone
       FROM services s
       LEFT JOIN customers c ON s.cliente_id = c.id
       ${whereClause}
       ORDER BY s.created_at DESC, s.id DESC
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, limitNum, offset]
    );

    res.json({
      data: services,
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

/**
 * GET /api/services/summary?date=YYYY-MM-DD
 * Daily control summary — cars washed, mechanic services, totals & revenue for the day.
 */
router.get('/summary', async (req, res) => {
  try {
    const business_id = req.user.business_id;
    const today = req.query.date || new Date().toISOString().split('T')[0];

    const byTipo = await queryAll(
      `SELECT s.tipo,
         COUNT(*)::int as total,
         COALESCE(SUM(s.precio), 0) as ingreso
       FROM services s
       WHERE s.business_id = $1 AND s.created_at::DATE = $2::DATE
       GROUP BY s.tipo`,
      [business_id, today]
    );

    const totals = await queryOne(
      `SELECT COUNT(*)::int as total_servicios,
         COALESCE(SUM(s.precio), 0) as ingreso_total
       FROM services s
       WHERE s.business_id = $1 AND s.created_at::DATE = $2::DATE`,
      [business_id, today]
    );

    const resumen = {
      carwash: { total: 0, ingreso: 0 },
      mecanica: { total: 0, ingreso: 0 },
    };
    for (const row of byTipo) {
      if (resumen[row.tipo]) {
        resumen[row.tipo].total = row.total;
        resumen[row.tipo].ingreso = parseFloat(row.ingreso);
      }
    }

    res.json({
      fecha: today,
      carwash: resumen.carwash,
      mecanica: resumen.mecanica,
      total_servicios: totals ? totals.total_servicios : 0,
      ingreso_total: totals ? parseFloat(totals.ingreso_total) : 0,
      byTipo,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/services — register a service done (car wash or mechanic)
 */
router.post('/', async (req, res) => {
  try {
    const business_id = req.user.business_id;
    const { tipo, nombre, placa, cliente_id, precio, notas, fecha } = req.body;

    if (!tipo || !['carwash', 'mecanica'].includes(tipo)) {
      return res.status(400).json({ error: 'Tipo de servicio inválido (carwash o mecanica)' });
    }
    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre del servicio es requerido' });
    }
    if (precio === undefined || precio === null || isNaN(parseFloat(precio)) || parseFloat(precio) < 0) {
      return res.status(400).json({ error: 'El precio debe ser un número válido y no negativo' });
    }

    // If a date is provided (e.g. backfilling a service done earlier), build a
    // full timestamp using the current time; otherwise let the DB default it.
    let service;
    if (fecha && fecha.trim()) {
      const created_at = `${fecha.trim()} ${new Date().toTimeString().slice(0, 8)}`;
      service = await queryOne(
        `INSERT INTO services (business_id, tipo, nombre, placa, cliente_id, precio, notas, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [business_id, tipo, nombre.trim(), placa || null, cliente_id || null,
         parseFloat(precio), notas || null, created_at]
      );
    } else {
      service = await queryOne(
        `INSERT INTO services (business_id, tipo, nombre, placa, cliente_id, precio, notas)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [business_id, tipo, nombre.trim(), placa || null, cliente_id || null,
         parseFloat(precio), notas || null]
      );
    }

    res.status(201).json(service);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/services/:id — remove a service (e.g. registered by mistake)
 */
router.delete('/:id', async (req, res) => {
  try {
    const business_id = req.user.business_id;
    const result = await queryOne(
      'DELETE FROM services WHERE id = $1 AND business_id = $2 RETURNING id',
      [req.params.id, business_id]
    );

    if (!result) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    res.json({ message: 'Servicio eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
