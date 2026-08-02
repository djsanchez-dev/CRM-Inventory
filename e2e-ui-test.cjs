// e2e-ui-test.cjs — Prueba visual E2E con Microsoft Edge (headless) via CDP
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const DEBUG_PORT = 9225;
const APP = 'http://localhost:5173';
const SHOT_DIR = path.join(process.env.TEMP || '/tmp', 'crm-screens');
fs.mkdirSync(SHOT_DIR, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const consoleErrors = [];

function log(step, ok, detail = '') {
  results.push({ step, ok, detail });
  console.log(`${ok ? '✅' : '❌'} ${step}${detail ? ' — ' + detail : ''}`);
}

let ws = null;
let msgId = 0;
const pending = new Map();

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++msgId;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

function onMessage(msg) {
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) reject(new Error(JSON.stringify(msg.error)));
    else resolve(msg.result);
    return;
  }
  if (msg.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(msg.params.type)) {
    const text = msg.params.args.map((a) => a.value || a.description || '').join(' ');
    consoleErrors.push(`[console.${msg.params.type}] ${text}`);
  }
  if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') {
    consoleErrors.push(`[log.error] ${msg.params.entry.text}`);
  }
  if (msg.method === 'Runtime.exceptionThrown') {
    const d = msg.params.exceptionDetails;
    consoleErrors.push(`[exception] ${(d && (d.exception && d.exception.description || d.text)) || 'unknown'}`);
  }
}

async function evaluate(expr) {
  const res = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  if (res.exceptionDetails) {
    throw new Error('JS error: ' + JSON.stringify(res.exceptionDetails.exception?.description || res.exceptionDetails.text));
  }
  return res.result ? res.result.value : undefined;
}

async function waitFor(expr, timeout = 15000, label = expr) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try { if (await evaluate(expr)) return true; } catch {}
    await sleep(300);
  }
  throw new Error(`Timeout esperando: ${label}`);
}

async function setInput(selector, value) {
  const ok = await evaluate(`(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return false;
    const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, ${JSON.stringify(value)});
    el.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  })()`);
  if (!ok) throw new Error('Input no encontrado: ' + selector);
}

async function clickButtonByText(text) {
  return evaluate(`(() => {
    const els = [...document.querySelectorAll('button')];
    const el = els.find((b) => b.textContent.trim().includes(${JSON.stringify(text)}));
    if (!el) return false;
    el.click();
    return true;
  })()`);
}

async function clickLinkByHref(href) {
  return evaluate(`(() => {
    const el = document.querySelector('a[href="${href}"]');
    if (!el) return false;
    el.click();
    return true;
  })()`);
}

async function clickBySelector(selector) {
  const ok = await evaluate(`(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return false;
    el.click();
    return true;
  })()`);
  if (!ok) throw new Error('Elemento no encontrado: ' + selector);
  return ok;
}

async function bodyText() {
  return evaluate(`document.body ? document.body.innerText.slice(0, 2000) : ''`);
}

async function screenshot(name) {
  try {
    const res = await send('Page.captureScreenshot', { format: 'png' });
    const file = path.join(SHOT_DIR, name + '.png');
    fs.writeFileSync(file, Buffer.from(res.data, 'base64'));
    return file;
  } catch (e) {
    return 'shot-error: ' + e.message;
  }
}

async function navigate(url) {
  await send('Page.navigate', { url });
  await waitFor(`document.readyState === 'complete'`, 15000, 'carga de ' + url);
}

