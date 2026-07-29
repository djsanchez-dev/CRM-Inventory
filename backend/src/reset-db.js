/**
 * ⚠️ DEPRECATED — Este script es para SQLite local únicamente.
 * Para PostgreSQL, usa los endpoints de la API o un script de migración.
 * 
 * Script de limpieza total de datos (SQLite)
 * Elimina todos los registros de la base de datos y configura la moneda a PEN.
 * 
 * Mantiene:
 *  - El negocio registrado (con moneda actualizada a PEN)
 *  - El usuario administrador (admin/admin123)
 * 
 * Uso (solo SQLite): node backend/src/reset-db.js
 */

const { getDB, initDB } = require('./database');
const path = require('path');
const fs = require('fs');

function resetDatabase() {
  console.log('═══════════════════════════════════════════');
  console.log('   LIMPIEZA TOTAL DE BASE DE DATOS');
  console.log('═══════════════════════════════════════════\n');

  // 1. Verificar que el archivo DB existe
  const dbPath = path.join(__dirname, '..', 'inventario.db');
  if (!fs.existsSync(dbPath)) {
    console.log('❌ No se encontró la base de datos en:', dbPath);
    console.log('   Ejecute primero el servidor para inicializarla.');
    process.exit(1);
  }

  // 2. Inicializar conexión
  initDB();
  const db = getDB();

  // 3. Obtener datos actuales
  const counts = db.prepare(`
    SELECT 'sale_items' AS tabla, COUNT(*) AS cantidad FROM sale_items
    UNION ALL SELECT 'purchases', COUNT(*) FROM purchases
    UNION ALL SELECT 'sales', COUNT(*) FROM sales
    UNION ALL SELECT 'products', COUNT(*) FROM products
    UNION ALL SELECT 'customers', COUNT(*) FROM customers
    UNION ALL SELECT 'categories', COUNT(*) FROM categories
    UNION ALL SELECT 'suppliers', COUNT(*) FROM suppliers
    UNION ALL SELECT 'users', COUNT(*) FROM users
    UNION ALL SELECT 'businesses', COUNT(*) FROM businesses
  `).all();

  console.log('📊 Estado actual de la base de datos:\n');
  let totalRegistros = 0;
  for (const row of counts) {
    console.log(`   ${row.tabla.padEnd(15)} → ${String(row.cantidad).padStart(4)} registros`);
    totalRegistros += row.cantidad;
  }
  console.log(`   ${'─'.repeat(22)}`);
  console.log(`   TOTAL${' '.repeat(11)} → ${String(totalRegistros).padStart(4)} registros\n`);

  // 4. Guardar información del negocio y admin antes de limpiar
  const business = db.prepare('SELECT id, nombre, tipo_negocio, config FROM businesses ORDER BY id LIMIT 1').get();
  const admin = db.prepare('SELECT id, username, nombre, rol FROM users WHERE rol = ? ORDER BY id LIMIT 1').get('admin');

  if (!business) {
    console.log('❌ No hay ningún negocio registrado. No se puede continuar.');
    process.exit(1);
  }

  if (!admin) {
    console.log('⚠️  No se encontró usuario administrador. Se mantendrán los usuarios existentes.');
  }

  console.log('🔍 Registros que se conservarán:');
  console.log(`   • Negocio:  ${business.nombre} (ID: ${business.id})`);
  console.log(`   • Admin:    ${admin ? `${admin.username} / ${admin.nombre}` : 'No encontrado'}`);
  console.log('');

  // 5. Ejecutar limpieza en transacción
  console.log('🧹 Eliminando datos...');

  const cleanup = db.transaction(() => {
    // Orden correcto respetando foreign keys
    db.prepare('DELETE FROM sale_items').run();
    console.log('   ✓ sale_items eliminados');

    db.prepare('DELETE FROM purchases').run();
    console.log('   ✓ purchases eliminados');

    db.prepare('DELETE FROM sales').run();
    console.log('   ✓ sales eliminados');

    db.prepare('DELETE FROM products').run();
    console.log('   ✓ products eliminados');

    db.prepare('DELETE FROM customers').run();
    console.log('   ✓ customers eliminados');

    db.prepare('DELETE FROM categories').run();
    console.log('   ✓ categories eliminados');

    db.prepare('DELETE FROM suppliers').run();
    console.log('   ✓ suppliers eliminados');

    // Eliminar usuarios NO admin
    const deleteUsers = db.prepare('DELETE FROM users WHERE rol != ?');
    const deletedUsers = deleteUsers.run('admin');
    if (deletedUsers.changes > 0) {
      console.log(`   ✓ ${deletedUsers.changes} usuario(s) no-admin eliminados`);
    } else {
      console.log('   ✓ No había usuarios no-admin que eliminar');
    }

    // 6. Resetear auto-increment de tablas limpiadas
    const tablasAResetear = ['sale_items', 'purchases', 'sales', 'products', 'customers', 'categories', 'suppliers', 'users'];
    for (const tabla of tablasAResetear) {
      db.prepare(`DELETE FROM sqlite_sequence WHERE name = ?`).run(tabla);
    }
    console.log('\n   🔄 Auto-increment reseteados');

    // 7. Actualizar moneda a Soles (PEN)
    console.log('\n💰 Actualizando moneda a Soles Peruanos (PEN)...');
    
    let configObj;
    try {
      configObj = JSON.parse(business.config || '{}');
    } catch (e) {
      configObj = {};
    }
    
    configObj.moneda = 'PEN';
    configObj.updated_at = new Date().toISOString();
    
    db.prepare('UPDATE businesses SET config = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(JSON.stringify(configObj), business.id);
    
    console.log('   ✓ Moneda configurada a PEN (Soles)');
  });

  cleanup();

  // 8. Verificar resultado
  console.log('\n═══════════════════════════════════════════');
  console.log('   ✅ ¡BASE DE DATOS LIMPIADA EXITOSAMENTE!');
  console.log('═══════════════════════════════════════════\n');

  const newCounts = db.prepare(`
    SELECT 'sale_items' AS tabla, COUNT(*) AS cantidad FROM sale_items
    UNION ALL SELECT 'purchases', COUNT(*) FROM purchases
    UNION ALL SELECT 'sales', COUNT(*) FROM sales
    UNION ALL SELECT 'products', COUNT(*) FROM products
    UNION ALL SELECT 'customers', COUNT(*) FROM customers
    UNION ALL SELECT 'categories', COUNT(*) FROM categories
    UNION ALL SELECT 'suppliers', COUNT(*) FROM suppliers
    UNION ALL SELECT 'users', COUNT(*) FROM users
    UNION ALL SELECT 'businesses', COUNT(*) FROM businesses
  `).all();

  console.log('📊 Estado final:\n');
  for (const row of newCounts) {
    console.log(`   ${row.tabla.padEnd(15)} → ${String(row.cantidad).padStart(4)} registros`);
  }
  console.log('');

  console.log('🔑 Credenciales de acceso:');
  console.log(`   Usuario:  ${admin ? admin.username : 'admin'}`);
  console.log(`   Password: admin123`);
  console.log(`   Moneda:   S/ PEN (Soles)`);
  console.log('');
  console.log('📝 Puede empezar a agregar sus productos, clientes y proveedores desde la aplicación.');
  console.log('');
}

resetDatabase();
