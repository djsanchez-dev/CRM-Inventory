const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { initSchema, healthCheck } = require('../backend/src/database');
const authMiddleware = require('../backend/src/middleware/auth');
const { requestLogger, logger } = require('../backend/src/middleware/logger');
const { errorHandler } = require('../backend/src/middleware/errorHandler');

const app = express();

// ============================================
// Security & Middleware Setup
// ============================================

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false, // Disabled for API
}));

// CORS — build origin from VERCEL_URL or FRONTEND_URL
const frontendOrigin = process.env.FRONTEND_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:5173');

app.use(cors({
  origin: [frontendOrigin, 'http://localhost:5173', 'http://localhost:4173'].filter(Boolean),
  credentials: true,
  optionsSuccessStatus: 200,
}));

// Trust proxy for rate limiting behind Vercel/reverse proxy
app.set('trust proxy', 1);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX || '2000', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Intente de nuevo más tarde.' },
});
app.use(limiter);

// Body parser with size limit
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// Request logging
app.use(requestLogger);

// ============================================
// Health Check Endpoint
// ============================================
app.get('/api/health', async (req, res) => {
  const dbHealth = await healthCheck();
  res.json({
    status: dbHealth.ok ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    database: dbHealth,
    memory: process.env.NODE_ENV === 'development' ? {
      usage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
    } : undefined,
  });
});

// ============================================
// Schema initialization middleware
// Ensures database tables exist before processing requests
// ============================================
let schemaReady = false;
let schemaPromise = null;

async function ensureSchema(req, res, next) {
  if (schemaReady) return next();

  if (!schemaPromise) {
    schemaPromise = initSchema().then(() => {
      schemaReady = true;
      logger.info('Schema initialized, system ready');
    }).catch(err => {
      logger.error('Schema initialization failed', { error: err.message });
      schemaPromise = null;
      throw err;
    });
  }

  try {
    await schemaPromise;
    next();
  } catch (err) {
    res.status(503).json({
      error: 'Base de datos no disponible. Intente de nuevo.',
      detail: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
}

app.use(ensureSchema);

// ============================================
// Public Routes
// ============================================
app.use('/api/auth', require('../backend/src/routes/auth'));
app.use('/api/business', require('../backend/src/routes/business'));

// ============================================
// Protected Routes (require JWT)
// ============================================
app.use('/api/products', authMiddleware, require('../backend/src/routes/products'));
app.use('/api/categories', authMiddleware, require('../backend/src/routes/categories'));
app.use('/api/customers', authMiddleware, require('../backend/src/routes/customers'));
app.use('/api/suppliers', authMiddleware, require('../backend/src/routes/suppliers'));
app.use('/api/sales', authMiddleware, require('../backend/src/routes/sales'));
app.use('/api/purchases', authMiddleware, require('../backend/src/routes/purchases'));
app.use('/api/services', authMiddleware, require('../backend/src/routes/services'));
app.use('/api/dashboard', authMiddleware, require('../backend/src/routes/dashboard'));
app.use('/api/reports', authMiddleware, require('../backend/src/routes/reports'));
app.use('/api/users', authMiddleware, require('../backend/src/routes/users'));
app.use('/api/admin', authMiddleware, require('../backend/src/routes/admin'));

// ============================================
// 404 handler for unknown API routes
// ============================================
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
});

// ============================================
// Error handling middleware (must be last)
// ============================================
app.use(errorHandler);

// ============================================
// Self-start when run directly (not in Vercel serverless)
// ============================================
if (!process.env.VERCEL) {
  const PORT = parseInt(process.env.PORT || '3001', 10);
  const server = app.listen(PORT, () => {
    console.log(`✓ Backend ready at http://localhost:${PORT}`);
  });
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`✓ Backend already running on port ${PORT}`);
    } else {
      console.error('✖ Backend failed to start:', err.message);
    }
  });
}

// Export for Vercel serverless
module.exports = app;