async function main() {
  // 1. Lanzar Edge headless con debugging remoto
  const profile = path.join(process.env.TEMP || '/tmp', 'crm-edge-profile-' + Date.now());
  const edge = spawn(EDGE, [
    '--headless=new',
    `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${profile}`,
    '--remote-allow-origins=*',
    '--no-first-run', '--no-default-browser-check',
    '--disable-gpu', '--window-size=1440,900',
    'about:blank',
  ], { stdio: 'ignore' });
  edge.on('exit', (code) => console.log('⚠ Edge salió con código ' + code));
  edge.on('error', (e) => console.log('⚠ Edge error: ' + e.message));

  // Watchdog global armado ANTES de cualquier await (cubre arranque CDP/WS y toda la corrida)
  const finished = { flag: false };
  const watchdogMs = parseInt(process.env.E2E_WATCHDOG_MS || '240000', 10);
  const watchdog = setTimeout(() => {
    if (finished.flag) return;
    finished.flag = true;
    console.log('⏰ WATCHDOG: tiempo agotado — volcando resultados parciales');
    const fails = results.filter((r) => !r.ok);
    console.log('Total parcial: ' + (results.length - fails.length) + '/' + results.length + ' pasos OK');
    fails.forEach((f) => console.log('  ❌ ' + f.step + ' — ' + f.detail));
    console.log('--- ERRORES DE CONSOLA (' + consoleErrors.length + ') ---');
    consoleErrors.slice(0, 20).forEach((e) => console.log('  ' + e));
    try { ws && ws.close(); } catch {}
    try { edge.kill(); } catch {}
    process.exit(2);
  }, watchdogMs);
  console.log('⏱ Watchdog activo: ' + (watchdogMs / 1000) + 's');

  // 2. Esperar endpoint CDP
  let up = false;
  for (let i = 0; i < 50; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/version`);
      if (res.ok) { up = true; break; }
    } catch {}
    await sleep(300);
  }
  if (!up) throw new Error('Edge CDP no arrancó en el puerto ' + DEBUG_PORT);
  console.log('🌐 Edge headless listo (CDP:' + DEBUG_PORT + ')');

  // 3. Conectar al target de página
  const targets = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`).then((r) => r.json());
  const page = targets.find((t) => t.type === 'page');
  if (!page) throw new Error('Sin target de página');
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = () => reject(new Error('WS error'));
    setTimeout(() => reject(new Error('WS open timeout (15s)')), 15000);
  });
  ws.onmessage = (ev) => onMessage(JSON.parse(ev.data));
  ws.onclose = () => {
    const err = new Error('WebSocket cerrado inesperadamente');
    for (const { reject } of pending.values()) reject(err);
    pending.clear();
  };
  ws.onerror = () => {
    const err = new Error('WebSocket error');
    for (const { reject } of pending.values()) reject(err);
    pending.clear();
  };
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Log.enable');

  // ============ FLUJO 1: SETUP DEL NEGOCIO ============
  console.log('\n========== FLUJO 1: SETUP NEGOCIO ==========');
  await navigate(APP);
  await waitFor(`!!document.querySelector('.landing-hero') || !!document.querySelector('#businessName') || !!document.querySelector('#username')`, 20000, 'página inicial');
  const onLanding = await evaluate(`!!document.querySelector('.landing-hero')`);
  log('1.0 Landing renderiza', onLanding);
  if (onLanding) {
    await screenshot('00-landing');
    await clickButtonByText('Crear cuenta');
    await waitFor(`location.pathname === '/setup'`, 10000, 'navegación a /setup');
  }
  await waitFor(`!!document.querySelector('#businessName') || !!document.querySelector('#username')`, 15000, 'página inicial (setup o login)');
  log('1.1 Página inicial cargada', true, 'hay setup: ' + (await evaluate(`!!document.querySelector('#businessName')`)));

  if (await evaluate(`!!document.querySelector('#businessName')`)) {
    await screenshot('01-setup-step1');
    await setInput('#businessName', 'Tienda E2E');
    const cont = await clickButtonByText('Continuar');
    log('1.2 Paso 1 (negocio) completado', !!cont);
    await waitFor(`!!document.querySelector('#adminName')`, 10000, 'paso 2 setup');
    await setInput('#adminName', 'Admin E2E');
    await setInput('#adminUsername', 'admin');
    await setInput('#adminPassword', 'secreto123');
    await screenshot('02-setup-step2');
    const crear = await clickButtonByText('Crear Negocio');
    log('1.3 Paso 2 (admin) completado', !!crear);
    await waitFor(`location.pathname.startsWith('/app')`, 15000, 'redirección a /app tras setup');
    log('1.4 Setup → auto-login → /app (fix hydrateSession)', true, 'path=' + await evaluate('location.pathname'));
  } else {
    log('1.x Sin setup (negocio ya existe)', true);
  }

  // Dashboard debe renderizar
  await waitFor(`!!document.querySelector('.page-title')`, 15000, 'título de página');
  await waitFor(`document.querySelector('.page-title').innerText.includes('Dashboard') || !!document.querySelector('.stat-card')`, 15000, 'dashboard');
  await screenshot('03-dashboard');
  log('2.1 Dashboard renderiza', true, 'título=' + await evaluate(`document.querySelector('.page-title').innerText`));

  // ============ CREAR DATOS VÍA API (misma sesión/token) ============
  const token = await evaluate(`localStorage.getItem('token') || localStorage.getItem('crm_token') || ''`);
  const H = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token };
  const api = (method, url, body) =>
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
  }

  // ============ FLUJO 2: CREAR VENTA ============
  console.log('\n========== FLUJO 2: CREAR VENTA ==========');
  await clickLinkByHref('/app/sales');
  await waitFor(`location.pathname === '/app/sales'`, 10000, 'navegación a Ventas');
  await waitFor(`document.body.innerText.includes('Nueva Venta') || !!document.querySelector('.toolbar')`, 15000, 'página Ventas');
  log('4.1 Página Ventas abierta', true, 'path=' + await evaluate('location.pathname'));

  const nueva = await clickButtonByText('Nueva Venta');
  log('4.2 Modal "Nueva Venta" abierto', !!nueva);
  await waitFor(`!!document.querySelector('.sale-form-grid')`, 10000, 'modal venta');
  await waitFor(`document.querySelectorAll('.product-list-item').length > 0`, 10000, 'lista de productos en modal');
  await screenshot('04-sale-modal');

  await clickBySelector('.product-list-item');
  await waitFor(`document.body.innerText.includes('Carrito (1') || document.querySelectorAll('.cart-item').length > 0`, 10000, 'item en carrito');
  const totalTxt = await evaluate(`(document.querySelector('.cart-total-final .total-value')||{}).innerText || ''`);
  log('4.3 Producto agregado al carrito', true, totalTxt);

  await screenshot('05-sale-cart');
  const completar = await clickButtonByText('Completar venta');
  log('4.4 Click en "Completar venta"', !!completar);
  await waitFor(`!document.querySelector('.sale-form-grid')`, 15000, 'modal se cierra');
  await waitFor(`document.body.innerText.includes('#1') || document.body.innerText.includes('Venta registrada correctamente')`, 15000, 'venta en tabla');
  const rows = await evaluate(`document.querySelectorAll('.data-table tbody tr').length`);
  const toast = await evaluate(`document.body.innerText.includes('Venta registrada correctamente')`);
  log('4.5 Venta creada y visible en la tabla', rows >= 1 && toast, `filas=${rows} toast="${toast}"`);
  await screenshot('06-sale-created');

  // ============ FLUJO 3: LOGOUT → LOGIN ============
  console.log('\n========== FLUJO 3: LOGOUT → LOGIN ==========');
  await clickBySelector('.user-btn');
  await waitFor(`document.body.innerText.includes('Cerrar Sesión')`, 8000, 'menú de usuario');
  await clickButtonByText('Cerrar Sesión');
  await waitFor(`!!document.querySelector('#username')`, 15000, 'página de login');
  log('5.1 Logout OK', true);
  await screenshot('07-login');

  await setInput('#username', 'admin');
  await setInput('#password', 'secreto123');
  await clickButtonByText('Iniciar Sesión');
  await waitFor(`location.pathname.startsWith('/app')`, 15000, 'login exitoso');
  await waitFor(`!!document.querySelector('.page-title')`, 10000, 'dashboard tras login');
  log('5.2 Login OK → /app', true, 'path=' + await evaluate('location.pathname'));
  await screenshot('08-dashboard-after-login');

  // ============ FLUJO 4: REPORTES ============
  console.log('\n========== FLUJO 4: REPORTES ==========');
  await clickLinkByHref('/app/reports');
  await waitFor(`location.pathname === '/app/reports'`, 10000, 'navegación a Reportes');
  await waitFor(`document.body.innerText.includes('Total Gastado') || document.body.innerText.includes('Detalle de Gastos') || !!document.querySelector('.stats-grid')`, 15000, 'página Reportes');
  const repStatCards = await evaluate(`document.querySelectorAll('.stats-grid .stat-card').length`);
  const repText = await bodyText();
  const repOk = repStatCards >= 4 || repText.includes('Total Gastado') || repText.includes('Detalle de Gastos');
  log('6.1 Página Reportes renderiza', repOk, 'stat-cards=' + repStatCards + ' (esperado >= 4)');
  await screenshot('09-reports');

  // ============ RESUMEN ============
  console.log('\n========== RESUMEN ==========');
  const fails = results.filter((r) => !r.ok);
  console.log(`Total: ${results.length - fails.length}/${results.length} pasos OK`);
  if (fails.length) {
    console.log('PASOS FALLIDOS:');
    fails.forEach((f) => console.log('  ❌ ' + f.step + ' — ' + f.detail));
  }
  console.log('\n--- ERRORES DE CONSOLA DEL NAVEGADOR (' + consoleErrors.length + ') ---');
  consoleErrors.slice(0, 20).forEach((e) => console.log('  ' + e));
  if (consoleErrors.length === 0) console.log('  (sin errores)');
  console.log('\nScreenshots en: ' + SHOT_DIR);

  finished.flag = true;
  clearTimeout(watchdog);
  ws.close();
  edge.kill();
  process.exit(fails.length ? 1 : 0);
}

main().catch((err) => {
  console.error('💥 ERROR FATAL: ' + err.message);
  if (ws) { try { ws.close(); } catch {} }
  console.log('\n--- ERRORES DE CONSOLA CAPTURADOS (' + consoleErrors.length + ') ---');
  consoleErrors.slice(0, 20).forEach((e) => console.log('  ' + e));
  process.exit(1);
});
