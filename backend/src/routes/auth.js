const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { queryOne, queryAll } = require('../database');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'crm-inventario-secret-key-2024';

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await queryOne(
      `SELECT u.*, b.nombre as business_name, b.tipo_negocio 
       FROM users u JOIN businesses b ON u.business_id = b.id 
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
        tipo_negocio: user.tipo_negocio,
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
    res.json({ valid: true, user: decoded });
  } catch (error) {
    res.status(200).json({ valid: false });
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
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
