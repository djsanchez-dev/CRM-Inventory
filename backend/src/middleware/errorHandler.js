const { logger } = require('./logger');

/**
 * Custom application error with status code
 */
class AppError extends Error {
  constructor(message, status = 500, details = null) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.details = details;
  }
}

/**
 * Error classification map
 */
const ERROR_MAP = {
  '23505': { status: 409, message: 'El registro ya existe' },
  '23503': { status: 409, message: 'El registro está siendo utilizado por otros datos' },
  '23502': { status: 400, message: 'Faltan campos requeridos' },
  '22P02': { status: 400, message: 'Formato de dato inválido' },
  '42P01': { status: 500, message: 'Error interno de base de datos' },
  '40001': { status: 503, message: 'Conflicto de concurrencia. Intente de nuevo.' },
  '40P01': { status: 503, message: 'Deadlock detectado. Intente de nuevo.' },
};

/**
 * Global error handling middleware
 * Classifies errors by type and returns standardized responses
 */
function errorHandler(err, req, res, next) {
  // Log the error
  logger.error(err.message, {
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
    status: err.status || 500,
  });

  // Handle known error types
  if (err.code && ERROR_MAP[err.code]) {
    const mapped = ERROR_MAP[err.code];
    return res.status(mapped.status).json({
      error: mapped.message,
      detail: process.env.NODE_ENV === 'development' ? err.detail : undefined,
    });
  }

  // Handle validation errors from express-validator
  if (err.type === 'validation') {
    return res.status(400).json({
      error: 'Datos inválidos',
      details: err.errors,
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError' || err.name === 'NotBeforeError') {
    const messages = {
      'TokenExpiredError': 'Token expirado',
      'NotBeforeError': 'Token aún no válido',
      'JsonWebTokenError': 'Token inválido',
    };
    return res.status(401).json({
      error: messages[err.name] || 'Token inválido',
    });
  }

  // Handle AppError
  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: err.message,
      details: err.details,
    });
  }

  // Default server error
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Error interno del servidor'
      : err.message,
  });
}

module.exports = { errorHandler, AppError };
