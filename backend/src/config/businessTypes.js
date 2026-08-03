/**
 * Business type presets with default labels and optional extra fields.
 * Each type defines:
 *  - labels: UI terminology customized for the industry
 *  - extraFields: additional columns for products/customers/sales
 *
 * Custom labels provided during setup or later are merged on top of these defaults.
 */

const BUSINESS_PRESETS = {
  general: {
    name: 'General / Tienda',
    description: 'Tienda de productos variados',
    labels: {
      product: 'Producto',
      product_plural: 'Productos',
      customer: 'Cliente',
      customer_plural: 'Clientes',
      sale: 'Venta',
      sale_plural: 'Ventas',
      purchase: 'Compra',
      purchase_plural: 'Compras',
      category: 'Categoría',
      category_plural: 'Categorías',
      supplier: 'Proveedor',
      supplier_plural: 'Proveedores',
      stock: 'Stock',
      stock_minimo: 'Stock Mínimo',
      price: 'Precio',
      price_plural: 'Precios',
      cost: 'Costo',
      sku: 'SKU',
      dashboard: 'Dashboard',
      report: 'Reporte',
      report_plural: 'Reportes',
      user: 'Usuario',
      user_plural: 'Usuarios',
      service: 'Servicio',
      service_plural: 'Servicios',
    },
    extraFields: {
      product: [],
      customer: [],
      sale: [],
    },
  },

  carwash: {
    name: 'Car Wash / Lavadero',
    description: 'Lavado de autos y servicios mecánicos',
    labels: {
      product: 'Producto',
      product_plural: 'Productos',
      customer: 'Cliente',
      customer_plural: 'Clientes',
      sale: 'Venta',
      sale_plural: 'Ventas',
      purchase: 'Compra',
      purchase_plural: 'Compras',
      category: 'Categoría',
      category_plural: 'Categorías',
      supplier: 'Proveedor',
      supplier_plural: 'Proveedores',
      stock: 'Stock',
      stock_minimo: 'Stock Mínimo',
      price: 'Precio',
      price_plural: 'Precios',
      cost: 'Costo',
      sku: 'SKU',
      dashboard: 'Dashboard',
      report: 'Reporte',
      report_plural: 'Reportes',
      user: 'Usuario',
      user_plural: 'Usuarios',
      service: 'Servicio',
      service_plural: 'Servicios',
    },
    extraFields: {
      product: [],
      customer: [
        { key: 'placa', label: 'Placa', type: 'text', placeholder: 'Ej: ABC-123' },
      ],
      sale: [],
    },
    // Vehicle types washed at the carwash — default price auto-fills on selection
    // (editable per service). 'otro' has no default so the user types the price.
    vehicleTypes: [
      { id: 'moto', label: 'Moto', precio: 8 },
      { id: 'mototaxi', label: 'Mototaxi', precio: 10 },
      { id: 'auto', label: 'Auto', precio: 15 },
      { id: 'cuatrimoto', label: 'Cuatrimoto', precio: 15 },
      { id: 'combi', label: 'Combi', precio: 20 },
      { id: 'tractor', label: 'Tractor', precio: 25 },
      { id: 'otro', label: 'Otro', precio: null },
    ],
  },

  licoreria: {
    name: 'Licorería',
    description: 'Venta de bebidas alcohólicas y licores',
    labels: {
      product: 'Botella',
      product_plural: 'Botellas',
      customer: 'Cliente',
      customer_plural: 'Clientes',
      sale: 'Venta',
      sale_plural: 'Ventas',
      purchase: 'Compra',
      purchase_plural: 'Compras',
      category: 'Tipo',
      category_plural: 'Tipos',
      supplier: 'Distribuidor',
      supplier_plural: 'Distribuidores',
      stock: 'Stock',
      stock_minimo: 'Stock Mínimo',
      price: 'Precio',
      price_plural: 'Precios',
      cost: 'Costo',
      sku: 'Código',
      dashboard: 'Dashboard',
      report: 'Reporte',
      report_plural: 'Reportes',
      user: 'Usuario',
      user_plural: 'Usuarios',
      service: 'Servicio',
      service_plural: 'Servicios',
    },
    extraFields: {
      product: [
        { key: 'marca', label: 'Marca', type: 'text', placeholder: 'Ej: José Cuervo' },
        { key: 'graduacion', label: 'Graduación (%)', type: 'number', placeholder: 'Ej: 40' },
        { key: 'volumen_ml', label: 'Volumen (ml)', type: 'number', placeholder: 'Ej: 750' },
      ],
      customer: [],
      sale: [],
    },
    // Default categories seeded automatically when a licorería is created
    defaultCategories: [
      { nombre: 'Bebidas Alcohólicas', descripcion: 'Vinos, cervezas, licores y destilados' },
      { nombre: 'Snacks', descripcion: 'Papas, galletas, frutos secos y botanas' },
      { nombre: 'Cigarros', descripcion: 'Tabaco y cigarrillos' },
      { nombre: 'Bebidas', descripcion: 'Gaseosas, agua, jugos y energizantes' },
      { nombre: 'Cervezas', descripcion: 'Cervezas nacionales e importadas' },
      { nombre: 'Vinos y Licores', descripcion: 'Vinos, whiskys, rones y otros destilados' },
    ],
  },

  abarrotes: {
    name: 'Abarrotes / Almacén',
    description: 'Tienda de abarrotes y productos de consumo',
    labels: {
      product: 'Artículo',
      product_plural: 'Artículos',
      customer: 'Cliente',
      customer_plural: 'Clientes',
      sale: 'Venta',
      sale_plural: 'Ventas',
      purchase: 'Compra',
      purchase_plural: 'Compras',
      category: 'Departamento',
      category_plural: 'Departamentos',
      supplier: 'Proveedor',
      supplier_plural: 'Proveedores',
      stock: 'Stock',
      stock_minimo: 'Stock Mínimo',
      price: 'Precio',
      price_plural: 'Precios',
      cost: 'Costo',
      sku: 'Código',
      dashboard: 'Dashboard',
      report: 'Reporte',
      report_plural: 'Reportes',
      user: 'Usuario',
      user_plural: 'Usuarios',
      service: 'Servicio',
      service_plural: 'Servicios',
    },
    extraFields: {
      product: [
        { key: 'marca', label: 'Marca', type: 'text', placeholder: 'Ej: Bimbo' },
        { key: 'peso_volumen', label: 'Peso / Volumen', type: 'text', placeholder: 'Ej: 1kg' },
        { key: 'fecha_caducidad', label: 'Fecha Caducidad', type: 'date' },
      ],
      customer: [],
      sale: [],
    },
  },

  ropa: {
    name: 'Ropa y Accesorios',
    description: 'Venta de prendas de vestir y accesorios',
    labels: {
      product: 'Prenda',
      product_plural: 'Prendas',
      customer: 'Cliente',
      customer_plural: 'Clientes',
      sale: 'Venta',
      sale_plural: 'Ventas',
      purchase: 'Compra',
      purchase_plural: 'Compras',
      category: 'Línea',
      category_plural: 'Líneas',
      supplier: 'Proveedor',
      supplier_plural: 'Proveedores',
      stock: 'Stock',
      stock_minimo: 'Stock Mínimo',
      price: 'Precio',
      price_plural: 'Precios',
      cost: 'Costo',
      sku: 'Código',
      dashboard: 'Dashboard',
      report: 'Reporte',
      report_plural: 'Reportes',
      user: 'Usuario',
      user_plural: 'Usuarios',
      service: 'Servicio',
      service_plural: 'Servicios',
    },
    extraFields: {
      product: [
        { key: 'talla', label: 'Talla', type: 'text', placeholder: 'Ej: M, L, XL' },
        { key: 'color', label: 'Color', type: 'text', placeholder: 'Ej: Rojo, Azul' },
        { key: 'material', label: 'Material', type: 'text', placeholder: 'Ej: Algodón' },
      ],
      customer: [],
      sale: [],
    },
  },

  electronica: {
    name: 'Electrónicos',
    description: 'Venta de equipos electrónicos y tecnología',
    labels: {
      product: 'Equipo',
      product_plural: 'Equipos',
      customer: 'Cliente',
      customer_plural: 'Clientes',
      sale: 'Venta',
      sale_plural: 'Ventas',
      purchase: 'Compra',
      purchase_plural: 'Compras',
      category: 'Tipo',
      category_plural: 'Tipos',
      supplier: 'Distribuidor',
      supplier_plural: 'Distribuidores',
      stock: 'Stock',
      stock_minimo: 'Stock Mínimo',
      price: 'Precio',
      price_plural: 'Precios',
      cost: 'Costo',
      sku: 'Modelo',
      dashboard: 'Dashboard',
      report: 'Reporte',
      report_plural: 'Reportes',
      user: 'Usuario',
      user_plural: 'Usuarios',
      service: 'Servicio',
      service_plural: 'Servicios',
    },
    extraFields: {
      product: [
        { key: 'marca', label: 'Marca', type: 'text', placeholder: 'Ej: Samsung' },
        { key: 'modelo', label: 'Modelo', type: 'text', placeholder: 'Ej: Galaxy S24' },
        { key: 'garantia_meses', label: 'Garantía (meses)', type: 'number', placeholder: 'Ej: 12' },
      ],
      customer: [],
      sale: [],
    },
  },
};

