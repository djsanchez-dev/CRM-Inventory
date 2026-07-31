/**
 * seed-admin.js — Create the first super_admin account
 *
 * Usage:
 *   node backend/src/seed-admin.js
 *   node backend/src/seed-admin.js --username=admin --password=secreto123 --nombre="Super Admin"
 *
 * If no arguments are provided, it will prompt interactively.
 * If a super_admin already exists, it will show a message and exit.
 */

const bcrypt = require('bcryptjs');
const path = require('path');

// Load dotenv if available (for DATABASE_URL)
try {
  require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
} catch (e) {
  // dotenv not installed, that's ok
}

const { queryOne } = require('./database');
const { logger } = require('./middleware/logger');

async function main() {
  // Parse CLI args
  const args = process.argv.slice(2);
  const getArg = (name) => {
    const arg = args.find(a => a.startsWith(`--${name}=`));
    return arg ? arg.split('=')[1] : null;
  };

  let username = getArg('username');
  let password = getArg('password');
  let nombre = getArg('nombre');

  // Check if super_admin already exists
  const existing = await queryOne("SELECT id FROM users WHERE rol = 'super_admin'");
  if (existing) {
    console.log('✓ Ya existe un super administrador en el sistema.');
    process.exit(0);
  }

  // Interactive prompt if no args
  if (!username || !password || !nombre) {
    const readline = require('readline');
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

    const ask = (q) => new Promise(resolve => rl.question(q, resolve));

    if (!username) username = await ask('Usuario del super admin: ');
    if (!nombre) nombre = await ask('Nombre del super admin: ');
    if (!password) {
      const pw1 = await ask('Contraseña (mín. 6 caracteres): ');
      const pw2 = await ask('Confirmar contraseña: ');
      if (pw1 !== pw2) { console.error('✖ Las contraseñas no coinciden'); process.exit(1); }
      password = pw1;
    }
    rl.close();
  }

  if (!username || !password || !nombre) {
    console.error('✖ Faltan datos. Uso: node seed-admin.js --username=X --password=Y --nombre=Z');
    process.exit(1);
  }

  if (password.length < 6) {
    console.error('✖ La contraseña debe tener al menos 6 caracteres');
    process.exit(1);
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  await queryOne(
    `INSERT INTO users (business_id, username, password, nombre, rol)
     VALUES (NULL, $1, $2, $3, 'super_admin') RETURNING id`,
    [username, hashedPassword, nombre]
  );

  console.log(`\n✓ Super administrador creado exitosamente:`);
  console.log(`  Usuario: ${username}`);
  console.log(`  Nombre:  ${nombre}`);
  console.log(`  Rol:     super_admin\n`);
  console.log(`  Puedes iniciar sesión en /login\n`);
  process.exit(0);
}

main().catch(err => {
  console.error('✖ Error:', err.message);
  process.exit(1);
});
