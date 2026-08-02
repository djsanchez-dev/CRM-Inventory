const fs = require('fs');
let lines = fs.readFileSync('e2e-ui-test.cjs', 'utf8').split('\n');

// 1) Quitar el bloque watchdog viejo (después de Log.enable)
const wStart = lines.findIndex((l) => l.includes('// Watchdog global: si algo se cuelga'));
const wEnd = lines.findIndex((l) => l.includes("console.log('⏱ Watchdog activo:"));
if (wStart === -1 || wEnd === -1) { console.error('NO ENCONTRADO bloque watchdog viejo'); process.exit(1); }
lines.splice(wStart, wEnd - wStart + 1);

// 2) Insertar watchdog nuevo justo después de edge.on('error', ...) y antes de // 2. Esperar endpoint CDP
const aIdx = lines.findIndex((l) => l.includes("edge.on('error', (e) => console.log('⚠ Edge error: "));
if (aIdx === -1) { console.error('NO ENCONTRADO edge.on error'); process.exit(1); }
const watchdogBlock = [
  '',
  '  // Watchdog global armado ANTES de cualquier await (cubre arranque CDP/WS y toda la corrida)',
  '  const finished = { flag: false };',
  "  const watchdogMs = parseInt(process.env.E2E_WATCHDOG_MS || '240000', 10);",
  '  const watchdog = setTimeout(() => {',
  '    if (finished.flag) return;',
  '    finished.flag = true;',
  "    console.log('⏰ WATCHDOG: tiempo agotado — volcando resultados parciales');",
  '    const fails = results.filter((r) => !r.ok);',
  "    console.log('Total parcial: ' + (results.length - fails.length) + '/' + results.length + ' pasos OK');",
  "    fails.forEach((f) => console.log('  ❌ ' + f.step + ' — ' + f.detail));",
  "    console.log('--- ERRORES DE CONSOLA (' + consoleErrors.length + ') ---');",
  '    consoleErrors.slice(0, 20).forEach((e) => console.log("  " + e));',
  '    try { ws && ws.close(); } catch {}',
  '    try { edge.kill(); } catch {}',
  '    process.exit(2);',
  '  }, watchdogMs);',
  "  console.log('⏱ Watchdog activo: ' + (watchdogMs / 1000) + 's');",
];
lines.splice(aIdx + 1, 0, ...watchdogBlock);

// 3) Timeout en el open del WebSocket
const s = lines.join('\n');
const oldOpen = `  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = () => reject(new Error('WS error'));
  });`;
const newOpen = `  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = () => reject(new Error('WS error'));
    setTimeout(() => reject(new Error('WS open timeout (15s)')), 15000);
  });`;
if (!s.includes(oldOpen)) { console.error('NO ENCONTRADO ws open'); process.exit(1); }
let out = s.replace(oldOpen, newOpen);

// 4) Seed: capturar status y superficie de errores
const oldSeed = `  const api = (method, url, body) =>
    fetch(APP + url, { method, headers: H, signal: AbortSignal.timeout(10000), body: body ? JSON.stringify(body) : undefined }).then((r) => r.json());

  const cat = await api('POST', '/api/categories', { nombre: 'Bebidas', descripcion: 'E2E' });
  const p1 = await api('POST', '/api/products', { nombre: 'Coca Cola 1L', sku: 'E2E-001', precio: 15, costo: 8, stock: 50, stock_minimo: 10, category_id: cat.id });
  const p2 = await api('POST', '/api/products', { nombre: 'Agua Mineral', sku: 'E2E-002', precio: 3, costo: 1, stock: 2, stock_minimo: 5, category_id: cat.id });
  await api('POST', '/api/customers', { nombre: 'Cliente E2E', email: 'cliente@e2e.com' });
  log('3. Datos semilla creados', !!(cat.id && p1.id && p2.id), `cat=${cat.id} p1=${p1.id} p2=${p2.id}`);`;
const newSeed = `  const api = (method, url, body) =>
    fetch(APP + url, { method, headers: H, signal: AbortSignal.timeout(10000), body: body ? JSON.stringify(body) : undefined })
      .then(async (r) => ({ status: r.status, data: await r.json().catch(() => ({})) }));

  const cat = await api('POST', '/api/categories', { nombre: 'Bebidas', descripcion: 'E2E' });
  const p1 = await api('POST', '/api/products', { nombre: 'Coca Cola 1L', sku: 'E2E-001', precio: 15, costo: 8, stock: 50, stock_minimo: 10, category_id: cat.data.id });
  const p2 = await api('POST', '/api/products', { nombre: 'Agua Mineral', sku: 'E2E-002', precio: 3, costo: 1, stock: 2, stock_minimo: 5, category_id: cat.data.id });
  await api('POST', '/api/customers', { nombre: 'Cliente E2E', email: 'cliente@e2e.com' });
  const seedOk = cat.status === 201 && p1.status === 201 && p2.status === 201;
  log('3. Datos semilla creados', seedOk, 'status=[' + cat.status + ',' + p1.status + ',' + p2.status + '] ids=[' + (cat.data.id || '-') + ',' + (p1.data.id || '-') + ',' + (p2.data.id || '-') + ']');
  if (!seedOk) {
    console.log('   cat=' + JSON.stringify(cat.data));
    console.log('   p1=' + JSON.stringify(p1.data));
    console.log('   p2=' + JSON.stringify(p2.data));
  }`;
if (!out.includes(oldSeed)) { console.error('NO ENCONTRADO bloque seed'); process.exit(1); }
out = out.replace(oldSeed, newSeed);

fs.writeFileSync('e2e-ui-test.cjs', out);
console.log('patch ok');
