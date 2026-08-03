/**
 * Utilidades de exportación para el CRM
 * - CSV: exporta datos a CSV y descarga el archivo
 * - PDF: exporta datos a PDF con formato de tabla
 */

// ========================
// CSV Export
// ========================

/**
 * Convierte un array de objetos a CSV
 */
function objectsToCSV(data, columns, headers) {
  const csvRows = [];

  // Header row
  csvRows.push(headers.join(','));

  // Data rows
  for (const row of data) {
    const values = columns.map((col) => {
      let val = row[col];
      if (val === null || val === undefined) val = '';
      // Escape commas and quotes in strings
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

/**
 * Descarga datos como archivo CSV
 * @param {Array} data - Array de objetos a exportar
 * @param {Array} columns - Nombres de las propiedades a incluir
 * @param {Array} headers - Nombres de las columnas en el CSV
 * @param {string} filename - Nombre del archivo
 */
export function downloadCSV(data, columns, headers, filename) {
  const csv = objectsToCSV(data, columns, headers);
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

// ========================
// PDF Export
// ========================

/**
 * Genera y descarga un PDF con una tabla
 * @param {string} title - Título del documento
 * @param {string} subtitle - Subtítulo
 * @param {Array} headers - Array de strings con los encabezados
 * @param {Array} body - Array de arrays con los datos (filas)
 * @param {string} filename - Nombre del archivo
 */
export async function downloadPDF(title, subtitle, headers, body, filename) {
  const { default: jsPDF } = await import('jspdf');
  await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Colors
  const primaryColor = [79, 70, 229]; // #4f46e5
  const grayBg = [248, 250, 252];
  const grayBorder = [226, 232, 240];

  // Header band
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 297, 20, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('CRM Inventario', 14, 13);

  // Title
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 32);

  // Subtitle / date
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const dateStr = new Date().toLocaleDateString('es-PE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  if (subtitle) {
    doc.text(`${subtitle} | Generado: ${dateStr}`, 14, 40);
  } else {
    doc.text(`Generado: ${dateStr}`, 14, 40);
  }

  // Table
  doc.autoTable({
    head: [headers],
    body: body,
    startY: 48,
    styles: {
      fontSize: 8,
      cellPadding: 3,
      font: 'helvetica',
    },
    headStyles: {
      fillColor: primaryColor,
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    alternateRowStyles: {
      fillColor: grayBg,
    },
    tableLineColor: grayBorder,
    tableLineWidth: 0.5,
    margin: { top: 48 },
    didDrawPage: (data) => {
      // Footer on each page
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Página ${i} de ${pageCount}`,
          doc.internal.pageSize.width - 14,
          doc.internal.pageSize.height - 10,
          { align: 'right' }
        );
        doc.text(
          'CRM Inventario - Sistema de Gestión',
          14,
          doc.internal.pageSize.height - 10
        );
      }
    },
  });

  // Footer on first page
  const finalY = doc.lastAutoTable.finalY || 250;
  doc.setDrawColor(...grayBorder);
  doc.line(14, finalY + 8, 283, finalY + 8);

  doc.save(`${filename}.pdf`);
}

// ========================
// Helpers específicos del CRM
// ========================

const formatCurrency = (value) =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value);

/**
 * Exporta productos a CSV (valores numéricos crudos para cálculos en Excel)
 */
export function exportProductsCSV(products) {
  const columns = ['nombre', 'sku', 'category_name', 'precio_raw', 'costo_raw', 'stock', 'stock_minimo'];
  const headers = ['Producto', 'SKU', 'Categoría', 'Precio', 'Costo', 'Stock', 'Stock Mínimo'];

  const data = products.map((p) => ({
    nombre: p.nombre,
    sku: p.sku,
    category_name: p.category_name || 'Sin categoría',
    precio_raw: p.precio,
    costo_raw: p.costo,
    stock: p.stock,
    stock_minimo: p.stock_minimo,
  }));

  downloadCSV(data, columns, headers, 'productos');
}

/**
 * Exporta productos a PDF
 */
export async function exportProductsPDF(products) {
  try {
    const headers = ['#', 'Producto', 'SKU', 'Categoría', 'Precio', 'Costo', 'Stock', 'Valor Inventario'];

    const body = products.map((p, i) => [
      String(i + 1),
      p.nombre,
      p.sku,
      p.category_name || 'Sin categoría',
      formatCurrency(p.precio),
      formatCurrency(p.costo),
      String(p.stock),
      formatCurrency(p.stock * p.costo),
    ]);

    // Summary row
    const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
    const totalValue = products.reduce((sum, p) => sum + p.stock * p.costo, 0);
    body.push(['', '', '', 'TOTALES', '', '', String(totalStock), formatCurrency(totalValue)]);

    await downloadPDF(
      'Reporte de Productos',
      `${products.length} producto(s) registrados`,
      headers,
      body,
      'reporte-productos'
    );
  } catch (error) {
    console.error('Error al exportar PDF:', error);
    alert('Error al generar el PDF. Asegúrate de que las dependencias estén instaladas (npm install).');
  }
}

/**
 * Exporta ventas a CSV
 */
export function exportSalesCSV(sales) {
  const columns = ['id', 'customer_name', 'total_items', 'total', 'tipo_pago', 'created_at'];
  const headers = ['# Venta', 'Cliente', 'Items', 'Total', 'Tipo Pago', 'Fecha'];

  const data = sales.map((s) => ({
    id: `#${s.id}`,
    customer_name: s.customer_name || 'Sin cliente',
    total_items: s.total_items,
    total: s.total,
    tipo_pago: s.tipo_pago,
    created_at: s.created_at,
  }));

  downloadCSV(data, columns, headers, 'ventas');
}

/**
 * Exporta compras a CSV (valores numéricos crudos)
 */
export function exportPurchasesCSV(purchases) {
  const columns = ['id', 'product_name', 'product_sku', 'supplier_name', 'cantidad', 'costo_raw', 'total_raw', 'created_at'];
  const headers = ['# Compra', 'Producto', 'SKU', 'Proveedor', 'Cantidad', 'Costo Unit.', 'Total', 'Fecha'];

  const data = purchases.map((p) => ({
    id: `#${p.id}`,
    product_name: p.product_name,
    product_sku: p.product_sku,
    supplier_name: p.supplier_name || 'Sin proveedor',
    cantidad: p.cantidad,
    costo_raw: p.costo_unitario,
    total_raw: p.total,
    created_at: p.created_at,
  }));

  downloadCSV(data, columns, headers, 'compras');
}

/**
 * Exporta compras a PDF
 */
export async function exportPurchasesPDF(purchases) {
  try {
    const headers = ['# Compra', 'Fecha', 'Producto', 'SKU', 'Proveedor', 'Cantidad', 'Costo Unit.', 'Total'];

    const body = purchases.map((p) => [
      `#${p.id}`,
      new Date(p.created_at).toLocaleDateString('es-PE'),
      p.product_name,
      p.product_sku,
      p.supplier_name || '—',
      String(p.cantidad),
      formatCurrency(p.costo_unitario),
      formatCurrency(p.total),
    ]);

    // Summary row
    const totalCantidad = purchases.reduce((sum, p) => sum + p.cantidad, 0);
    const totalInvertido = purchases.reduce((sum, p) => sum + p.total, 0);
    body.push(['', '', '', '', 'TOTALES', String(totalCantidad), '', formatCurrency(totalInvertido)]);

    await downloadPDF(
      'Reporte de Compras',
      `${purchases.length} compra(s) registradas`,
      headers,
      body,
      'reporte-compras'
    );
  } catch (error) {
    console.error('Error al exportar PDF:', error);
    alert('Error al generar el PDF. Asegúrate de que las dependencias estén instaladas (npm install).');
  }
}

/**
 * Exporta resumen del Dashboard a CSV
 */
export function exportDashboardCSV(data) {
  // Financial summary
  const finRows = [
    { metrica: 'Productos', valor: data.totalProducts },
    { metrica: 'Categorías', valor: data.totalCategories },
    { metrica: 'Clientes', valor: data.totalCustomers },
    { metrica: 'Proveedores', valor: data.totalSuppliers },
    { metrica: 'Ingresos Totales', valor: data.totalIngresos },
    { metrica: 'Inversión en Inventario', valor: data.totalInversion },
    { metrica: 'Ganancia Potencial', valor: data.gananciaPotencial },
    { metrica: 'Promedio por Venta', valor: data.promedioVenta },
    { metrica: 'Stock Bajo', valor: data.lowStockCount },
  ];
  downloadCSV(finRows, ['metrica', 'valor'], ['Métrica', 'Valor'], 'dashboard-resumen');
}

/**
 * Exporta Dashboard completo a PDF
 */
export async function exportDashboardPDF(data) {
  try {
    const formatCurrency = (v) =>
      new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(v);

    // Section 1: KPIs
    const finHeaders = ['Métrica', 'Valor'];
    const finBody = [
      ['Productos', String(data.totalProducts)],
      ['Categorías', String(data.totalCategories)],
      ['Clientes', String(data.totalCustomers)],
      ['Proveedores', String(data.totalSuppliers)],
      ['Ingresos Totales', formatCurrency(data.totalIngresos)],
      ['Inversión en Inventario', formatCurrency(data.totalInversion)],
      ['Ganancia Potencial', formatCurrency(data.gananciaPotencial)],
      ['Promedio por Venta', formatCurrency(data.promedioVenta)],
      ['Stock Bajo', `${data.lowStockCount} producto(s)`],
    ];

    const { default: jsPDF } = await import('jspdf');
    await import('jspdf-autotable');

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const primaryColor = [79, 70, 229];
    const grayBg = [248, 250, 252];
    const grayBorder = [226, 232, 240];

    // Header
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('CRM Inventario', 14, 13);

    // Title
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Dashboard - Resumen General', 14, 32);

    doc.setTextColor(100, 116, 139);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const dateStr = new Date().toLocaleDateString('es-PE', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
    doc.text(`Generado: ${dateStr}`, 14, 40);

    // KPI Table
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text('Indicadores Clave', 14, 52);

    doc.autoTable({
      head: [finHeaders],
      body: finBody,
      startY: 58,
      styles: { fontSize: 8, cellPadding: 3, font: 'helvetica' },
      headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: grayBg },
      tableLineColor: grayBorder,
      tableLineWidth: 0.5,
    });

    // Section 2: Monthly Sales
    if (data.monthlySummary?.length) {
      const salesHeaders = ['Mes', 'Ventas', 'Total'];
      const salesBody = data.monthlySummary.map((m) => [
        m.mes,
        String(m.ventas),
        formatCurrency(m.total),
      ]);

      const y = doc.lastAutoTable.finalY + 14;
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.text('Ventas Mensuales', 14, y);

      doc.autoTable({
        head: [salesHeaders],
        body: salesBody,
        startY: y + 6,
        styles: { fontSize: 8, cellPadding: 3, font: 'helvetica' },
        headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: grayBg },
        tableLineColor: grayBorder,
        tableLineWidth: 0.5,
      });
    }

    // Section 3: Top Products
    if (data.topProducts?.length) {
      const prodHeaders = ['#', 'Producto', 'SKU', 'Vendidos', 'Ingresos'];
      const prodBody = data.topProducts.map((p, i) => [
        String(i + 1), p.nombre, p.sku, String(p.total_vendido), formatCurrency(p.total_ingresos),
      ]);

      const y = doc.lastAutoTable.finalY + 14;
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.text('Productos Más Vendidos', 14, y);

      doc.autoTable({
        head: [prodHeaders],
        body: prodBody,
        startY: y + 6,
        styles: { fontSize: 8, cellPadding: 3, font: 'helvetica' },
        headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: grayBg },
        tableLineColor: grayBorder,
        tableLineWidth: 0.5,
      });
    }

    // Footer on each page
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width - 14, doc.internal.pageSize.height - 10, { align: 'right' });
      doc.text('CRM Inventario - Dashboard', 14, doc.internal.pageSize.height - 10);
    }

    doc.save('dashboard.pdf');
  } catch (error) {
    console.error('Error al exportar PDF:', error);
    alert('Error al generar el PDF. Asegúrate de que las dependencias estén instaladas (npm install).');
  }
}

/**
 * Exporta proveedores a CSV
 */
export function exportSuppliersCSV(suppliers) {
  const columns = ['nombre', 'contacto', 'email', 'telefono', 'direccion', 'created_at'];
  const headers = ['Nombre', 'Contacto', 'Email', 'Teléfono', 'Dirección', 'Fecha Registro'];

  const data = suppliers.map((s) => ({
    nombre: s.nombre,
    contacto: s.contacto || '',
    email: s.email || '',
    telefono: s.telefono || '',
    direccion: s.direccion || '',
    created_at: s.created_at,
  }));

  downloadCSV(data, columns, headers, 'proveedores');
}

/**
 * Exporta proveedores a PDF
 */
export async function exportSuppliersPDF(suppliers) {
  try {
    const headers = ['#', 'Nombre', 'Contacto', 'Email', 'Teléfono', 'Dirección', 'Registrado'];

    const body = suppliers.map((s, i) => [
      String(i + 1),
      s.nombre,
      s.contacto || '—',
      s.email || '—',
      s.telefono || '—',
      s.direccion || '—',
      new Date(s.created_at).toLocaleDateString('es-PE'),
    ]);

    await downloadPDF(
      'Reporte de Proveedores',
      `${suppliers.length} proveedor(es) registrados`,
      headers,
      body,
      'reporte-proveedores'
    );
  } catch (error) {
    console.error('Error al exportar PDF:', error);
    alert('Error al generar el PDF. Asegúrate de que las dependencias estén instaladas (npm install).');
  }
}

/**
 * Exporta reportes de gastos a CSV
 */
export function exportReportsCSV(data) {
  const columns = ['nombre', 'contacto', 'num_compras', 'total_productos', 'costo_promedio', 'total_gastado', 'primera_compra', 'ultima_compra'];
  const headers = ['Proveedor', 'Contacto', 'Compras', 'Productos', 'Costo Promedio', 'Total Gastado', 'Primera Compra', 'Última Compra'];

  const rows = data.spendingBySupplier.map((s) => ({
    nombre: s.nombre,
    contacto: s.contacto || '',
    num_compras: s.num_compras,
    total_productos: s.total_productos,
    costo_promedio: s.costo_promedio,
    total_gastado: s.total_gastado,
    primera_compra: s.primera_compra || '',
    ultima_compra: s.ultima_compra || '',
  }));

  downloadCSV(rows, columns, headers, 'reporte-gastos-proveedores');
}

/**
 * Exporta reportes de gastos a PDF
 */
export async function exportReportsPDF(data, dateFilter) {
  try {
    const headers = ['Proveedor', 'Contacto', 'Compras', 'Productos', 'Costo Prom.', 'Total Gastado', 'Última Compra'];

    const body = data.spendingBySupplier.map((s) => [
      s.nombre,
      s.contacto || '—',
      String(s.num_compras),
      String(s.total_productos),
      formatCurrency(s.costo_promedio),
      formatCurrency(s.total_gastado),
      s.ultima_compra ? new Date(s.ultima_compra).toLocaleDateString('es-PE') : '—',
    ]);

    // Summary row
    body.push(['', 'TOTALES', String(data.totals.total_compras), String(data.totals.total_productos), '', formatCurrency(data.totals.total_general), '']);

    const subtitle = dateFilter?.startDate || dateFilter?.endDate
      ? `Filtrado: ${dateFilter.startDate || '—'} al ${dateFilter.endDate || '—'}`
      : `${data.spendingBySupplier.length} proveedor(es)`;

    await downloadPDF(
      'Reporte de Gastos por Proveedor',
      subtitle,
      headers,
      body,
      'reporte-gastos-proveedores'
    );
  } catch (error) {
    console.error('Error al exportar PDF:', error);
    alert('Error al generar el PDF. Asegúrate de que las dependencias estén instaladas (npm install).');
  }
}

/**
 * Exporta ventas a PDF
 */
// Vehicle type labels (match businessTypes.js carwash preset)
const VEHICLE_LABELS = {
  moto: 'Moto',
  mototaxi: 'Mototaxi',
  auto: 'Auto',
  cuatrimoto: 'Cuatrimoto',
  combi: 'Combi',
  tractor: 'Tractor',
  otro: 'Otro',
};
const vehicleLabel = (id) => VEHICLE_LABELS[id] || id || '—';

/**
 * Exporta servicios a CSV
 */
export function exportServicesCSV(services) {
  const columns = ['id', 'tipo', 'vehiculo', 'nombre', 'placa', 'customer_name', 'precio_raw', 'notas', 'created_at'];
  const headers = ['#', 'Tipo', 'Vehículo', 'Servicio', 'Placa', 'Cliente', 'Precio', 'Notas', 'Fecha'];

  const data = services.map((s) => ({
    id: `#${s.id}`,
    tipo: s.tipo === 'carwash' ? 'Car Wash' : 'Mecánica',
    vehiculo: vehicleLabel(s.tipo_vehiculo),
    nombre: s.nombre,
    placa: s.placa || '',
    customer_name: s.customer_name || '',
    precio_raw: s.precio,
    notas: s.notas || '',
    created_at: s.created_at,
  }));

  downloadCSV(data, columns, headers, 'servicios');
}

/**
 * Exporta servicios a PDF
 */
export async function exportServicesPDF(services, fecha) {
  try {
    const headers = ['#', 'Hora', 'Tipo', 'Vehículo', 'Servicio', 'Placa', 'Cliente', 'Precio'];

    const body = services.map((s) => [
      `#${s.id}`,
      new Date(s.created_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
      s.tipo === 'carwash' ? 'Car Wash' : 'Mecánica',
      vehicleLabel(s.tipo_vehiculo),
      s.nombre,
      s.placa || '—',
      s.customer_name || '—',
      formatCurrency(s.precio),
    ]);

    // Summary row (TOTAL lands in the 'Servicio' column — index 4 of 8)
    const totalIngreso = services.reduce((sum, s) => sum + s.precio, 0);
    body.push(['', '', '', '', 'TOTAL', '', '', formatCurrency(totalIngreso)]);

    const subtitle = fecha
      ? `Control diario — ${fecha}`
      : `${services.length} servicio(s)`;

    await downloadPDF(
      'Reporte de Servicios',
      subtitle,
      headers,
      body,
      `servicios-${fecha || 'todos'}`
    );
  } catch (error) {
    console.error('Error al exportar PDF:', error);
    alert('Error al generar el PDF. Asegúrate de que las dependencias estén instaladas (npm install).');
  }
}

/**
 * Imprime un ticket POS simple de una venta (usando el diálogo de impresión
 * del navegador). Abre una ventana nueva con el ticket formateado y llama a
 * window.print() cuando el contenido está listo.
 */
export function printSaleTicket(sale) {
  const fmt = (v) =>
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(Number(v) || 0);

  const fmtDate = (d) => {
    if (!d) return '';
    const date = new Date(d);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleString('es-PE', {
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
    });
  };

  const itemsRows = (sale.items || [])
    .map(
      (it) => `
        <tr>
          <td style="padding:4px 0;font-size:12px">${escapeHtml(it.product_name || 'Producto')}</td>
          <td style="padding:4px 0;font-size:12px;text-align:center">${it.cantidad}</td>
          <td style="padding:4px 0;font-size:12px;text-align:right">${fmt(it.precio_unitario)}</td>
          <td style="padding:4px 0;font-size:12px;text-align:right">${fmt(it.subtotal)}</td>
        </tr>`
    )
    .join('');

  const deliveryInfo = sale.es_delivery
    ? `
      <tr style="border-top:1px dashed #999">
        <td colspan="2" style="padding:6px 0;font-size:12px"><strong>Delivery</strong></td>
        <td colspan="2" style="padding:6px 0;font-size:12px;text-align:right">${escapeHtml(sale.direccion_entrega || '')}</td>
      </tr>`
    : '';

  const notaRow = sale.nota
    ? `<div style="margin-top:8px;font-size:11px;color:#555"><strong>Notas:</strong> ${escapeHtml(sale.nota)}</div>`
    : '';

  const win = window.open('', '_blank', 'width=420,height=640');
  if (!win) {
    alert('Permite ventanas emergentes para imprimir el ticket.');
    return;
  }

  win.document.write(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8" />
      <title>Ticket #${sale.id}</title>
      <style>
        body { font-family: 'Courier New', monospace; width: 300px; margin: 0 auto; color: #111; }
        h1 { font-size: 16px; text-align: center; margin: 8px 0 2px; }
        .sub { text-align: center; font-size: 11px; color: #555; margin-bottom: 8px; }
        .divider { border-top: 1px dashed #999; margin: 8px 0; }
        table { width: 100%; border-collapse: collapse; }
        th { font-size: 11px; text-align: left; border-bottom: 1px solid #999; padding-bottom: 3px; }
        th:nth-child(2), th:nth-child(3), th:nth-child(4) { text-align: right; }
        td:nth-child(2), td:nth-child(3), td:nth-child(4) { text-align: right; }
        .total { font-size: 14px; font-weight: bold; text-align: right; margin-top: 6px; }
        .meta { font-size: 11px; color: #333; margin: 3px 0; }
        .footer { text-align: center; font-size: 11px; margin-top: 14px; color: #777; }
        @media print { body { width: 100%; } }
      </style>
    </head>
    <body>
      <h1>${escapeHtml(sale.business_name || 'Mi Negocio')}</h1>
      <div class="sub">Ticket de venta</div>
      <div class="meta">Venta #${sale.id}</div>
      <div class="meta">Fecha: ${fmtDate(sale.created_at)}</div>
      <div class="meta">Cliente: ${escapeHtml(sale.customer_name || 'Sin cliente')}</div>
      <div class="divider"></div>
      <table>
        <thead>
          <tr><th>Producto</th><th>Cant.</th><th>Precio</th><th>Total</th></tr>
        </thead>
        <tbody>${itemsRows}</tbody>
      </table>
      <div class="divider"></div>
      <div class="meta">Pago: ${escapeHtml(sale.tipo_pago || 'efectivo')}</div>
      ${deliveryInfo}
      ${notaRow}
      <div class="total">TOTAL: ${fmt(sale.total)}</div>
      <div class="footer">¡Gracias por su compra!</div>
    </body>
    </html>
  `);
  win.document.close();

  // Print once the content is fully rendered (single mechanism to avoid
  // opening the print dialog twice on some browsers).
  let printed = false;
  const doPrint = () => {
    if (printed) return;
    printed = true;
    win.focus();
    win.print();
  };
  win.onload = doPrint;
  setTimeout(doPrint, 350);
}

/** Escape HTML entities for safe interpolation inside the ticket */
function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function exportSalesPDF(sales) {
  try {
    const headers = ['# Venta', 'Fecha', 'Cliente', 'Items', 'Total', 'Tipo Pago'];

    const body = sales.map((s) => [
      `#${s.id}`,
      new Date(s.created_at).toLocaleDateString('es-PE'),
      s.customer_name || 'Sin cliente',
      String(s.total_items),
      formatCurrency(s.total),
      s.tipo_pago,
    ]);

    // Summary row
    const totalSales = sales.reduce((sum, s) => sum + s.total, 0);
    body.push(['', '', '', 'TOTAL', formatCurrency(totalSales), '']);

    await downloadPDF(
      'Reporte de Ventas',
      `${sales.length} venta(s) registradas`,
      headers,
      body,
      'reporte-ventas'
    );
  } catch (error) {
    console.error('Error al exportar PDF:', error);
    alert('Error al generar el PDF. Asegúrate de que las dependencias estén instaladas (npm install).');
  }
}
