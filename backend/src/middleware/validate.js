const { body, query, param, validationResult } = require('express-validator');
const { logger } = require('./logger');

/**
 * Middleware to check validation results and return errors
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));

    logger.warn('Validation failed', {
      path: req.originalUrl,
      errors: formatted,
    });

    return res.status(400).json({
      error: 'Datos inválidos',
      details: formatted,
    });
  }
  next();
}

/**
 * Pre-built validation rule sets for common scenarios
 */
const rules = {
  /** Auth validations */
  login: [
    body('username').notEmpty().withMessage('Usuario es requerido').trim(),
    body('password').notEmpty().withMessage('Contraseña es requerida'),
  ],

  register: [
    body('username').notEmpty().withMessage('Usuario es requerido').trim(),
    body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('nombre').notEmpty().withMessage('Nombre es requerido').trim(),
    body('rol').optional().isIn(['admin', 'user']).withMessage('Rol inválido'),
  ],

  /** Product validations */
  product: [
    body('nombre').notEmpty().withMessage('Nombre es requerido').trim(),
    body('sku').notEmpty().withMessage('SKU es requerido').trim(),
    body('precio').isFloat({ min: 0 }).withMessage('Precio debe ser un número positivo'),
    body('costo').optional({ values: 'null' }).isFloat({ min: 0 }).withMessage('Costo debe ser un número positivo'),
    body('stock').optional({ values: 'null' }).isInt({ min: 0 }).withMessage('Stock debe ser un entero positivo'),
    body('stock_minimo').optional({ values: 'null' }).isInt({ min: 0 }).withMessage('Stock mínimo debe ser un entero positivo'),
    body('category_id').optional({ values: 'null' }).isInt().withMessage('Categoría inválida'),
  ],

  /** Category validations */
  category: [
    body('nombre').notEmpty().withMessage('Nombre es requerido').trim(),
    body('descripcion').optional().trim(),
  ],

  /** Customer validations */
  customer: [
    body('nombre').notEmpty().withMessage('Nombre es requerido').trim(),
    body('email').optional({ values: 'null' }).isEmail().withMessage('Email inválido').normalizeEmail(),
    body('telefono').optional({ values: 'null' }).trim(),
    body('direccion').optional({ values: 'null' }).trim(),
    body('tipo_documento').optional().isIn(['DNI', 'CE', 'RUC', 'PASAPORTE']).withMessage('Tipo de documento inválido'),
    body('num_documento').optional({ values: 'null' }).trim(),
  ],

  quickCustomer: [
    body('nombre').notEmpty().withMessage('Nombre es requerido').trim(),
    body('telefono').optional({ values: 'null' }).trim(),
  ],

  /** Supplier validations */
  supplier: [
    body('nombre').notEmpty().withMessage('Nombre es requerido').trim(),
    body('contacto').optional({ values: 'null' }).trim(),
    body('email').optional({ values: 'null' }).isEmail().withMessage('Email inválido').normalizeEmail(),
    body('telefono').optional({ values: 'null' }).trim(),
    body('direccion').optional({ values: 'null' }).trim(),
  ],

  /** Sale validations */
  sale: [
    body('items').isArray({ min: 1 }).withMessage('La venta debe tener al menos un producto'),
    body('items.*.product_id').isInt().withMessage('ID de producto inválido'),
    body('items.*.cantidad').isInt({ min: 1 }).withMessage('Cantidad debe ser mayor a 0'),
    body('customer_id').optional({ values: 'null' }).isInt().withMessage('Cliente inválido'),
    body('tipo_pago').optional().isIn(['efectivo', 'tarjeta', 'transferencia', 'yape', 'plin']).withMessage('Tipo de pago inválido'),
    body('descuento').optional({ values: 'null' }).isFloat({ min: 0 }).withMessage('Descuento inválido'),
    body('puntos_usados').optional({ values: 'null' }).isInt({ min: 0 }).withMessage('Puntos inválidos'),
  ],

  /** Purchase validations */
  purchase: [
    body('product_id').isInt().withMessage('Producto es requerido'),
    body('cantidad').isInt({ min: 1 }).withMessage('Cantidad debe ser mayor a 0'),
    body('costo_unitario').isFloat({ min: 0 }).withMessage('Costo unitario debe ser un número positivo'),
    body('supplier_id').optional({ values: 'null' }).isInt().withMessage('Proveedor inválido'),
  ],

  /** Business setup validation */
  businessSetup: [
    body('businessName').notEmpty().withMessage('Nombre del negocio es requerido').trim(),
    body('adminUsername').notEmpty().withMessage('Usuario administrador es requerido').trim(),
    body('adminPassword').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('adminName').notEmpty().withMessage('Nombre del administrador es requerido').trim(),
    body('businessType').optional().trim(),
    body('moneda').optional().isIn(['PEN', 'USD', 'MXN', 'COP', 'CLP', 'ARS', 'EUR', 'BOB']).withMessage('Moneda inválida'),
  ],

  /** Pagination validations */
  pagination: [
    query('page').optional().isInt({ min: 1 }).withMessage('Página debe ser un número positivo').toInt(),
    query('limit').optional().isInt({ min: 1, max: 500 }).withMessage('Límite debe ser entre 1 y 500').toInt(),
  ],

  /** ID param validation */
  id: [
    param('id').isInt().withMessage('ID inválido').toInt(),
  ],

  /** Search query validation */
  search: [
    query('search').optional().trim(),
    query('category').optional().trim(),
    query('low_stock').optional().isBoolean().withMessage('low_stock debe ser true o false'),
    query('startDate').optional().isISO8601().withMessage('startDate debe ser una fecha válida'),
    query('endDate').optional().isISO8601().withMessage('endDate debe ser una fecha válida'),
    query('customer_id').optional().isInt().withMessage('customer_id inválido'),
    query('supplier_id').optional().isInt().withMessage('supplier_id inválido'),
  ],
};

module.exports = { validate, rules };
