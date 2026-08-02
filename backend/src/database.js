const { Pool } = require('pg');
const path = require('path');
const { logger } = require('./middleware/logger');

let db;
let lastHealthCheck = 0;
const HEALTH_CHECK_INTERVAL = 30000;

/**
 * PostgreSQL — Get or create the connection pool.
 */
function getPool() {
  if (!db) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is required for PostgreSQL mode');
    }
    // Neon (and most cloud PostgreSQL providers) require SSL for ALL connections.
    // Always enable SSL when DATABASE_URL is set, even in development.
    const isNeon = connectionString.includes('neon.tech');
    db = new Pool({
      connectionString,
      max: parseInt(process.env.PG_POOL_MAX || '10', 10),
      connectionTimeoutMillis: parseInt(process.env.PG_CONNECTION_TIMEOUT || '10000', 10),
      idleTimeoutMillis: parseInt(process.env.PG_IDLE_TIMEOUT || '30000', 10),
      ssl: isNeon || process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false,
    });
    db.__type = 'pg';
    db.on('error', (err) => logger.error('PostgreSQL pool error', { error: err.message }));
    db.on('connect', () => logger.info('PostgreSQL connection established'));
    db.on('remove', () => logger.info('PostgreSQL connection removed from pool'));
  }
  return db;
}

/**
 * SQLite — Lazy-init better-sqlite3 database.
 */
let _sqliteDb = null;
function getSQLite() {
  if (_sqliteDb) return _sqliteDb;
  const Database = require('better-sqlite3');
  // Allow tests/tools to point to an isolated DB (e.g. a temp file)
  const dbPath = process.env.SQLITE_DB_PATH || path.join(__dirname, '..', 'inventario.db');
  _sqliteDb = new Database(dbPath);
  _sqliteDb.pragma('journal_mode = WAL');
  _sqliteDb.pragma('foreign_keys = ON');
  logger.info(`SQLite database opened: ${dbPath}`);
  return _sqliteDb;
}

/**
 * AUTO-DETECT: returns { type: 'pg', client } or { type: 'sqlite', client }
 */
function getClient() {
  if (process.env.DATABASE_URL) {
    return { type: 'pg', client: getPool() };
  }
  return { type: 'sqlite', client: getSQLite() };
}

/**
 * Health check
 */
async function healthCheck() {
  const now = Date.now();
  if (lastHealthCheck && (now - lastHealthCheck) < HEALTH_CHECK_INTERVAL) {
    return { ok: true, latency: 0 };
  }
  const start = Date.now();
  try {
    const { type, client } = getClient();
    if (type === 'pg') {
      await client.query('SELECT 1');
    } else {
      client.prepare('SELECT 1').get();
    }
    lastHealthCheck = Date.now();
    return { ok: true, latency: lastHealthCheck - start };
  } catch (error) {
    logger.error('Database health check failed', { error: error.message });
    return { ok: false, latency: Date.now() - start, error: error.message };
  }
}

/**
 * Map a PostgreSQL date format string (e.g. 'YYYY-MM') to a SQLite
 * strftime format string (e.g. '%Y-%m').
 */
function pgFormatToStrftime(fmt) {
  return fmt
    .replace(/HH24/g, '%H')
    .replace(/HH12/g, '%I')
    .replace(/HH/g, '%I')
    .replace(/MI/g, '%M')
    .replace(/SS/g, '%S')
    .replace(/YYYY/g, '%Y')
    .replace(/YY/g, '%y')
    .replace(/Month/g, '%B')
    .replace(/Mon/g, '%b')
    .replace(/MM/g, '%m')
    .replace(/DDD/g, '%j')
    .replace(/DD/g, '%d')
    .replace(/Day/g, '%A')
    .replace(/DY/g, '%a')
    .replace(/WW/g, '%W')
    .replace(/AM/g, '%p')
    .replace(/PM/g, '%p');
}

