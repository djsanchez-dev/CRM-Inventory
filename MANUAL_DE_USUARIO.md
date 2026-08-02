# Sistema de Gestión Comercial

## Manual de Usuario

**Versión:** 1.0  
**Última actualización:** Julio 2026  
**Clasificación:** Documentación de uso interno

---

## Índice de Contenidos

1. [Introducción](#1-introducción)
2. [Requerimientos del Sistema](#2-requerimientos-del-sistema)
3. [Acceso al Sistema](#3-acceso-al-sistema)
4. [Configuración Inicial del Negocio](#4-configuración-inicial-del-negocio)
5. [Panel Principal (Dashboard)](#5-panel-principal-dashboard)
6. [Gestión de Productos](#6-gestión-de-productos)
7. [Gestión de Categorías](#7-gestión-de-categorías)
8. [Gestión de Proveedores](#8-gestión-de-proveedores)
9. [Gestión de Clientes](#9-gestión-de-clientes)
10. [Módulo de Ventas](#10-módulo-de-ventas)
11. [Módulo de Compras](#11-módulo-de-compras)
12. [Reportes y Estadísticas](#12-reportes-y-estadísticas)
13. [Gestión de Usuarios](#13-gestión-de-usuarios)
14. [Perfil de Usuario](#14-perfil-de-usuario)
15. [Exportación de Datos](#15-exportación-de-datos)
16. [Solución de Problemas Frecuentes](#16-solución-de-problemas-frecuentes)
17. [Soporte Técnico](#17-soporte-técnico)

---

## 1. Introducción

### 1.1 Descripción General

El **Sistema de Gestión Comercial** es una plataforma integral diseñada para administrar las operaciones diarias de negocios comerciales. Proporciona herramientas para el control de inventario, registro de ventas y compras, gestión de clientes con programa de fidelización, y generación de reportes ejecutivos.

### 1.2 Módulos del Sistema

| Módulo | Descripción |
|--------|-------------|
| **Dashboard** | Panel resumen con indicadores clave de rendimiento (KPI) |
| **Productos** | Catálogo de productos con control de stock y precios |
| **Categorías** | Clasificación de productos por rubro |
| **Proveedores** | Directorio de proveedores |
| **Clientes** | Base de datos de clientes con historial y puntos de fidelidad |
| **Ventas** | Punto de venta con opciones de cobro y facturación |
| **Compras** | Registro de órdenes de compra y reposición de stock |
| **Servicios** | Control diario de servicios (Car Wash y Mecánica) para negocios tipo carwash |
| **Reportes** | Análisis de datos con exportación a PDF/CSV |
| **Usuarios** | Administración de cuentas y permisos |

### 1.3 Roles de Usuario

El sistema contempla tres roles con distintos niveles de acceso:

- **Super Administrador:** Usuario global que gestiona todos los negocios del sistema desde un panel exclusivo (creado con `npm run seed`).
- **Administrador:** Acceso completo a las funcionalidades de su negocio, incluyendo la gestión de usuarios.
- **Usuario:** Acceso a las operaciones diarias (ventas, compras, productos) sin capacidad de administrar cuentas de otros usuarios.

---

## 2. Requerimientos del Sistema

### 2.1 Acceso

El sistema funciona completamente en la nube a través de un navegador web. No requiere instalación de software adicional ni configuración de hardware especial.

### 2.2 Requisitos de Conexión

- Conexión a internet estable (mínimo 1 Mbps)
- Sin necesidad de VPN ni redes privadas

### 2.3 Navegadores Soportados

| Navegador | Versión Mínima |
|-----------|---------------|
| Google Chrome | 90+ |
| Mozilla Firefox | 88+ |
| Microsoft Edge | 90+ |
| Safari | 14+ |

> **Nota:** Se recomienda utilizar Google Chrome o Microsoft Edge para una experiencia óptima. El sistema es responsive y funciona en tablets y smartphones.

---

## 3. Acceso al Sistema

### 3.1 URL de Acceso

El sistema está disponible en la nube. El administrador del sistema le proporcionará la URL específica de su organización.

Ejemplo: `https://tu-empresa.vercel.app`

### 3.2 Inicio de Sesión

Pantalla de ingreso con los siguientes campos:

1. **Usuario:** Ingrese su nombre de usuario asignado por el administrador.
2. **Contraseña:** Ingrese su contraseña personal.
3. **Botón "Iniciar Sesión":** Presione para acceder al sistema.

### 3.3 Primera Configuración (Setup Inicial)

Al acceder por primera vez al sistema (cuando no hay ningún negocio registrado), se mostrará un **asistente de configuración** en `/setup` para crear el negocio y el usuario administrador:

1. **Nombre del negocio:** Razón social o nombre comercial
2. **Tipo de negocio:** Seleccione el rubro (General / Tienda, Car Wash, Licorería, Abarrotes, Ropa, Electrónicos, Otro)
3. **Moneda:** Seleccione la moneda de operación (PEN, USD, MXN, COP, EUR, etc.)
4. **Nombre del administrador:** Nombre completo
5. **Usuario administrador:** Cree un nombre de usuario único
6. **Contraseña:** Defina una contraseña segura (mínimo 6 caracteres)

> El asistente solo se muestra cuando no existe ningún negocio. Para crear negocios adicionales use el enlace **"Crear otro negocio"** desde la pantalla de login.

> ⚠️ **Importante:** Guarde estas credenciales en un lugar seguro. El asistente solo se muestra una vez.

### 3.4 Recuperación de Contraseña

Si olvida su contraseña, contacte al administrador del sistema para restablecerla. Por razones de seguridad, no es posible recuperar contraseñas de forma automática.

---

## 4. Configuración Inicial del Negocio

Al iniciar sesión por primera vez, el sistema mostrará un asistente de configuración para registrar los datos del negocio.

### 4.1 Datos del Negocio

Complete los siguientes campos obligatorios:

| Campo | Descripción | Obligatorio |
|-------|-------------|:-----------:|
| **Nombre del Negocio** | Razón social o nombre comercial | Sí |
| **Tipo de Negocio** | Seleccione el rubro de su negocio | Sí |
| **Dirección** | Ubicación física del establecimiento | No |
| **Teléfono** | Número de contacto principal | No |
| **Email** | Correo electrónico corporativo | No |
| **Moneda** | Tipo de moneda para operaciones (PEN, USD, etc.) | Sí |

### 4.2 Tipos de Negocio Disponibles

El sistema se adapta a distintos rubros comerciales. Seleccione el que mejor describa su operación:

- Tienda de Ropa
- Electrónica
- Farmacia
- Papelería
- Ferretería
- Abarrotes
- Restaurante
- Taller Mecánico
- Otros

> Cada tipo de negocio ajusta la interfaz y los campos disponibles para adaptarse a las necesidades del rubro seleccionado.

### 4.3 Campos Personalizados

El sistema permite agregar campos adicionales según el tipo de negocio y las necesidades específicas de su operación. Estos campos pueden aplicarse a:

- **Productos:** Atributos adicionales como talla, color, peso, etc.
- **Clientes:** Información complementaria específica de su rubro.
- **Ventas:** Datos extra que desee capturar en cada transacción.

---

## 5. Panel Principal (Dashboard)

### 5.1 Acceso

Una vez iniciada la sesión, el **Dashboard** se muestra como pantalla principal.

### 5.2 Indicadores Clave (KPI)

El panel superior muestra tarjetas con indicadores en tiempo real:

| Indicador | Descripción |
|-----------|-------------|
| **Productos** | Total de productos activos en el catálogo |
| **Clientes** | Número total de clientes registrados |
| **Ventas Hoy** | Total de ventas realizadas en el día actual |
| **Ingresos Hoy** | Suma total de ingresos generados en el día |

> Cada tarjeta es un enlace directo a la sección correspondiente. Al hacer clic en "Productos", el sistema lo redirige al módulo de productos.

### 5.3 Secciones del Dashboard

#### 5.3.1 Ventas Recientes
Lista las últimas transacciones realizadas con información de:
- Cliente (o "Sin cliente" para ventas directas)
- Productos vendidos
- Total de la venta
- Método de pago
- Fecha y hora

#### 5.3.2 Productos con Stock Bajo
Muestra una alerta visual de productos cuyo inventario está por debajo del límite mínimo configurado. Cada producto incluye un botón de acceso directo para realizar una orden de compra.

#### 5.3.3 Productos Más Vendidos
Ranking de los productos con mayor volumen de ventas en el período reciente, con indicador de cantidad vendida.

### 5.4 Barra de Navegación Lateral

El menú lateral izquierdo proporciona acceso a todos los módulos del sistema:

- **Inicio** → Dashboard
- **Productos** → Gestión de catálogo
- **Categorías** → Clasificación de productos
- **Proveedores** → Directorio de proveedores
- **Clientes** → Base de datos de clientes
- **Nueva Venta / Ventas** → Módulo de ventas
- **Compras** → Registro de compras
- **Reportes** → Análisis y estadísticas
- **Usuarios** → Administración (solo administradores)
- **Perfil** → Configuración personal

> En la parte inferior del menú se encuentra el botón **"Cerrar Sesión"** para finalizar su sesión de forma segura.

---

## 6. Gestión de Productos

### 6.1 Catálogo de Productos

El módulo de productos permite administrar el inventario completo del negocio. Al ingresar, se muestra una tabla con todos los productos registrados.

### 6.2 Registrar un Nuevo Producto

1. Haga clic en el botón **"Nuevo Producto"** ubicado en la parte superior derecha.
2. Complete el formulario con los siguientes datos:

| Campo | Descripción | Obligatorio |
|-------|-------------|:-----------:|
| **Nombre** | Nombre del producto | Sí |
| **Descripción** | Detalles adicionales del producto | No |
| **Precio de Venta** | Precio unitario al público | Sí |
| **Precio de Compra** | Costo unitario de adquisición | No |
| **Stock** | Cantidad actual en inventario | Sí |
| **Stock Mínimo** | Límite para alerta de reabastecimiento | No |
| **Categoría** | Clasificación del producto | No |
| **Proveedor** | Proveedor habitual | No |

3. Presione **"Guardar"** para registrar el producto.

### 6.3 Editar un Producto

1. Ubique el producto en la tabla.
2. Haga clic en el ícono de **lápiz (editar)** en la columna de acciones.
3. Modifique los campos necesarios.
4. Presione **"Guardar Cambios"**.

### 6.4 Eliminar un Producto

1. Haga clic en el ícono de **papelera (eliminar)** en la columna de acciones.
2. Confirme la eliminación en el cuadro de diálogo.

> ⚠️ Eliminar un producto es una acción irreversible. Considere desactivarlo en lugar de eliminarlo si existe historial de ventas asociado.

### 6.5 Búsqueda de Productos

Utilice el campo de búsqueda en la parte superior de la tabla para filtrar productos por nombre. La búsqueda se realiza en tiempo real mientras escribe.

### 6.6 Alerta de Stock Bajo

El sistema muestra una indicación visual (color rojo) en los productos cuyo stock actual sea menor o igual al stock mínimo configurado. Esto permite identificar rápidamente qué productos necesitan reabastecimiento.

---

## 7. Gestión de Categorías

### 7.1 Clasificación de Productos

Las categorías permiten organizar los productos por rubro o tipo, facilitando su localización y generación de reportes.

### 7.2 Operaciones Disponibles

#### Crear una Categoría
1. Haga clic en **"Nueva Categoría"**.
2. Ingrese el **nombre** de la categoría.
3. Presione **"Guardar"**.

#### Editar una Categoría
1. Haga clic en el ícono de editar junto a la categoría.
2. Modifique el nombre.
3. Presione **"Guardar Cambios"**.

#### Eliminar una Categoría
1. Haga clic en el ícono de eliminar.
2. Confirme la acción.

> **Nota:** Al eliminar una categoría, los productos asignados a ella quedarán sin categoría, pero no se eliminarán.

---

## 8. Gestión de Proveedores

### 8.1 Directorio de Proveedores

Módulo destinado a registrar y administrar los proveedores del negocio.

### 8.2 Registrar un Proveedor

1. Haga clic en **"Nuevo Proveedor"**.
2. Complete el formulario:

| Campo | Descripción | Obligatorio |
|-------|-------------|:-----------:|
| **Nombre** | Nombre del proveedor | Sí |
| **Contacto** | Persona de contacto | No |
| **Teléfono** | Número telefónico | No |
| **Email** | Correo electrónico | No |
| **Dirección** | Dirección del proveedor | No |

3. Presione **"Guardar"**.

### 8.3 Editar y Eliminar Proveedores

Siga el mismo procedimiento que con productos y categorías, utilizando los íconos de acción en la tabla.

---

## 9. Gestión de Clientes

### 9.1 Base de Datos de Clientes

El sistema cuenta con un módulo completo para la administración de clientes, incluyendo historial de compras y un sistema de fidelización basado en puntos.

### 9.2 Registrar un Cliente

#### Registro Completo
1. Acceda al módulo **Clientes** desde el menú lateral.
2. Haga clic en **"Nuevo Cliente"**.
3. Complete los datos:

| Campo | Descripción | Obligatorio |
|-------|-------------|:-----------:|
| **Nombre** | Nombre completo | Sí |
| **Email** | Correo electrónico | No |
| **Teléfono** | Número de contacto | No |
| **Dirección** | Dirección fiscal o de envío | No |
| **Tipo de Documento** | DNI, RUC, Pasaporte, etc. | No |
| **Número de Documento** | Identificación oficial | No |

4. Presione **"Guardar"**.

#### Registro Rápido desde Ventas
Durante el proceso de venta, es posible registrar un cliente de forma expresa:
1. Al realizar una venta, active la opción **"Buscar Cliente"**.
2. Si el cliente no está registrado, haga clic en **"Registrar Cliente"**.
3. Ingrese únicamente el **nombre** (obligatorio) y **teléfono** (opcional).
4. El cliente se registra y selecciona automáticamente en la venta actual.

> Este flujo está diseñado para agilizar la atención al cliente sin interrumpir el proceso de venta.

### 9.3 Sistema de Puntos de Fidelidad

#### Concepto
El sistema de puntos premia la lealtad de los clientes frecuentes. Por cada compra realizada, el cliente acumula puntos que pueden ser canjeados por descuentos en compras futuras.

#### Acumulación de Puntos
| Concepto | Regla |
|----------|-------|
| **Tasa de acumulación** | 1 punto por cada S/ 100.00 (o equivalente) de compra |
| **Cálculo** | Se consideran compras netas (incluye productos, sin descuentos por puntos) |

#### Canje de Puntos
| Concepto | Regla |
|----------|-------|
| **Valor del punto** | 1 punto = S/ 1.00 de descuento |
| **Uso máximo** | Hasta el 100% de los puntos disponibles del cliente |
| **Aplicación** | Al momento de realizar una venta, seleccione el cliente y active el control deslizante de puntos |

#### Visualización de Puntos
- En el módulo de **Clientes**, cada tarjeta muestra los puntos acumulados con el ícono ⭐.
- Durante una venta, al seleccionar un cliente, el panel muestra sus puntos disponibles.
- El detalle de cada venta indica los puntos ganados y los puntos utilizados en la transacción.

---

## 10. Módulo de Ventas

### 10.1 Descripción General

El módulo de ventas es el corazón del sistema. Permite registrar transacciones comerciales de forma rápida y eficiente, con soporte para múltiples formas de pago y gestión de clientes.

### 10.2 Flujo de Venta

#### Paso 1: Configuración del Cliente
Al hacer clic en **"Nueva Venta"**, se presentan dos opciones:

**A) Venta Directa (Por Defecto)**
- No requiere registrar un cliente.
- Ideal para transacciones rápidas o clientes que no desean proporcionar datos.
- Identificada visualmente con un distintivo **"Venta Directa"**.

**B) Venta con Cliente Registrado**
- Haga clic en **"Buscar Cliente"** para abrir el panel de búsqueda.
- Escriba el nombre o teléfono del cliente.
- Seleccione el cliente de los resultados mostrados.
- Si el cliente no existe, use la opción **"Registrar Cliente"** para crearlo rápidamente.

#### Paso 2: Agregar Productos
1. En el campo de **búsqueda de productos**, comience a escribir el nombre del producto.
2. Seleccione el producto deseado de la lista desplegable.
3. Configure la **cantidad** a vender (por defecto: 1).
4. Haga clic en **"Agregar"** o presione Enter.
5. Repita el proceso para cada producto adicional.

#### Paso 3: Revisar el Carrito
El carrito de compras muestra:
- Nombre del producto
- Precio unitario
- Cantidad solicitada
- Subtotal por producto
- Botón para eliminar productos del carrito

Los botones **"+"/"-"** permiten ajustar la cantidad de cada producto directamente desde el carrito.

#### Paso 4: Aplicar Puntos de Fidelidad (Opcional)
Si la venta está asociada a un cliente con puntos acumulados:
1. Se mostrará un control deslizante en el panel de cliente.
2. Arrastre el deslizador o ingrese manualmente la cantidad de puntos a canjear.
3. El descuento equivalente se reflejará automáticamente en el total de la venta.

#### Paso 5: Seleccionar Tipo de Pago
Seleccione el método de pago entre las opciones disponibles:
- Efectivo
- Tarjeta
- Transferencia

> Si el negocio requiere otros métodos (Yape, Plin, etc.), estos se configuran en el backend (`tipo_pago`).

#### Paso 6: Completar la Venta
1. Presione **"Cobrar"** para finalizar la transacción.
2. El sistema registrará automáticamente:
   - Descuento del stock de productos vendidos.
   - Acumulación de puntos de fidelidad (si aplica).
   - Registro en el historial de ventas.

### 10.3 Historial de Ventas

En la vista de **Ventas** se muestra el historial completo de transacciones con la siguiente información (con paginación y filtros por fecha, cliente y tipo de pago):

| Columna | Descripción |
|---------|-------------|
| **Folio** | Número único de transacción |
| **Cliente** | Nombre del cliente o "Sin cliente" |
| **Productos** | Cantidad de artículos vendidos |
| **Total** | Monto total de la venta |
| **Tipo de Pago** | Método de pago utilizado |
| **Fecha** | Fecha y hora del registro |
| **Acciones** | Ver detalle y anular venta |

### 10.4 Detalle de Venta

Al hacer clic en **"Ver Detalle"** (ícono de ojo) en una venta registrada, se muestra:
- Información del cliente
- Productos vendidos con cantidades y precios
- Puntos ganados y puntos utilizados
- Método de pago
- Fecha y hora

### 10.5 Anulación de Ventas

Para anular una venta:
1. Localice la venta en el historial.
2. Haga clic en el ícono de **anular** (✕).
3. Confirme la anulación.
4. El sistema revertirá automáticamente el stock de los productos.

> ⚠️ La anulación de ventas es irreversible. Solo los administradores pueden anular transacciones.

---

## 11. Módulo de Compras

### 11.1 Propósito

El módulo de compras permite registrar las órdenes de reposición de inventario, actualizando automáticamente el stock de los productos.

### 11.2 Registrar una Compra

1. Haga clic en **"Nueva Compra"**.
2. Seleccione el **proveedor** de la lista desplegable.
3. Agregue productos al listado de compra:
   - Seleccione el producto.
   - Ingrese la **cantidad** adquirida.
   - Verifique el **precio de compra** (precargado del catálogo).
4. Repita para cada producto adquirido.
5. Confirme la compra presionando **"Guardar"**.

### 11.3 Efectos de una Compra

Al registrar una compra:
- El stock de los productos seleccionados se incrementa automáticamente.
- Se registra un movimiento en el historial de compras.
- Se actualiza el precio de compra si se modificó durante el registro.

### 11.4 Historial de Compras

El listado de compras registradas muestra:
- Fecha de la compra
- Proveedor
- Total de la compra
- Cantidad de productos

---

## 12. Reportes y Estadísticas

### 12.1 Panel de Reportes

El módulo de reportes proporciona herramientas de análisis para la toma de decisiones gerenciales.

### 12.2 Tipos de Reportes

#### Reporte de Ventas
- Ingresos totales por período
- Ventas por día/semana/mes
- Comparativas entre períodos
- Ventas por tipo de pago
- Descuentos aplicados por puntos de fidelidad

#### Reporte de Productos
- Productos más vendidos
- Productos con menor rotación
- Valor del inventario total
- Margen de ganancia por producto

#### Reporte de Clientes
- Clientes con más compras
- Clientes con más puntos acumulados
- Historial de compras por cliente

### 12.3 Uso del Filtro de Fechas

Para todos los reportes, puede definir un período específico:

1. Utilice el **selector de fechas** en la parte superior del panel.
2. Seleccione la **fecha de inicio** y **fecha de fin**.
3. Presione **"Filtrar"** para actualizar los datos.
4. También puede usar los botones de acceso rápido:
   - **Hoy**
   - **Esta Semana**
   - **Este Mes**
   - **Este Año**

### 12.4 Exportación de Reportes

Vea la sección [Exportación de Datos](#15-exportación-de-datos) para más detalles.

---

## 13. Gestión de Usuarios

### 13.1 Acceso

Este módulo está disponible **exclusivamente para usuarios con rol de Administrador**.

### 13.2 Crear un Usuario

1. Acceda a **Usuarios** desde el menú lateral.
2. Haga clic en **"Nuevo Usuario"**.
3. Complete los campos:

| Campo | Descripción | Obligatorio |
|-------|-------------|:-----------:|
| **Usuario** | Nombre de usuario para iniciar sesión | Sí |
| **Nombre** | Nombre completo del usuario | Sí |
| **Email** | Correo electrónico | No |
| **Contraseña** | Contraseña de acceso | Sí |
| **Rol** | Administrador o Usuario | Sí |

4. Presione **"Guardar"**.

### 13.3 Editar un Usuario

Se pueden modificar todos los campos excepto el nombre de usuario. Si se cambia la contraseña, el usuario deberá usar la nueva contraseña en su próximo inicio de sesión.

### 13.4 Eliminar un Usuario

Para eliminar un usuario, haga clic en el ícono de eliminar. No es posible eliminar el propio usuario con el que se ha iniciado sesión.

---

## 14. Perfil de Usuario

### 14.1 Datos Personales

Cada usuario puede modificar sus propios datos personales:

- **Nombre:** Actualizar nombre completo.
- **Email:** Cambiar correo electrónico de contacto.

### 14.2 Cambio de Contraseña

Para cambiar su contraseña:
1. Acceda a **Perfil** desde el menú lateral.
2. En la sección de seguridad, ingrese:
   - **Contraseña actual**
   - **Nueva contraseña**
   - **Confirmar nueva contraseña**
3. Presione **"Actualizar Contraseña"**.

> **Requisitos de seguridad:** La contraseña debe tener al menos 6 caracteres.

---

## 15. Exportación de Datos

### 15.1 Formatos Soportados

El sistema permite exportar datos en dos formatos:

| Formato | Uso Recomendado |
|---------|-----------------|
| **CSV** | Procesamiento en hojas de cálculo (Excel, Google Sheets) |
| **PDF** | Presentaciones, informes y archivo documental |

### 15.2 Exportar Ventas

1. En el módulo de **Ventas**, aplique los filtros deseados (fechas, cliente, etc.).
2. Haga clic en el botón de **exportar** (ícono de descarga).
3. Seleccione el formato: **CSV** o **PDF**.
4. El archivo se descargará automáticamente.

### 15.3 Exportar Reportes

1. En el módulo de **Reportes**, seleccione el tipo de reporte y período.
2. Haga clic en **"Exportar"**.
3. Seleccione el formato deseado.

### 15.4 Datos Incluidos en la Exportación

La exportación de ventas incluye:
- Folio de venta
- Cliente
- Productos y cantidades
- Total de la venta
- Tipo de pago
- Fecha y hora
- Puntos ganados y utilizados

---

## 16. Solución de Problemas Frecuentes

### 16.1 No puedo iniciar sesión

**Posibles causas y soluciones:**

| Problema | Solución |
|----------|----------|
| Usuario o contraseña incorrectos | Verifique que ambos campos estén escritos correctamente (distingue mayúsculas/minúsculas) |
| Cuenta bloqueada | Contacte al administrador del sistema |
| Sesión expirada | Cierre el navegador y vuelva a iniciar sesión |

### 16.2 No aparecen productos al vender

**Posibles causas:**

1. Aún no se han registrado productos en el catálogo.
2. Los productos tienen stock en cero (configure stock mínimo para recibir alertas).
3. El filtro de búsqueda está activo (limpie el campo de búsqueda).

### 16.3 El stock no se actualiza

- Verifique que la venta o compra se haya guardado correctamente.
- Si una venta fue anulada, el stock se restablece automáticamente.
- Si el problema persiste, contacte al administrador.

### 16.4 No puedo eliminar un usuario

- Verifique que no está intentando eliminar su propio usuario.
- Confirme que tiene rol de **Administrador**.

### 16.5 Los puntos de fidelidad no se aplican

**Verifique lo siguiente:**

1. La venta debe estar asociada a un **cliente registrado**.
2. El cliente debe tener **puntos disponibles**.
3. El control deslizante debe estar activado durante la venta.
4. Los puntos aplicados no pueden exceder el total de la venta.

### 16.6 Error al exportar a PDF

- Asegúrese de que su navegador permita descargas emergentes (pop-ups) del sitio.
- Intente con otro navegador.
- Si el archivo se descarga pero no se abre, instale un lector de PDF (Adobe Acrobat Reader, etc.).

---

## 17. Soporte Técnico

### 17.1 Contacto

Para reportar fallos técnicos o solicitar asistencia:

| Canal | Información |
|-------|-------------|
| **Email** | soporte@sistemacomercial.com |
| **Teléfono** | (555) 1234-5678 |
| **Horario** | Lunes a viernes, 9:00 a 18:00 hrs |

### 17.2 Reporte de Incidencias

Al reportar un problema, proporcione la siguiente información:

1. **Descripción del problema** (¿qué ocurrió? ¿qué esperaba que ocurriera?).
2. **Pasos para reproducirlo** (¿qué acciones realizó antes del error?).
3. **Captura de pantalla** del error (si aplica).
4. **Navegador y versión** utilizados.

### 17.3 Sugerencias

Agradecemos sus comentarios para mejorar el sistema. Envíe sus sugerencias a nuestro equipo de desarrollo a través del correo de soporte.

---

> **Sistema de Gestión Comercial v1.0**  
> Documentación generada el Julio 2026  
> © 2026 Todos los derechos reservados