/** Normalize a stored type to its canonical key (legacy aliases included) */
function normalizeType(type) {
  if (type === 'taller') return 'carwash';
  return BUSINESS_PRESETS[type] ? type : 'general';
}

/** Return the preset for a given type, or general if not found */
function getPreset(type) {
  return BUSINESS_PRESETS[normalizeType(type)];
}

/** Return the canonical list of vehicle types washed at a carwash */
function getVehicleTypes() {
  return BUSINESS_PRESETS.carwash.vehicleTypes || [];
}

/** Return default categories to seed for a business type (or empty) */
function getDefaultCategories(type) {
  return BUSINESS_PRESETS[normalizeType(type)]?.defaultCategories || [];
}

/** Resolve the full config by merging stored JSON config with the preset */
function resolveConfig(storedConfig, tipo_negocio) {
  // storedConfig is already parsed JSON from the DB
  const preset = getPreset(tipo_negocio);

  // Start with preset labels, override with any custom labels stored
  const labels = { ...preset.labels, ...(storedConfig.labels || {}) };

  return {
    tipo: normalizeType(tipo_negocio),
    moneda: storedConfig.moneda || 'PEN',
    idioma: storedConfig.idioma || 'es',
    labels,
    extraFields: preset.extraFields,
    vehicleTypes: preset.vehicleTypes || [],
    // GPS location of the business (used as the origin in delivery maps)
    ubicacion: storedConfig.ubicacion || null,
    businessTypeInfo: preset,
  };
}

module.exports = { BUSINESS_PRESETS, getPreset, getVehicleTypes, getDefaultCategories, resolveConfig, normalizeType };
