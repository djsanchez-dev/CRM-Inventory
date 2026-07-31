const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { queryOne, transaction } = require('../database');
const { resolveConfig, getPreset } = require('../config/businessTypes');
const { logger } = require('../middleware/logger');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'crm-inventario-secret-key-2024';

// Inline auth check for protected config routes
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autenticación requerido' });
  }
  try {
    req.user = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

// POST /api/business/setup - Create a new business + admin user (multitenant)
router.post('/setup', async (req, res) => {
  try {
    const { businessName, businessType, adminUsername, adminPassword, adminName, customLabels, moneda } = req.body;

    if (!businessName || !adminUsername || !adminPassword || !adminName) {
      return res.status(400).json({
        error: 'Nombre del negocio, usuario, contraseña y nombre de admin son requeridos',
      });
    }

    if (adminPassword.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const tipo = businessType || 'general';
    const currency = moneda || 'PEN';

    const validCurrencies = ['PEN', 'USD', 'MXN', 'COP', 'CLP', 'ARS', 'EUR', 'BOB'];
    if (!validCurrencies.includes(currency)) {
      return res.status(400).json({ error: `Moneda no válida. Opciones: ${validCurrencies.join(', ')}` });
    }

    const preset = getPreset(tipo);
    const mergedLabels = { ...preset.labels, ...(customLabels || {}) };

    const config = JSON.stringify({
      tipo,
      moneda: currency,
      idioma: 'es',
      labels: mergedLabels,
    });

    // Create business + admin in transaction
    const result = await transaction(async (client) => {
      const bizResult = await client.query(
        'INSERT INTO businesses (nombre, tipo_negocio, config) VALUES ($1, $2, $3) RETURNING id',
        [businessName, tipo, config]
      );
      const businessId = bizResult.rows[0].id;

      const hashedPassword = bcrypt.hashSync(adminPassword, 10);
      await client.query(
        'INSERT INTO users (business_id, username, password, nombre, rol) VALUES ($1, $2, $3, $4, $5)',
        [businessId, adminUsername, hashedPassword, adminName, 'admin']
      );

      return businessId;
    });

    const business = await queryOne(
      'SELECT id, nombre, tipo_negocio, config FROM businesses WHERE id = $1',
      [result]
    );

    const user = await queryOne(
      'SELECT id, username, nombre, rol, business_id FROM users WHERE business_id = $1 AND rol = $2',
      [result, 'admin']
    );

    const parsedConfig = JSON.parse(business.config || '{}');
    const resolved = resolveConfig(parsedConfig, business.tipo_negocio);

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        nombre: user.nombre,
        rol: user.rol,
        business_id: user.business_id,
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        nombre: user.nombre,
        rol: user.rol,
        business_id: user.business_id,
      },
      business: {
        id: business.id,
        nombre: business.nombre,
        tipo_negocio: business.tipo_negocio,
        config: resolved,
      },
    });
  } catch (error) {
    logger.error('Business setup failed', { error: error.message, stack: error.stack });
    res.status(500).json({ error: error.message });
  }
});

// GET /api/business/status
router.get('/status', async (req, res) => {
  try {
    const result = await queryOne('SELECT COUNT(*)::int as count FROM businesses');
    res.json({ hasBusiness: result.count > 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/business/config
router.get('/config', requireAuth, async (req, res) => {
  try {
    const business_id = req.user.business_id;

    // Super admin doesn't have a business — return default config
    if (!business_id) {
      return res.json({
        tipo: 'general',
        moneda: 'PEN',
        idioma: 'es',
        labels: {},
      });
    }

    const business = await queryOne('SELECT * FROM businesses WHERE id = $1', [business_id]);

    if (!business) {
      return res.status(404).json({ error: 'Negocio no encontrado' });
    }

    const parsedConfig = JSON.parse(business.config || '{}');
    const resolved = resolveConfig(parsedConfig, business.tipo_negocio);

    res.json(resolved);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/business/config
router.put('/config', requireAuth, async (req, res) => {
  try {
    const business_id = req.user.business_id;

    if (req.user.rol !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores pueden modificar la configuración' });
    }

    const business = await queryOne('SELECT * FROM businesses WHERE id = $1', [business_id]);
    if (!business) {
      return res.status(404).json({ error: 'Negocio no encontrado' });
    }

    const currentConfig = JSON.parse(business.config || '{}');
    const { customLabels, moneda, idioma } = req.body;

    if (customLabels) {
      currentConfig.labels = { ...(currentConfig.labels || {}), ...customLabels };
    }
    if (moneda) currentConfig.moneda = moneda;
    if (idioma) currentConfig.idioma = idioma;
    currentConfig.updated_at = new Date().toISOString();

    await queryOne(
      'UPDATE businesses SET config = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [JSON.stringify(currentConfig), business_id]
    );

    const resolved = resolveConfig(currentConfig, business.tipo_negocio);
    res.json(resolved);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
