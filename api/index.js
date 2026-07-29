const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { initSchema } = require('../backend/src/database');
const authMiddleware = require('../backend/src/middleware/auth');

const app = express();

// Security headers
app.use(helmet());

// CORS — build origin from VERCEL_URL or FRONTEND_URL
const frontendOrigin = process.env.FRONTEND_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:5173');

const corsOptions = {
  origin: frontendOrigin,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Rate limiting
app.set('trust proxy', 1);
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.RATE_LIMIT_MAX || 2000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Intente de nuevo más tarde.' },
});
app.use(limiter);

// Body parser
app.use(express.json({ limit: '100kb' }));

// ============================================
// Schema initialization middleware
// Ensures database tables exist before processing requests
// Prevents cold-start race condition
// ============================================
let schemaReady = false;
let schemaPromise = null;

async function ensureSchema(req, res, next) {
  if (schemaReady) return next();

  if (!schemaPromise) {
    schemaPromise = initSchema().then(() => {
      schemaReady = true;
    }).catch(err => {
      console.error('Schema init failed:', err.message);
      schemaPromise = null;
      throw err;
    });
  }

  try {
    await schemaPromise;
    next();
  } catch (err) {
    res.status(503).json({ error: 'Base de datos no disponible. Intente de nuevo.' });
  }
}

app.use(ensureSchema);

// ============================================
// Routes
// ============================================

// Public routes
app.use('/api/auth', require('../backend/src/routes/auth'));
app.use('/api/business', require('../backend/src/routes/business'));

// Protected routes (require JWT)
app.use('/api/products', authMiddleware, require('../backend/src/routes/products'));
app.use('/api/categories', authMiddleware, require('../backend/src/routes/categories'));
app.use('/api/customers', authMiddleware, require('../backend/src/routes/customers'));
app.use('/api/suppliers', authMiddleware, require('../backend/src/routes/suppliers'));
app.use('/api/sales', authMiddleware, require('../backend/src/routes/sales'));
app.use('/api/purchases', authMiddleware, require('../backend/src/routes/purchases'));
app.use('/api/dashboard', authMiddleware, require('../backend/src/routes/dashboard'));
app.use('/api/reports', authMiddleware, require('../backend/src/routes/reports'));
app.use('/api/users', authMiddleware, require('../backend/src/routes/users'));

// 404 handler for unknown API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: `Ruta no encontrada: ${req.method} ${req.originalUrl}`
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack || err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor'
  });
});

// Export for Vercel serverless — NO app.listen()
module.exports = app;
