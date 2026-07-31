const express = require('express');
const bcrypt = require('bcryptjs');
const { queryAll, queryOne } = require('../database');
const { logger } = require('../middleware/logger');

const router = express.Router();

// ── Middleware: super_admin only ──
function superAdminOnly(req, res, next) {
  if (req.user?.rol !== 'super_admin') {
    return res.status(403).json({ error: 'Solo el super administrador puede realizar esta acción' });
  }
  next();
}

router.use(superAdminOnly);

// ── GET /api/admin/stats — System-wide overview ──
router.get('/stats', async (req, res) => {
  try {
    const [totalBusinesses, totalUsers, totalProducts, totalSales] = await Promise.all([
      queryOne('SELECT COUNT(*)::int as count FROM businesses'),
      queryOne('SELECT COUNT(*)::int as count FROM users WHERE rol != $1', ['super_admin']),
      queryOne('SELECT COUNT(*)::int as count FROM products'),
      queryOne('SELECT COUNT(*)::int as count FROM sales'),
    ]);

    res.json({
      totalBusinesses: totalBusinesses.count,
      totalUsers: totalUsers.count,
      totalProducts: totalProducts.count,
      totalSales: totalSales.count,
    });
  } catch (error) {
    logger.error('Admin stats error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// ── GET /api/admin/businesses — List all businesses ──
router.get('/businesses', async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereClause = '';
    const params = [];

    if (search) {
      whereClause = 'WHERE b.nombre ILIKE $1 OR b.tipo_negocio ILIKE $1';
      params.push(`%${search}%`);
    }

    const countResult = await queryOne(
      `SELECT COUNT(*)::int as count FROM businesses b ${whereClause}`,
      params
    );

    const businesses = await queryAll(
      `SELECT b.id, b.nombre, b.tipo_negocio, b.config, b.created_at, b.updated_at,
        (SELECT COUNT(*)::int FROM users WHERE business_id = b.id) as user_count,
        (SELECT COUNT(*)::int FROM products WHERE business_id = b.id) as product_count,
        (SELECT COUNT(*)::int FROM sales WHERE business_id = b.id) as sale_count
       FROM businesses b ${whereClause}
       ORDER BY b.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      data: businesses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult.count,
        totalPages: Math.ceil(countResult.count / parseInt(limit)),
      },
    });
  } catch (error) {
    logger.error('Admin list businesses error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// ── GET /api/admin/businesses/:id — Business details ──
router.get('/businesses/:id', async (req, res) => {
  try {
    const business = await queryOne(
      `SELECT b.*,
        (SELECT COUNT(*)::int FROM users WHERE business_id = b.id) as user_count,
        (SELECT COUNT(*)::int FROM products WHERE business_id = b.id) as product_count,
        (SELECT COUNT(*)::int FROM customers WHERE business_id = b.id) as customer_count,
        (SELECT COUNT(*)::int FROM suppliers WHERE business_id = b.id) as supplier_count,
        (SELECT COUNT(*)::int FROM sales WHERE business_id = b.id) as sale_count,
        (SELECT COALESCE(SUM(total), 0) FROM sales WHERE business_id = b.id) as total_sales_amount,
        (SELECT COALESCE(SUM(stock * costo), 0) FROM products WHERE business_id = b.id) as inventory_value
       FROM businesses b WHERE b.id = $1`,
      [req.params.id]
    );

    if (!business) {
      return res.status(404).json({ error: 'Negocio no encontrado' });
    }

    // Get admin user info
    const adminUser = await queryOne(
      'SELECT id, username, nombre, created_at FROM users WHERE business_id = $1 AND rol = $2',
      [req.params.id, 'admin']
    );

    res.json({ ...business, adminUser });
  } catch (error) {
    logger.error('Admin get business error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// ── DELETE /api/admin/businesses/:id — Delete business + all its data ──
router.delete('/businesses/:id', async (req, res) => {
  try {
    const business = await queryOne('SELECT id, nombre FROM businesses WHERE id = $1', [req.params.id]);
    if (!business) {
      return res.status(404).json({ error: 'Negocio no encontrado' });
    }

    // CASCADE will delete all related data (users, products, sales, etc.)
    await queryOne('DELETE FROM businesses WHERE id = $1 RETURNING id', [req.params.id]);

    logger.info('Business deleted by super admin', { businessId: req.params.id, businessName: business.nombre });

    res.json({ message: `Negocio "${business.nombre}" eliminado correctamente` });
  } catch (error) {
    logger.error('Admin delete business error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// ── GET /api/admin/users — List all users (across all businesses) ──
router.get('/users', async (req, res) => {
  try {
    const { search, business_id, page = 1, limit = 30 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions = ['u.rol != $1'];
    const params = ['super_admin'];
    let paramIndex = 2;

    if (search) {
      conditions.push(`(u.nombre ILIKE $${paramIndex} OR u.username ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (business_id) {
      conditions.push(`u.business_id = $${paramIndex}`);
      params.push(business_id);
      paramIndex++;
    }

    const whereClause = 'WHERE ' + conditions.join(' AND ');

    const countResult = await queryOne(
      `SELECT COUNT(*)::int as count FROM users u ${whereClause}`,
      params
    );

    const users = await queryAll(
      `SELECT u.id, u.username, u.nombre, u.rol, u.business_id, u.created_at,
        b.nombre as business_name
       FROM users u
       LEFT JOIN businesses b ON u.business_id = b.id
       ${whereClause}
       ORDER BY u.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult.count,
        totalPages: Math.ceil(countResult.count / parseInt(limit)),
      },
    });
  } catch (error) {
    logger.error('Admin list users error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// ── PUT /api/admin/users/:id — Update user info (super admin override) ──
router.put('/users/:id', async (req, res) => {
  try {
    const { nombre, username } = req.body;
    const userId = req.params.id;

    const user = await queryOne('SELECT id, rol FROM users WHERE id = $1', [userId]);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Cannot modify super_admin accounts
    if (user.rol === 'super_admin') {
      return res.status(403).json({ error: 'No puedes modificar la cuenta del super administrador' });
    }

    if (username) {
      const existing = await queryOne(
        'SELECT id FROM users WHERE username = $1 AND id != $2',
        [username, userId]
      );
      if (existing) {
        return res.status(400).json({ error: 'El nombre de usuario ya está en uso' });
      }
    }

    const updated = await queryOne(
      `UPDATE users SET nombre = COALESCE($1, nombre), username = COALESCE($2, username),
       updated_at = NOW() WHERE id = $3 RETURNING id, username, nombre, rol, business_id, created_at`,
      [nombre, username, userId]
    );

    logger.info('User updated by super admin', { userId, adminId: req.user.id });

    res.json(updated);
  } catch (error) {
    logger.error('Admin update user error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// ── PUT /api/admin/users/:id/reset-password — Reset user password ──
router.put('/users/:id/reset-password', async (req, res) => {
  try {
    const { newPassword } = req.body;
    const userId = req.params.id;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
    }

    const user = await queryOne('SELECT id, rol FROM users WHERE id = $1', [userId]);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (user.rol === 'super_admin') {
      return res.status(403).json({ error: 'No puedes resetear la contraseña del super administrador' });
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    await queryOne(
      'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, userId]
    );

    logger.info('Password reset by super admin', { userId, adminId: req.user.id });

    res.json({ message: 'Contraseña restablecida correctamente' });
  } catch (error) {
    logger.error('Admin reset password error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// ── DELETE /api/admin/users/:id — Delete user ──
router.delete('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await queryOne('SELECT id, rol FROM users WHERE id = $1', [userId]);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (user.rol === 'super_admin') {
      return res.status(403).json({ error: 'No puedes eliminar al super administrador' });
    }

    await queryOne('DELETE FROM users WHERE id = $1', [userId]);

    logger.info('User deleted by super admin', { userId, adminId: req.user.id });

    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    logger.error('Admin delete user error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
