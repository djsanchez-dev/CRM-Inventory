# 📦 CRM Gestión Comercial

**Sistema profesional de gestión de inventario, ventas y clientes.**

Plataforma integral para la administración de negocios comerciales. Desplegable en infraestructura cloud (**Vercel + Neon PostgreSQL**) o en local con **SQLite**, con backend **Node.js/Express** y frontend **React + Vite**.

> La base de datos se detecta automáticamente: si `DATABASE_URL` está definida usa **PostgreSQL**; si no, usa **SQLite** local sin configuración adicional.

> 🏢 Ideal para: Tiendas, bodegas, licorerías, ferreterías, tiendas de ropa, electrónicos y negocios de consumo masivo.

---

## 🚀 Demo en Vivo

[Solicita una demo personalizada →](#-contacto-comercial)

---

## ✨ Características

### Módulos Principales
| Módulo | Descripción |
|--------|-------------|
| 📊 **Dashboard** | KPIs, gráficos de ventas, stock bajo, productos más vendidos |
| 📦 **Productos** | Catálogo completo con SKU, precios, costos, stock y alertas |
| 🏷️ **Categorías** | Clasificación de productos por rubro o departamento |
| 🤝 **Proveedores** | Directorio con historial de compras y gastos por proveedor |
| 👥 **Clientes** | CRM con historial de compras y programa de fidelización por puntos |
| 🛒 **Ventas** | Punto de venta con carrito, búsqueda de productos y múltiples formas de pago |
| 📥 **Compras** | Registro de órdenes de compra con auto-incremento de stock |
| 📈 **Reportes** | Análisis de rentabilidad, gastos por proveedor, tendencias mensuales |
| 👤 **Usuarios** | Roles administrador/usuario con permisos diferenciados |

### Funcionalidades Clave
- ✅ **Paginación** en productos, ventas, clientes, compras, proveedores y servicios
- ✅ **Programa de fidelidad** con puntos canjeables por descuentos
- ✅ **Ventas exprés** sin necesidad de registrar cliente
- ✅ **Registro rápido de clientes** durante la venta
- ✅ **Módulo de Servicios (Car Wash / Mecánica)** exclusivo para negocios tipo carwash
- ✅ **Panel de Super Admin** para gestionar todos los negocios y usuarios del sistema
- ✅ **Notificaciones toast** para todas las operaciones CRUD
- ✅ **Skeleton loading** y transiciones animadas
- ✅ **Exportación a CSV y PDF** con jspdf
- ✅ **Búsqueda en tiempo real** con filtros combinados
- ✅ **Helmet + rate limiting** en el backend
- ✅ **Diseño responsive** optimizado para móvil y escritorio
- ✅ **Code-splitting** con React.lazy() para carga rápida
- ✅ **Compresión Brotli + Gzip** en build de producción

---

## 🧰 Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| **Frontend** | React + Vite | 18 / 5 |
| **UI** | Lucide React + Recharts | - |
| **Backend** | Express.js (serverless-ready) | 4.21 |
| **Base de Datos** | PostgreSQL (Neon) **o** SQLite local | 16 / 3.x |
| **Drivers** | pg (node-postgres) + better-sqlite3 | 8.13 / 13.x |
| **Auth** | JWT + bcryptjs | - |
| **Hosting** | Vercel (Serverless Functions) | - |
| **Seguridad** | Helmet + express-rate-limit | - |

---

## 📁 Estructura del Proyecto

```
/
├── api/
│   └── index.js               ★ Entry point serverless (Express)
├── backend/
│   ├── package.json
│   └── src/
│       ├── seed-admin.js       ★ Crea el super admin (`npm run seed`)
│       ├── test-sqlite-convert.js ★ Pruebas de conversión SQLite (`npm test`)
│       ├── database.js         ★ PostgreSQL + SQLite (auto-detect)
│       ├── config/
│       │   └── businessTypes.js  ★ Presets por tipo de negocio
│       ├── middleware/
│       │   └── auth.js          ★ Autenticación JWT
│       └── routes/              ★ 12 rutas API
│           ├── auth.js          ★ Login, verify, refresh
│           ├── business.js      ★ Setup, config
│           ├── products.js      ★ CRUD + paginación
│           ├── categories.js    ★ CRUD
│           ├── customers.js     ★ CRUD + paginación + quick-create
│           ├── suppliers.js     ★ CRUD + paginación
│           ├── sales.js         ★ CRUD + paginación + transacciones
│           ├── purchases.js     ★ CRUD + transacciones
│           ├── services.js      ★ Servicios carwash/mecánica
│           ├── dashboard.js     ★ KPIs y estadísticas
│           ├── reports.js       ★ Reportes avanzados
│           ├── users.js         ★ CRUD + perfil
│           └── admin.js         ★ Panel Super Admin
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── App.jsx              ★ Lazy-loading + Suspense
│       ├── main.jsx             ★ Entry point React
│       ├── index.css            ★ Estilos globales (7000+ líneas)
│       ├── api/client.js        ★ Cliente HTTP con JWT
│       ├── components/          ★ Componentes reutilizables
│       │   ├── Layout.jsx      ★ Sidebar + header
│       │   ├── Pagination.jsx  ★ Paginación reusable
│       │   ├── Icons.jsx       ★ Iconos SVG inline
│       │   └── ...             ★ Toast, Loader, etc.
│       ├── context/             ★ AuthContext, BusinessConfig
│       ├── pages/               ★ 12 páginas del CRM
│       └── utils/export.js      ★ CSV + PDF export
├── vercel.json                  ★ Configuración Vercel
├── package.json                 ★ Dependencias backend (root)
└── .env.example                 ★ Template variables de entorno
```

---

## 🔧 Instalación y Desarrollo Local

### Prerrequisitos
- Node.js v18+
- npm v9+
- (Opcional) Una base de datos PostgreSQL, ej. [Neon](https://console.neon.tech) — tier gratis. Sin ella, el sistema usa **SQLite** local automáticamente.

### 1. Clonar e instalar dependencias

```bash
# Instalar dependencias del backend (raíz)
npm install

# Instalar dependencias del frontend
cd frontend && npm install
cd ..
```

### 2. Configurar variables de entorno (opcional para desarrollo)

```bash
cp .env.example .env
# Para usar PostgreSQL: define DATABASE_URL en .env
# Para desarrollo local: deja DATABASE_URL vacío (usa SQLite)
```

### 3. Inicializar esquema de base de datos

```bash
npm run migrate
```

> El esquema también se inicializa automáticamente al arrancar el backend por primera vez, así que este paso es opcional.

### 4. Crear el super administrador (opcional)

```bash
npm run seed
# o con parámetros: npm run seed -- --username=admin --password=secreto123 --nombre="Super Admin"
```

### 5. Iniciar en desarrollo

```bash
# Backend + Frontend simultáneamente (requiere concurrently)
npm run dev

# O por separado:
npm run dev:backend    # http://localhost:3001
npm run dev:frontend   # http://localhost:5173
```

### 6. Abrir en el navegador

```
http://localhost:5173
```

### Credenciales por defecto
Tras la configuración inicial del negocio, las credenciales se definen durante el setup (asistente en `/setup`).

## ☁️ Despliegue en Vercel

### Paso 1: Crear base de datos Neon

1. Ve a [console.neon.tech](https://console.neon.tech) y crea una cuenta gratuita
2. Crea un nuevo proyecto (selecciona la región más cercana a tus usuarios)
3. Copia la cadena de conexión (`DATABASE_URL`)

### Paso 2: Configurar en Vercel

1. Ve a [vercel.com](https://vercel.com) e importa tu repositorio de Git
2. Configura las siguientes variables de entorno en **Settings > Environment Variables**:

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | Cadena de conexión a Neon PostgreSQL | `postgresql://user:pass@ep-xxx.aws.neon.tech/neondb?sslmode=require` |
| `JWT_SECRET` | Clave secreta para firmar tokens JWT | Generar con: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `FRONTEND_URL` | (Opcional) URL de tu dominio personalizado | `https://tudominio.com` |

3. **Framework Preset**: Vite (se detecta automáticamente)
4. **Root Directory**: `./` (raíz del proyecto)
5. **Build Command**: Se usa el `buildCommand` de `vercel.json`

### Paso 3: Desplegar

```bash
# Instalar Vercel CLI (opcional)
npm i -g vercel

# Desplegar
vercel --prod
```

O simplemente conecta tu repositorio de Git en el dashboard de Vercel para deploys automáticos.

### Paso 4: Configuración inicial

1. Abre la URL de tu deployment
2. Completa el asistente de configuración del negocio
3. ¡Listo para usar!

---

## 📡 API Endpoints

### Autenticación
| Método | Ruta | Auth | Descripción |
|--------|------|:----:|-------------|
| POST | `/api/auth/login` | - | Iniciar sesión |
| GET | `/api/auth/verify` | - | Verificar token |
| POST | `/api/auth/refresh` | JWT | Renovar token |

### Negocio
| Método | Ruta | Auth | Descripción |
|--------|------|:----:|-------------|
| POST | `/api/business/setup` | - | Configuración inicial |
| GET | `/api/business/status` | - | ¿Negocio configurado? |
| GET | `/api/business/config` | JWT | Obtener configuración |
| PUT | `/api/business/config` | Admin | Actualizar configuración |

### Productos (paginado)
| Método | Ruta | Auth | Descripción |
|--------|------|:----:|-------------|
| GET | `/api/products?page=&limit=&search=&category=&low_stock=` | JWT | Listar |
| GET | `/api/products/:id` | JWT | Obtener |
| POST | `/api/products` | JWT | Crear |
| PUT | `/api/products/:id` | JWT | Actualizar |
| DELETE | `/api/products/:id` | JWT | Eliminar |

### Categorías
| Método | Ruta | Auth | Descripción |
|--------|------|:----:|-------------|
| GET | `/api/categories` | JWT | Listar |
| GET | `/api/categories/:id` | JWT | Obtener |
| POST | `/api/categories` | JWT | Crear |
| PUT | `/api/categories/:id` | JWT | Actualizar |
| DELETE | `/api/categories/:id` | JWT | Eliminar |

### Proveedores (paginado)
| Método | Ruta | Auth | Descripción |
|--------|------|:----:|-------------|
| GET | `/api/suppliers?page=&limit=&search=` | JWT | Listar |
| GET | `/api/suppliers/:id` | JWT | Obtener |
| POST | `/api/suppliers` | JWT | Crear |
| PUT | `/api/suppliers/:id` | JWT | Actualizar |
| DELETE | `/api/suppliers/:id` | JWT | Eliminar |

### Servicios (Car Wash / Mecánica)
| Método | Ruta | Auth | Descripción |
|--------|------|:----:|-------------|
| GET | `/api/services?date=&tipo=&search=` | JWT | Listar |
| GET | `/api/services/summary?date=` | JWT | Resumen diario |
| POST | `/api/services` | JWT | Registrar |
| DELETE | `/api/services/:id` | JWT | Eliminar |

### Clientes (paginado)
| Método | Ruta | Auth | Descripción |
|--------|------|:----:|-------------|
| GET | `/api/customers?page=&limit=&search=` | JWT | Listar |
| GET | `/api/customers/:id` | JWT | Obtener |
| POST | `/api/customers` | JWT | Crear |
| PUT | `/api/customers/:id` | JWT | Actualizar |
| DELETE | `/api/customers/:id` | JWT | Eliminar |
| POST | `/api/customers/quick` | JWT | Registro rápido |

### Ventas (paginado)
| Método | Ruta | Auth | Descripción |
|--------|------|:----:|-------------|
| GET | `/api/sales?page=&limit=&search=&startDate=&endDate=&customer_id=` | JWT | Listar |
| GET | `/api/sales/:id` | JWT | Obtener (con items) |
| POST | `/api/sales` | JWT | Crear (carrito) |
| DELETE | `/api/sales/:id` | JWT | Anular |

### Compras
| Método | Ruta | Auth | Descripción |
|--------|------|:----:|-------------|
| GET | `/api/purchases?startDate=&endDate=&supplier_id=` | JWT | Listar |
| GET | `/api/purchases/:id` | JWT | Obtener |
| POST | `/api/purchases` | JWT | Crear (+ stock) |
| DELETE | `/api/purchases/:id` | JWT | Eliminar (- stock) |

### Dashboard
| Método | Ruta | Auth | Descripción |
|--------|------|:----:|-------------|
| GET | `/api/dashboard/stats` | JWT | KPIs, ventas recientes, top productos |

### Reportes
| Método | Ruta | Auth | Descripción |
|--------|------|:----:|-------------|
| GET | `/api/reports/supplier-spending?startDate=&endDate=` | JWT | Gastos por proveedor, rentabilidad |
| GET | `/api/reports/services?startDate=&endDate=` | JWT | Reporte de servicios |

### Panel Super Admin
| Método | Ruta | Auth | Descripción |
|--------|------|:----:|-------------|
| GET | `/api/admin/stats` | Super Admin | Estadísticas globales |
| GET | `/api/admin/businesses` | Super Admin | Listar negocios |
| GET | `/api/admin/businesses/:id` | Super Admin | Detalle de negocio |
| DELETE | `/api/admin/businesses/:id` | Super Admin | Eliminar negocio |
| GET | `/api/admin/users` | Super Admin | Listar usuarios |
| PUT | `/api/admin/users/:id` | Super Admin | Editar usuario |
| PUT | `/api/admin/users/:id/reset-password` | Super Admin | Resetear contraseña |
| DELETE | `/api/admin/users/:id` | Super Admin | Eliminar usuario |

### Usuarios
| Método | Ruta | Auth | Descripción |
|--------|------|:----:|-------------|
| GET | `/api/users` | Admin | Listar |
| GET | `/api/users/:id` | Admin | Obtener |
| POST | `/api/users` | Admin | Crear |
| PUT | `/api/users/:id` | Admin | Actualizar |
| DELETE | `/api/users/:id` | Admin | Eliminar |
| PUT | `/api/users/profile` | JWT | Actualizar perfil propio |

---

## 🔐 Variables de Entorno

| Variable | Requerida | Descripción |
|----------|:---------:|-------------|
| `DATABASE_URL` | ⚠️* | Cadena de conexión PostgreSQL. Vacía/vacante → SQLite local |
| `JWT_SECRET` | ⚠️* | Clave secreta para JWT (usa un valor por defecto en dev) |
| `FRONTEND_URL` | ❌ | URL del frontend para CORS (default: auto) |
| `RATE_LIMIT_MAX` | ❌ | Máximo de requests por ventana (default: 2000) |
| `NODE_ENV` | ❌ | `production` en Vercel (se auto-detects) |

> \* `DATABASE_URL` es obligatoria solo en producción (Vercel). `JWT_SECRET` se recomienda configurarlo siempre en producción.

---

## 🧪 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Inicia backend + frontend (concurrently) |
| `npm run dev:backend` | Backend con watch mode |
| `npm run dev:frontend` | Frontend con Vite dev server |
| `npm run build` | Build de producción del frontend |
| `npm start` | Inicia backend en producción |
| `npm run migrate` | Inicializa/actualiza el schema (PG o SQLite) |
| `npm run seed` | Crea el super administrador (`backend/src/seed-admin.js`) |
| `npm test` | Pruebas de conversión SQLite (`backend/test-sqlite-convert.js`) |

---

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/mejora`)
3. Commit (`git commit -m 'feat: agrega mejora'`)
4. Push (`git push origin feature/mejora`)
5. Abre un Pull Request

---

## 📄 Licencia

**Sistema de Gestión Comercial v2.0** — Despliegue en Vercel + Neon PostgreSQL
© 2026. Todos los derechos reservados.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/tu-usuario/crm-inventario)
