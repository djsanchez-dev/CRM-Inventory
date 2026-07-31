const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { queryOne } = require('../database');
const { logger } = require('../middleware/logger');
const { normalizeType } = require('../config/businessTypes');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'crm-inventario-secret-key-2024';

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // LEFT JOIN so super_admin (business_id = null) also gets a result
    const user = await queryOne(
      `SELECT u.*, b.nombre as business_name, b.tipo_negocio 
       FROM users u LEFT JOIN businesses b ON u.business_id = b.id 
       WHERE u.username = $1`,
      [username]
    );
    if (!user) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

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

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        nombre: user.nombre,
        rol: user.rol,
        business_id: user.business_id,
      },
      business: {
        id: user.business_id,
        nombre: user.business_name,
        tipo_negocio: normalizeType(user.tipo_negocio),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/auth/verify
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(200).json({ valid: false });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    // Fetch business info to include in response
    let business = null;
    if (decoded.business_id) {
      const row = await queryOne(
        'SELECT id, nombre, tipo_negocio FROM businesses WHERE id = $1',
        [decoded.business_id]
      );
      if (row) {
        business = {
          id: row.id,
          nombre: row.nombre,
          tipo_negocio: normalizeType(row.tipo_negocio),
        };
      }
    }
    res.json({
      valid: true,
      user: decoded,
      business: business || null,
    });
  } catch (error) {
    res.status(200).json({ valid: false });
  }
});

// POST /api/auth/refresh — Issue a new token
router.post('/refresh', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Token requerido' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true });
    } catch (e) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    // Verify user still exists and belongs to business
    const user = await queryOne(
      'SELECT id, username, nombre, rol, business_id FROM users WHERE id = $1',
      [decoded.id]
    );
    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    // Issue new token with 24h expiry
    const newToken = jwt.sign(
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

    res.json({ token: newToken });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, password, nombre, rol } = req.body;

    if (!username || !password || !nombre) {
      return res.status(400).json({ error: 'username, password y nombre son requeridos' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(403).json({ error: 'Autorización requerida' });
    }
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    if (decoded.rol !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores pueden registrar usuarios' });
    }

    const business_id = decoded.business_id;

    const existing = await queryOne(
      'SELECT id FROM users WHERE username = $1 AND business_id = $2',
      [username, business_id]
    );
    if (existing) {
      return res.status(400).json({ error: 'El usuario ya existe' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = await queryOne(
      `INSERT INTO users (business_id, username, password, nombre, rol) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [business_id, username, hashedPassword, nombre, rol || 'user']
    );

    res.status(201).json({
      id: result.id,
      username,
      nombre,
      rol: rol || 'user',
    });
  } catch (error) {
    logger.error('User registration failed', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
