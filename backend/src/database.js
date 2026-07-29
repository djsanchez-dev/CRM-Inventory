const { Pool } = require('pg');

let pool;

/**
 * Get or create the PostgreSQL connection pool.
 * Singleton pattern — survives serverless cold starts.
 */
function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      // Max concurrent clients — generous for serverless
      max: 10,
      // Connection timeout 10s
      connectionTimeoutMillis: 10000,
      // Idle timeout — helps with cold starts
      idleTimeoutMillis: 30000,
    });

    pool.on('error', (err) => {
      console.error('Unexpected PostgreSQL pool error:', err.message);
    });
  }
  return pool;
}

/**
 * Execute a query and return the full result object.
 * @param {string} text - SQL query with $1, $2 placeholders
 * @param {Array} [params] - Query parameters
 * @returns {Promise<import('pg').QueryResult>}
 */
async function query(text, params = []) {
  const client = getPool();
  try {
    return await client.query(text, params);
  } catch (error) {
    console.error('Database query error:', error.message);
    console.error('Query:', text.substring(0, 200));
    throw error;
  }
}

/**
 * Execute a query and return all rows.
 * @returns {Promise<Array>}
 */
async function queryAll(text, params = []) {
  const result = await query(text, params);
  return result.rows;
}

/**
 * Execute a query and return the first row (or null).
 * @returns {Promise<Object|null>}
 */
async function queryOne(text, params = []) {
  const result = await query(text, params);
  return result.rows[0] || null;
}

/**
 * Execute a function within a database transaction.
 * @param {Function} callback - async (client) => { ... return result; }
 * @returns {Promise<any>}
 */
async function transaction(callback) {
  const client = getPool();
  const pgClient = await client.connect();
  try {
    await pgClient.query('BEGIN');
    const result = await callback(pgClient);
    await pgClient.query('COMMIT');
    return result;
  } catch (error) {
    await pgClient.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    pgClient.release();
  }
}

/**
 * Initialize or migrate the database schema.
 * Called on cold start to ensure all tables and indexes exist.
 */
async function initSchema() {
  // Only run if DATABASE_URL is set (skip for dev without DB)
  if (!process.env.DATABASE_URL) {
    console.log('✓ DATABASE_URL not set — skipping schema initialization');
    return;
  }

  const client = getPool();
  
  try {
    await client.query(`
      -- ============================================
      -- CRM Inventory System — PostgreSQL Schema
      -- Compatible with Neon Serverless PostgreSQL
      -- ============================================

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
        business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
        username TEXT NOT NULL,
        password TEXT NOT NULL,
        nombre TEXT NOT NULL,
        rol TEXT DEFAULT 'user',
        created_at TIMESTAMPTZ DEFAULT NOW(),
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
        created_at TIMESTAMPTZ DEFAULT NOW()
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
    `);

    // Create indexes (IF NOT EXISTS not available for indexes in PG, use DO block)
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
      END $$;
    `);

    console.log('✓ PostgreSQL schema initialized');
  } catch (error) {
    console.error('Schema initialization error:', error.message);
    throw error;
  }
}

module.exports = { getPool, query, queryAll, queryOne, transaction, initSchema };