/**
 * Convert PostgreSQL SQL syntax to SQLite-compatible syntax.
 * Handles:
 *  - $1, $2 placeholders → ?
 *  - NOW() → CURRENT_TIMESTAMP
 *  - NOW() - INTERVAL '6 months' → datetime('now', '-6 months')
 *  - TO_CHAR(col, 'YYYY-MM') → strftime('%Y-%m', col)
 *  - ::int, ::text, ::numeric etc → '' (remove cast)
 *  - ILIKE → LIKE (SQLite LIKE is case-insensitive for ASCII)
 *  - TIMESTAMPTZ → TEXT
 *  - SERIAL → INTEGER PRIMARY KEY AUTOINCREMENT (handled in schema)
 *  - RETURNING clause → keep as-is (SQLite 3.35+ supports it)
 */
function convertPgToSQLite(sql, params) {
  if (!params || params.length === 0) params = [];
  // Replace $1, $2, etc with ? AND expand params.
  // PostgreSQL allows re-referencing the same placeholder (e.g. $1 twice),
  // but SQLite requires a distinct ? value per occurrence — so push
  // params[N-1] for every occurrence of $N.
  // If the SQL uses literal ? placeholders (no $N), keep params untouched.
  const expanded = [];
  let matchedParam = false;
  let converted = sql.replace(/\$(\d+)/g, (m, num) => {
    matchedParam = true;
    expanded.push(params[parseInt(num, 10) - 1]);
    return '?';
  });
  // Replace NOW() with CURRENT_TIMESTAMP
  converted = converted.replace(/\bNOW\(\)/gi, "CURRENT_TIMESTAMP");
  // NOW() - INTERVAL '6 months' → datetime('now', '-6 months')
  converted = converted.replace(
    /(?:CURRENT_TIMESTAMP|CURRENT_DATE|CURRENT_TIME)\s*-\s*INTERVAL\s+'([^']+)'/gi,
    (m, interval) => `datetime('now', '-${interval.trim()}')`
  );
  // TO_CHAR(col, 'YYYY-MM') → strftime('%Y-%m', col)
  converted = converted.replace(
    /TO_CHAR\s*\(\s*([^,()]+?)\s*,\s*'([^']+)'\s*\)/gi,
    (m, expr, fmt) => `strftime('${pgFormatToStrftime(fmt)}', ${expr.trim()})`
  );
  // ::DATE casts → date() function (preserves day-boundary semantics:
  // created_at::DATE >= $1::DATE becomes date(created_at) >= date(?))
  converted = converted.replace(/([A-Za-z0-9_."\[\]]+)\s*::DATE\b/gi, 'date($1)');
  converted = converted.replace(/\?\s*::DATE\b/gi, 'date(?)');
  // Remove remaining PostgreSQL-style casts: ::int, ::text, ::numeric(12,2), etc
  converted = converted.replace(/::\w+(?:\(\d+(?:\s*,\s*\d+)?\))?/g, '');
  // ILIKE → LIKE
  converted = converted.replace(/\bILIKE\b/gi, 'LIKE');
  // Replace TIMESTAMPTZ with TEXT in column type contexts
  converted = converted.replace(/\bTIMESTAMPTZ\b/gi, 'TEXT');

  // better-sqlite3 only binds numbers, strings, bigints, buffers and null —
  // convert JS booleans to 1/0 so routes can pass es_delivery & friends.
  const rawParams = matchedParam ? expanded : params;
  const normalized = (Array.isArray(rawParams) ? rawParams : []).map((v) =>
    typeof v === 'boolean' ? (v ? 1 : 0) : v
  );
  return { sql: converted, params: normalized };
}

/**
 * Execute a query and return { rows }
 */
async function query(text, params = []) {
  const { type, client } = getClient();
  if (type === 'pg') {
    return await client.query(text, params);
  }
  // SQLite
  const { sql, params: p } = convertPgToSQLite(text, params);
  
  // Detect IF NOT EXISTS DO block (PostgreSQL-only) - skip for SQLite
  if (/^\s*DO\s+\$\$/i.test(sql.trim())) {
    return { rows: [] };
  }
  
  const stmt = client.prepare(sql);

  // better-sqlite3's Statement.reader is true for statements that return data
  // (SELECT, WITH ... SELECT, and INSERT/UPDATE/DELETE with RETURNING) and
  // false for plain writes — so no fragile keyword heuristics are needed.
  if (stmt.reader) {
    const rows = stmt.all(...p);
    return { rows };
  }
  
  // INSERT / UPDATE / DELETE (without RETURNING)
  const info = stmt.run(...p);
  return { rows: [], rowCount: info.changes, changes: info.changes, lastInsertRowid: info.lastInsertRowid };
}

/**
 * queryAll — return all rows
 */
async function queryAll(text, params = []) {
  const result = await query(text, params);
  return result.rows;
}

/**
 * queryOne — return first row or null
 */
async function queryOne(text, params = []) {
  const result = await query(text, params);
  return result.rows[0] || null;
}

/**
 * transaction — wrap in BEGIN/COMMIT/ROLLBACK
 */
async function transaction(callback) {
  const { type, client } = getClient();
  if (type === 'pg') {
    const pgClient = await client.connect();
    try {
      await pgClient.query('BEGIN');
      const result = await callback({
        query: (sql, p) => pgClient.query(sql, p),
        queryOne: async (sql, p) => {
          const r = await pgClient.query(sql, p);
          return r.rows[0] || null;
        },
      });
      await pgClient.query('COMMIT');
      return result;
    } catch (error) {
      await pgClient.query('ROLLBACK').catch(() => {});
      logger.error('Transaction rolled back', { error: error.message });
      throw error;
    } finally {
      pgClient.release();
    }
  }
  // SQLite — wrap in explicit BEGIN/COMMIT/ROLLBACK
  // Pass a fake client with .query() method to match PostgreSQL transaction API
  const fakeClient = {
    query: async (sql, p) => {
      const { sql: sql2, params: p2 } = convertPgToSQLite(sql, p || []);
      const stmt = client.prepare(sql2);
      if (stmt.reader) {
        return { rows: stmt.all(...p2) };
      }
      const info = stmt.run(...p2);
      return { rows: [], rowCount: info.changes, changes: info.changes, lastInsertRowid: info.lastInsertRowid };
    },
    queryOne: async (sql, p) => {
      const { sql: sql2, params: p2 } = convertPgToSQLite(sql, p || []);
      const row = client.prepare(sql2).get(...p2);
      return row || null;
    },
  };
  try {
    client.exec('BEGIN');
    const result = await callback(fakeClient);
    client.exec('COMMIT');
    return result;
  } catch (error) {
    try { client.exec('ROLLBACK'); } catch (e) { /* ignore rollback errors */ }
    logger.error('SQLite transaction rolled back', { error: error.message });
    throw error;
  }
}

/**
 * Initialize schema — creates all tables if they don't exist
 */
async function initSchema() {
  const { type, client } = getClient();
  const isPG = type === 'pg';

  try {
    if (isPG) {
      await client.query(`
        CREATE TABLE IF NOT EXISTS businesses (
          id SERIAL PRIMARY KEY,
          nombre TEXT NOT NULL,
          tipo_negocio TEXT DEFAULT 'general',
          config TEXT DEFAULT '{}',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          business_id INTEGER REFERENCES businesses(id) ON DELETE CASCADE,
          username TEXT NOT NULL,
          password TEXT NOT NULL,
          nombre TEXT NOT NULL,
          rol TEXT DEFAULT 'user',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(business_id, username)
        );
        CREATE TABLE IF NOT EXISTS categories (
          id SERIAL PRIMARY KEY,
          business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
          nombre TEXT NOT NULL,
          descripcion TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(business_id, nombre)
        );
        CREATE TABLE IF NOT EXISTS products (
          id SERIAL PRIMARY KEY,
          business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
          nombre TEXT NOT NULL,
          descripcion TEXT,
          sku TEXT NOT NULL,
          precio NUMERIC(12, 2) NOT NULL,
          costo NUMERIC(12, 2) DEFAULT 0,
          stock INTEGER DEFAULT 0,
          stock_minimo INTEGER DEFAULT 5,
          extra_data TEXT DEFAULT '{}',
          category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(business_id, sku)
        );
        CREATE TABLE IF NOT EXISTS customers (
          id SERIAL PRIMARY KEY,
          business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
          nombre TEXT NOT NULL,
          email TEXT,
          telefono TEXT,
          direccion TEXT,
          tipo_documento TEXT DEFAULT 'DNI',
          num_documento TEXT,
          puntos INTEGER DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS suppliers (
          id SERIAL PRIMARY KEY,
          business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
          nombre TEXT NOT NULL,
          contacto TEXT,
          email TEXT,
          telefono TEXT,
          direccion TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS sales (
          id SERIAL PRIMARY KEY,
          business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
          customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
          total NUMERIC(12, 2) NOT NULL,
          tipo_pago TEXT DEFAULT 'efectivo',
          estado TEXT DEFAULT 'completada',
          puntos_ganados INTEGER DEFAULT 0,
          puntos_usados INTEGER DEFAULT 0,
          es_delivery BOOLEAN DEFAULT FALSE,
          direccion_entrega TEXT,
          repartidor TEXT,
          estado_delivery TEXT DEFAULT 'pendiente',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS sale_items (
          id SERIAL PRIMARY KEY,
          sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
          product_id INTEGER NOT NULL REFERENCES products(id),
          cantidad INTEGER NOT NULL,
          precio_unitario NUMERIC(12, 2) NOT NULL,
          subtotal NUMERIC(12, 2) NOT NULL
        );
        CREATE TABLE IF NOT EXISTS purchases (
          id SERIAL PRIMARY KEY,
          business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
          supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
          product_id INTEGER NOT NULL REFERENCES products(id),
          cantidad INTEGER NOT NULL,
          costo_unitario NUMERIC(12, 2) NOT NULL,
          total NUMERIC(12, 2) NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS services (
          id SERIAL PRIMARY KEY,
          business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
          tipo TEXT NOT NULL DEFAULT 'carwash',
          nombre TEXT NOT NULL,
          tipo_vehiculo TEXT,
          placa TEXT,
          cliente_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
          precio NUMERIC(12, 2) NOT NULL DEFAULT 0,
          notas TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);
      await client.query(`
        DO $$ BEGIN
          CREATE INDEX IF NOT EXISTS idx_users_business ON users(business_id);
          CREATE INDEX IF NOT EXISTS idx_products_business ON products(business_id);
          CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
          CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
          CREATE INDEX IF NOT EXISTS idx_products_nombre ON products(nombre);
          CREATE INDEX IF NOT EXISTS idx_categories_business ON categories(business_id);
          CREATE INDEX IF NOT EXISTS idx_customers_business ON customers(business_id);
          CREATE INDEX IF NOT EXISTS idx_customers_telefono ON customers(telefono);
          CREATE INDEX IF NOT EXISTS idx_customers_nombre ON customers(nombre);
          CREATE INDEX IF NOT EXISTS idx_suppliers_business ON suppliers(business_id);
          CREATE INDEX IF NOT EXISTS idx_sales_business ON sales(business_id);
          CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
          CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(created_at);
          CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
          CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items(product_id);
          CREATE INDEX IF NOT EXISTS idx_purchases_business ON purchases(business_id);
          CREATE INDEX IF NOT EXISTS idx_purchases_supplier ON purchases(supplier_id);
          CREATE INDEX IF NOT EXISTS idx_purchases_product ON purchases(product_id);
          CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(created_at);
          CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);
          CREATE INDEX IF NOT EXISTS idx_services_business ON services(business_id);
          CREATE INDEX IF NOT EXISTS idx_services_tipo ON services(tipo);
          CREATE INDEX IF NOT EXISTS idx_services_date ON services(created_at);
        END $$;
      `);
      // Allow NULL business_id for super_admin users
      await client.query('ALTER TABLE users ALTER COLUMN business_id DROP NOT NULL').catch(() => {});
      // Migration: add updated_at to users for DBs created before it existed
      await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()').catch(() => {});
      // Migration: add tipo_vehiculo to services for DBs created before it existed
      await client.query('ALTER TABLE services ADD COLUMN IF NOT EXISTS tipo_vehiculo TEXT').catch(() => {});
      // Migration: delivery columns on sales for DBs created before it existed
      await client.query('ALTER TABLE sales ADD COLUMN IF NOT EXISTS es_delivery BOOLEAN DEFAULT FALSE').catch(() => {});
      await client.query('ALTER TABLE sales ADD COLUMN IF NOT EXISTS direccion_entrega TEXT').catch(() => {});
      await client.query('ALTER TABLE sales ADD COLUMN IF NOT EXISTS repartidor TEXT').catch(() => {});
      await client.query("ALTER TABLE sales ADD COLUMN IF NOT EXISTS estado_delivery TEXT DEFAULT 'pendiente'").catch(() => {});
      // Migration: updated_at on sales for DBs created before it existed
      await client.query('ALTER TABLE sales ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()').catch(() => {});
    } else {
      // ——— SQLite schema ———
      client.exec(`
        CREATE TABLE IF NOT EXISTS businesses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nombre TEXT NOT NULL,
          tipo_negocio TEXT DEFAULT 'general',
          config TEXT DEFAULT '{}',
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          business_id INTEGER REFERENCES businesses(id) ON DELETE CASCADE,
          username TEXT NOT NULL,
          password TEXT NOT NULL,
          nombre TEXT NOT NULL,
          rol TEXT DEFAULT 'user',
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now')),
          UNIQUE(business_id, username)
        );
        CREATE TABLE IF NOT EXISTS categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
          nombre TEXT NOT NULL,
          descripcion TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now')),
          UNIQUE(business_id, nombre)
        );
        CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
          nombre TEXT NOT NULL,
          descripcion TEXT,
          sku TEXT NOT NULL,
          precio REAL NOT NULL,
          costo REAL DEFAULT 0,
          stock INTEGER DEFAULT 0,
          stock_minimo INTEGER DEFAULT 5,
          extra_data TEXT DEFAULT '{}',
          category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now')),
          UNIQUE(business_id, sku)
        );
        CREATE TABLE IF NOT EXISTS customers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
          nombre TEXT NOT NULL,
          email TEXT,
          telefono TEXT,
          direccion TEXT,
          tipo_documento TEXT DEFAULT 'DNI',
          num_documento TEXT,
          puntos INTEGER DEFAULT 0,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS suppliers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
          nombre TEXT NOT NULL,
          contacto TEXT,
          email TEXT,
          telefono TEXT,
          direccion TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS sales (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
          customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
          total REAL NOT NULL,
          tipo_pago TEXT DEFAULT 'efectivo',
          estado TEXT DEFAULT 'completada',
          puntos_ganados INTEGER DEFAULT 0,
          puntos_usados INTEGER DEFAULT 0,
          es_delivery INTEGER DEFAULT 0,
          direccion_entrega TEXT,
          repartidor TEXT,
          estado_delivery TEXT DEFAULT 'pendiente',
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS sale_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
          product_id INTEGER NOT NULL REFERENCES products(id),
          cantidad INTEGER NOT NULL,
          precio_unitario REAL NOT NULL,
          subtotal REAL NOT NULL
        );
        CREATE TABLE IF NOT EXISTS purchases (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
          supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
          product_id INTEGER NOT NULL REFERENCES products(id),
          cantidad INTEGER NOT NULL,
          costo_unitario REAL NOT NULL,
          total REAL NOT NULL,
          created_at TEXT DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS services (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
          tipo TEXT NOT NULL DEFAULT 'carwash',
          nombre TEXT NOT NULL,
          tipo_vehiculo TEXT,
          placa TEXT,
          cliente_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
          precio REAL NOT NULL DEFAULT 0,
          notas TEXT,
          created_at TEXT DEFAULT (datetime('now'))
        );
        CREATE INDEX IF NOT EXISTS idx_users_business ON users(business_id);
        CREATE INDEX IF NOT EXISTS idx_products_business ON products(business_id);
        CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
        CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
        CREATE INDEX IF NOT EXISTS idx_products_nombre ON products(nombre);
        CREATE INDEX IF NOT EXISTS idx_categories_business ON categories(business_id);
        CREATE INDEX IF NOT EXISTS idx_customers_business ON customers(business_id);
        CREATE INDEX IF NOT EXISTS idx_customers_telefono ON customers(telefono);
        CREATE INDEX IF NOT EXISTS idx_customers_nombre ON customers(nombre);
        CREATE INDEX IF NOT EXISTS idx_suppliers_business ON suppliers(business_id);
        CREATE INDEX IF NOT EXISTS idx_sales_business ON sales(business_id);
        CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
        CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(created_at);
        CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
        CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items(product_id);
        CREATE INDEX IF NOT EXISTS idx_purchases_business ON purchases(business_id);
        CREATE INDEX IF NOT EXISTS idx_purchases_supplier ON purchases(supplier_id);
        CREATE INDEX IF NOT EXISTS idx_purchases_product ON purchases(product_id);
        CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(created_at);
        CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);
        CREATE INDEX IF NOT EXISTS idx_services_business ON services(business_id);
        CREATE INDEX IF NOT EXISTS idx_services_tipo ON services(tipo);
        CREATE INDEX IF NOT EXISTS idx_services_date ON services(created_at);
      `);
      // Allow NULL business_id for super_admin users (SQLite)
      // better-sqlite3 can't ALTER COLUMN DROP NOT NULL, but CREATE TABLE IF NOT EXISTS
      // won't recreate if table exists. Migration handled via manual step if needed.

      // Migration: add updated_at to users for DBs created before it existed
      // NOTE: SQLite forbids ADD COLUMN with a parenthesized-expression default
      // (e.g. DEFAULT (datetime('now'))), so add without DEFAULT — the column
      // only gets written on UPDATE and can be NULL initially.
      try {
        client.exec('ALTER TABLE users ADD COLUMN updated_at TEXT');
        logger.info('Migration: added users.updated_at (SQLite)');
      } catch (e) {
        if (!/duplicate column/i.test(e.message)) {
          logger.warn('Migration users.updated_at (SQLite) skipped: ' + e.message);
        }
      }

      // Migration: add tipo_vehiculo to services for DBs created before it existed
      try {
        client.exec('ALTER TABLE services ADD COLUMN tipo_vehiculo TEXT');
        logger.info('Migration: added services.tipo_vehiculo (SQLite)');
      } catch (e) {
        // Column already exists
      }

      // Migration: delivery columns on sales for DBs created before it existed
      try {
        client.exec('ALTER TABLE sales ADD COLUMN es_delivery INTEGER DEFAULT 0');
        logger.info('Migration: added sales.es_delivery (SQLite)');
      } catch (e) { /* Column already exists */ }
      try {
        client.exec('ALTER TABLE sales ADD COLUMN direccion_entrega TEXT');
      } catch (e) { /* Column already exists */ }
      try {
        client.exec('ALTER TABLE sales ADD COLUMN repartidor TEXT');
      } catch (e) { /* Column already exists */ }
      try {
        client.exec("ALTER TABLE sales ADD COLUMN estado_delivery TEXT DEFAULT 'pendiente'");
        logger.info('Migration: added sales.estado_delivery (SQLite)');
      } catch (e) { /* Column already exists */ }
      // Migration: updated_at on sales for DBs created before it existed
      // NOTE: SQLite forbids ADD COLUMN with a parenthesized-expression default
      // (e.g. DEFAULT (datetime('now'))), so add without DEFAULT — the column
      // only gets written on UPDATE and can be NULL initially.
      try {
        client.exec('ALTER TABLE sales ADD COLUMN updated_at TEXT');
        logger.info('Migration: added sales.updated_at (SQLite)');
      } catch (e) {
        if (!/duplicate column/i.test(e.message)) {
          logger.warn('Migration sales.updated_at (SQLite) skipped: ' + e.message);
        }
      }
    }
    logger.info(`Schema initialized (${isPG ? 'PostgreSQL' : 'SQLite'})`);
  } catch (error) {
    logger.error('Schema initialization failed', { error: error.message });
    throw error;
  }
}

module.exports = {
  getPool,
  query,
  queryAll,
  queryOne,
  transaction,
  initSchema,
  healthCheck,
};
