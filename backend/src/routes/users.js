const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { queryAll, queryOne } = require('../database');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'crm-inventario-secret-key-2024';

function adminOnly(req, res, next) {
  if (req.user?.rol !== 'admin') {
    return res.status(403).json({ error: 'Solo administradores pueden realizar esta acción' });
  }
  next();
}

// GET /api/users
router.get('/', adminOnly, async (req, res) => {
  try {
    const business_id = req.user.business_id;
    const users = await queryAll(
      'SELECT id, username, nombre, rol, created_at FROM users WHERE business_id = $1 ORDER BY nombre ASC',
      [business_id]
    );
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/users/:id
router.get('/:id', adminOnly, async (req, res) => {
  try {
    const business_id = req.user.business_id;
    const user = await queryOne(
      'SELECT id, username, nombre, rol, created_at FROM users WHERE id = $1 AND business_id = $2',
      [req.params.id, business_id]
    );

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/users
router.post('/', adminOnly, async (req, res) => {
  try {
    const { username, password, nombre, rol } = req.body;
    const business_id = req.user.business_id;

    if (!username || !password || !nombre) {
      return res.status(400).json({ error: 'Usuario, contraseña y nombre son requeridos' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const existing = await queryOne(
      'SELECT id FROM users WHERE username = $1 AND business_id = $2',
      [username, business_id]
    );
    if (existing) {
      return res.status(400).json({ error: 'El nombre de usuario ya existe' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = await queryOne(
      'INSERT INTO users (business_id, username, password, nombre, rol) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, nombre, rol, created_at',
      [business_id, username, hashedPassword, nombre, rol || 'user']
    );

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/users/:id
router.put('/:id', adminOnly, async (req, res) => {
  try {
    const { username, password, nombre, rol } = req.body;
    const business_id = req.user.business_id;

    const existing = await queryOne(
      'SELECT id FROM users WHERE id = $1 AND business_id = $2',
      [req.params.id, business_id]
    );
    if (!existing) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (username) {
      const usernameExists = await queryOne(
        'SELECT id FROM users WHERE username = $1 AND id != $2 AND business_id = $3',
        [username, req.params.id, business_id]
      );
      if (usernameExists) {
        return res.status(400).json({ error: 'El nombre de usuario ya está en uso' });
      }
    }

    if (password && password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    let query;
    let params;

    if (password) {
      query = `UPDATE users SET username = COALESCE($1, username), nombre = COALESCE($2, nombre), 
               password = $3, rol = COALESCE($4, rol), updated_at = NOW() 
               WHERE id = $5 AND business_id = $6 RETURNING id, username, nombre, rol, created_at`;
      params = [username, nombre, bcrypt.hashSync(password, 10), rol || null, req.params.id, business_id];
    } else {
      query = `UPDATE users SET username = COALESCE($1, username), nombre = COALESCE($2, nombre), 
               rol = COALESCE($3, rol), updated_at = NOW() 
               WHERE id = $4 AND business_id = $5 RETURNING id, username, nombre, rol, created_at`;
      params = [username, nombre, rol || null, req.params.id, business_id];
    }

    const updated = await queryOne(query, params);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/users/:id
router.delete('/:id', adminOnly, async (req, res) => {
  try {
    const business_id = req.user.business_id;

    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ error: 'No puedes eliminarte a ti mismo' });
    }

    const target = await queryOne(
      'SELECT rol FROM users WHERE id = $1 AND business_id = $2',
      [req.params.id, business_id]
    );
    if (!target) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (target.rol === 'admin') {
      const adminCount = await queryOne(
        'SELECT COUNT(*)::int as count FROM users WHERE rol = $1 AND business_id = $2',
        ['admin', business_id]
      );
      if (adminCount.count <= 1) {
        return res.status(400).json({ error: 'No puedes eliminar al último administrador' });
      }
    }

    const result = await queryOne(
      'DELETE FROM users WHERE id = $1 AND business_id = $2 RETURNING id',
      [req.params.id, business_id]
    );

    if (!result) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/users/profile - Update own profile
router.put('/profile', async (req, res) => {
  try {
    const { nombre, currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Debes ingresar tu contraseña actual para cambiarla' });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
      }

      const user = await queryOne('SELECT password FROM users WHERE id = $1', [userId]);
      if (!bcrypt.compareSync(currentPassword, user.password)) {
        return res.status(400).json({ error: 'La contraseña actual es incorrecta' });
      }

      await queryOne(
        'UPDATE users SET password = $1, nombre = COALESCE($2, nombre), updated_at = NOW() WHERE id = $3 RETURNING *',
        [bcrypt.hashSync(newPassword, 10), nombre, userId]
      );
    } else {
      await queryOne(
        'UPDATE users SET nombre = COALESCE($1, nombre), updated_at = NOW() WHERE id = $2 RETURNING *',
        [nombre, userId]
      );
    }

    const updated = await queryOne(
      'SELECT id, username, nombre, rol, created_at, business_id FROM users WHERE id = $1',
      [userId]
    );

    const token = jwt.sign(
      {
        id: updated.id,
        username: updated.username,
        nombre: updated.nombre,
        rol: updated.rol,
        business_id: updated.business_id,
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ user: updated, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
