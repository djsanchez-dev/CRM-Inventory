# 📦 CRM Gestión Comercial

**Sistema profesional de gestión de inventario, ventas y clientes.**

Plataforma integral para la administración de negocios comerciales. Desplegada en infraestructura cloud de clase mundial (**Vercel + Neon PostgreSQL**), con backend **Node.js/Express** serverless y frontend **React + Vite**.

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
- ✅ **Paginación** en productos, ventas, clientes y proveedores
- ✅ **Programa de fidelidad** con puntos canjeables por descuentos
- ✅ **Ventas exprés** sin necesidad de registrar cliente
- ✅ **Registro rápido de clientes** durante la venta
- ✅ **Notificaciones toast** para todas las operaciones CRUD
- ✅ **Skeleton loading** y transiciones animadas (framer-motion)
- ✅ **Exportación a CSV y PDF** con jspdf
- ✅ **Búsqueda en tiempo real** con filtros combinados
- ✅ **Protección CSRF** y rate limiting
- ✅ **Diseño responsive** optimizado para móvil y escritorio
- ✅ **Code-splitting** con React.lazy() para carga rápida
- ✅ **Compresión Brotli + Gzip** en build de producción

---

## 🧰 Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| **Frontend** | React + Vite | 18 / 5 |
| **UI** | Lucide React + Recharts | - |
| **Backend** | Express.js (serverless) | 4.21 |
| **Base de Datos** | PostgreSQL (Neon) | 16 |
| **ORM/Driver** | pg (node-postgres) | 8.13 |
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
│       ├── database.js         ★ PostgreSQL (pg Pool + helpers)
│       ├── config/
│       │   └── businessTypes.js  ★ Presets por tipo de negocio
│       ├── middleware/
│       │   └── auth.js          ★ Autenticación JWT
│       └── routes/              ★ 11 rutas API
│           ├── auth.js          ★ Login, verify, register
│           ├── business.js      ★ Setup, config
│           ├── products.js      ★ CRUD + paginación
│           ├── categories.js    ★ CRUD
│           ├── customers.js     ★ CRUD + paginación + quick-create
│           ├── suppliers.js     ★ CRUD + paginación
│           ├── sales.js         ★ CRUD + paginación + transacciones
│           ├── purchases.js     ★ CRUD + transacciones
│           ├── dashboard.js     ★ KPIs y estadísticas
│           ├── reports.js       ★ Reportes avanzados
│           └── users.js         ★ CRUD + perfil
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
- Una base de datos PostgreSQL (recomendado: [Neon](https://console.neon.tech) — tier gratis)

### 1. Clonar e instalar dependencias

```bash
# Instalar dependencias del backend (raíz)
npm install

# Instalar dependencias del frontend
cd frontend && npm install
cd ..
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
# Editar .env con tu DATABASE_URL de Neon
```

### 3. Inicializar esquema de base de datos

```bash
npm run migrate
```

### 4. Iniciar en desarrollo

```bash
# Backend + Frontend simultáneamente (requiere concurrently)
npm run dev

# O por separado:
npm run dev:backend    # http://localhost:3001
npm run dev:frontend   # http://localhost:5173
```

### 5. Abrir en el navegador

```
http://localhost:5173
```

### Credenciales por defecto
Tras la configuración inicial del negocio, las credenciales se definen durante el setup.

> **Para desarrollo:** Ejecuta `npm run migrate` para inicializar el schema, luego usa la interfaz de configuración inicial en `/business-setup`.

---

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
| POST | `/api/auth/register` | Admin | Registrar usuario |

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
| `DATABASE_URL` | ✅ | Cadena de conexión a PostgreSQL (Neon) |
| `JWT_SECRET` | ✅ | Clave secreta para JWT (mín. 32 caracteres) |
| `FRONTEND_URL` | ❌ | URL del frontend para CORS (default: auto) |
| `RATE_LIMIT_MAX` | ❌ | Máximo de requests por ventana (default: 2000) |
| `NODE_ENV` | ❌ | `production` en Vercel (se auto-detects) |

---

## 🧪 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Inicia backend + frontend (concurrently) |
| `npm run dev:backend` | Backend con watch mode |
| `npm run dev:frontend` | Frontend con Vite dev server |
| `npm run build` | Build de producción del frontend |
| `npm start` | Inicia backend en producción |
| `npm run migrate` | Inicializa/actualiza el schema PostgreSQL |

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
