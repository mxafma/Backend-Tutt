# Especificacion React Web MVP - Sistema de Compras Verduleria

## 1. Instruccion principal para Claude

Actua como desarrollador frontend senior especializado en React. Debes crear la aplicacion web administrativa del Sistema de Compras para una verduleria. No debes crear backend. Debes consumir una API REST Spring Boot ya definida. Si falta algun endpoint, crea mocks temporales o deja la integracion preparada en servicios separados.

Prioridad: construir una web funcional, clara, mantenible y simple para usuarios no tecnicos. La app web sera usada principalmente por admin y creador de orden de compra. El comprador usara principalmente Android, pero la web debe poder mostrar informacion de compra y recepcion.

No implementar graficos avanzados, integracion con POS, stock real, merma exacta ni adjuntos de documentos en el MVP.

## 2. Stack frontend definido

- React.
- Vite.
- JavaScript o TypeScript. Preferir TypeScript si se inicia desde cero.
- React Router para rutas.
- Axios o Fetch centralizado para API REST.
- Estado global liviano con Context API, Zustand o TanStack Query. Preferir TanStack Query para datos remotos.
- Formularios con React Hook Form, si se desea.
- Estilos simples con CSS Modules, Tailwind o componentes propios. Priorizar claridad antes que exceso visual.

## 3. Objetivo de la app web

La aplicacion web debe permitir administrar el flujo de ordenes de compra de la verduleria:

- iniciar sesion;
- crear ordenes de compra;
- editar ordenes antes de comprar;
- gestionar productos;
- gestionar proveedores;
- ver pendientes de compra del dia;
- convertir pendientes en productos de una orden;
- revisar ordenes finalizadas por comprador;
- hacer recepcion de mercaderia;
- calcular precios sugeridos;
- cerrar ordenes;
- revisar historial basico;
- ver reportes basicos en tablas simples;
- exportar una orden a Excel usando el endpoint del backend.

## 4. Alcance MVP web

### Incluido

- Login con JWT.
- Layout principal con menu lateral o superior.
- Dashboard simple.
- Modulo de ordenes de compra.
- Crear orden.
- Editar orden.
- Detalle de orden.
- Recepcion de orden.
- Precios sugeridos.
- CRUD de productos.
- CRUD de proveedores.
- Pendientes de compra.
- Compras externas.
- Reportes basicos para admin.
- Historial basico para admin.
- Administracion basica de usuarios, si el backend ya lo permite.

### Excluido del MVP

- Graficos avanzados.
- Dashboard financiero complejo.
- Integracion directa con Eleventa.
- Stock real.
- Merma exacta.
- Adjuntar fotos de documentos.
- Notificaciones avanzadas.
- Comparar precio sugerido contra precio real vendido.
- Offline web.

## 5. Roles y permisos en frontend

La app debe ocultar o bloquear rutas segun rol.

### ADMIN

Puede acceder a todo:

- dashboard;
- ordenes;
- recepcion;
- precios sugeridos;
- productos;
- proveedores;
- compras externas;
- reportes;
- historial;
- administracion de usuarios;
- exportacion Excel;
- correccion de ordenes cerradas.

### CREADOR_OC

Puede acceder a:

- dashboard simple;
- pendientes de compra;
- crear orden;
- editar orden antes de compra;
- ver orden activa;
- productos en modo consulta o creacion rapida, segun sea necesario.

No debe ver reportes sensibles ni historial administrativo.

### COMPRADOR

La web no es su interfaz principal. Si entra a la web, mostrar solo vista limitada:

- orden activa;
- detalle de orden;
- estado de compra.

## 6. Rutas sugeridas

```txt
/login
/app
/app/dashboard
/app/pendientes
/app/ordenes
/app/ordenes/nueva
/app/ordenes/:id
/app/ordenes/:id/recepcion
/app/ordenes/:id/precios
/app/productos
/app/productos/nuevo
/app/productos/:id/editar
/app/proveedores
/app/proveedores/nuevo
/app/proveedores/:id/editar
/app/compras-externas
/app/compras-externas/nueva
/app/reportes
/app/historial
/app/usuarios
```

## 7. Estructura de carpetas recomendada

```txt
src/
  main.tsx
  App.tsx
  routes/
    AppRouter.tsx
    ProtectedRoute.tsx
    RoleRoute.tsx
  api/
    httpClient.ts
    authApi.ts
    usuariosApi.ts
    productosApi.ts
    proveedoresApi.ts
    ordenesApi.ts
    pendientesApi.ts
    comprasExternasApi.ts
    reportesApi.ts
  auth/
    AuthContext.tsx
    useAuth.ts
    tokenStorage.ts
  layouts/
    AppLayout.tsx
    Sidebar.tsx
    Header.tsx
  pages/
    LoginPage.tsx
    DashboardPage.tsx
    PendientesPage.tsx
    OrdenesPage.tsx
    NuevaOrdenPage.tsx
    DetalleOrdenPage.tsx
    RecepcionOrdenPage.tsx
    PreciosSugeridosPage.tsx
    ProductosPage.tsx
    ProductoFormPage.tsx
    ProveedoresPage.tsx
    ProveedorFormPage.tsx
    ComprasExternasPage.tsx
    NuevaCompraExternaPage.tsx
    ReportesPage.tsx
    HistorialPage.tsx
    UsuariosPage.tsx
  components/
    common/
      Button.tsx
      Input.tsx
      Select.tsx
      Modal.tsx
      ConfirmDialog.tsx
      DataTable.tsx
      Badge.tsx
      Loading.tsx
      ErrorMessage.tsx
    ordenes/
      OrdenEstadoBadge.tsx
      OrdenForm.tsx
      OrdenDetalleTable.tsx
      ProductoOrdenRow.tsx
      AgregarProductoOrdenModal.tsx
      CambiarEstadoOrdenActions.tsx
      RecepcionDetalleTable.tsx
      PrecioSugeridoTable.tsx
    productos/
      ProductoForm.tsx
      ProductoSearch.tsx
    proveedores/
      ProveedorForm.tsx
  types/
    auth.ts
    usuario.ts
    producto.ts
    proveedor.ts
    orden.ts
    reportes.ts
  utils/
    formatCurrency.ts
    formatDate.ts
    calcularMargen.ts
    constants.ts
```

## 8. Modelos TypeScript sugeridos

```ts
export type Rol = 'ADMIN' | 'CREADOR_OC' | 'COMPRADOR';

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
  activo: boolean;
}

export interface Producto {
  id: number;
  codigoBarras?: string;
  nombre: string;
  categoriaId?: number | null;
  categoriaNombre?: string | null;
  margenRecomendado?: number | null;
  activo: boolean;
}

export interface Proveedor {
  id: number;
  nombre: string;
  rut?: string;
  telefono?: string;
  direccion?: string;
  formaPagoHabitual?: FormaPago;
  activo: boolean;
}

export type EstadoOrden =
  | 'BORRADOR'
  | 'LISTA_PARA_COMPRAR'
  | 'EN_COMPRA'
  | 'COMPRADA'
  | 'RECIBIDA'
  | 'CERRADA'
  | 'CANCELADA';

export type EstadoProductoOrden =
  | 'PENDIENTE'
  | 'COMPRADO'
  | 'COMPRA_PARCIAL'
  | 'NO_COMPRADO'
  | 'AGREGADO_EN_MERCADO';

export type FormaPago = 'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA' | 'CREDITO' | 'PAGO_POSTERIOR';

export interface OrdenCompra {
  id: number;
  fechaCreacion: string;
  fechaCompraPlanificada: string;
  fechaCompraReal?: string | null;
  creadorId: number;
  creadorNombre?: string;
  compradorAsignadoId?: number | null;
  compradorAsignadoNombre?: string | null;
  proveedorId?: number | null;
  proveedorNombre?: string | null;
  lugarCompra?: string;
  tipoCompra: 'MERCADO' | 'PROVEEDOR_LOCAL';
  estado: EstadoOrden;
  observaciones?: string;
  totalEstimado?: number;
  totalReal?: number;
  detalles: DetalleOrdenCompra[];
}

export interface DetalleOrdenCompra {
  id: number;
  ordenCompraId: number;
  productoId?: number | null;
  nombreProductoLibre?: string | null;
  codigoBarras?: string | null;
  formato: string;
  cantidadSolicitada: number;
  cantidadComprada?: number | null;
  cantidadInterna?: number | null;
  unidadInterna?: string | null;
  costoTotal?: number | null;
  costoUnitario?: number | null;
  tieneFactura?: boolean | null;
  tipoPago?: FormaPago | null;
  estadoProducto: EstadoProductoOrden;
  comentario?: string | null;
  precioSugerido?: number | null;
  margenUsado?: number | null;
}
```

## 9. Contrato de endpoints que debe consumir

### Auth

```txt
POST /api/auth/login
GET  /api/auth/me
```

### Productos

```txt
GET    /api/productos
GET    /api/productos/{id}
POST   /api/productos
PUT    /api/productos/{id}
DELETE /api/productos/{id}
GET    /api/productos/buscar?query=
```

### Proveedores

```txt
GET    /api/proveedores
GET    /api/proveedores/{id}
POST   /api/proveedores
PUT    /api/proveedores/{id}
DELETE /api/proveedores/{id}
```

### Ordenes

```txt
GET    /api/ordenes
GET    /api/ordenes/{id}
GET    /api/ordenes/activa
POST   /api/ordenes
PUT    /api/ordenes/{id}
DELETE /api/ordenes/{id}
POST   /api/ordenes/{id}/marcar-lista
POST   /api/ordenes/{id}/iniciar-compra
POST   /api/ordenes/{id}/finalizar-compra
POST   /api/ordenes/{id}/recepcionar
POST   /api/ordenes/{id}/cerrar
POST   /api/ordenes/{id}/cancelar
```

### Detalles de orden

```txt
GET    /api/ordenes/{ordenId}/detalles
POST   /api/ordenes/{ordenId}/detalles
PUT    /api/ordenes/{ordenId}/detalles/{detalleId}
DELETE /api/ordenes/{ordenId}/detalles/{detalleId}
POST   /api/ordenes/{ordenId}/detalles/agregar-en-mercado
```

### Recepcion

```txt
GET  /api/ordenes/{id}/recepcion
PUT  /api/ordenes/{id}/recepcion/detalles/{detalleId}
POST /api/ordenes/{id}/recepcion/finalizar
```

### Precios

```txt
POST /api/precios/calcular
POST /api/ordenes/{id}/calcular-precios
PUT  /api/ordenes/{id}/detalles/{detalleId}/precio-sugerido
```

### Pendientes

```txt
GET    /api/pendientes
POST   /api/pendientes
PUT    /api/pendientes/{id}
DELETE /api/pendientes/{id}
POST   /api/pendientes/{id}/agregar-a-orden/{ordenId}
```

### Compras externas

```txt
GET    /api/compras-externas
GET    /api/compras-externas/{id}
POST   /api/compras-externas
PUT    /api/compras-externas/{id}
DELETE /api/compras-externas/{id}
POST   /api/compras-externas/{id}/cerrar
```

### Reportes

```txt
GET /api/reportes/gasto-diario?fecha=
GET /api/reportes/compras-dia?fecha=
GET /api/reportes/compras-factura?desde=&hasta=
GET /api/reportes/productos-no-comprados?desde=&hasta=
GET /api/reportes/cantidad-comprada-producto?productoId=&desde=&hasta=
GET /api/reportes/pagos-pendientes
```

### Exportacion

```txt
GET /api/ordenes/{id}/exportar-excel
```

## 10. Pantallas detalladas

### LoginPage

Objetivo: autenticar usuario.

Campos:

- email;
- password.

Comportamiento:

- llamar POST /api/auth/login;
- guardar token JWT;
- llamar GET /api/auth/me o usar usuario retornado por login;
- redirigir segun rol.

### DashboardPage

Para admin:

- orden activa;
- compras del dia;
- pagos pendientes;
- accesos a crear orden, recepcion, reportes, productos y proveedores.

Para creador:

- boton crear orden;
- pendientes del dia;
- orden borrador o lista para comprar.

### PendientesPage

Permite registrar solicitudes durante el dia para no olvidarlas al cierre.

Campos:

- producto existente o nombre libre;
- cantidad sugerida;
- formato;
- comentario.

Acciones:

- crear pendiente;
- editar;
- descartar;
- agregar a orden.

### NuevaOrdenPage

Cabecera:

- fecha planificada de compra;
- comprador asignado;
- proveedor/lugar;
- tipo de compra;
- observaciones.

Detalle:

- producto;
- formato;
- cantidad solicitada;
- comentario opcional.

Acciones:

- guardar borrador;
- marcar lista para comprar.

### DetalleOrdenPage

Muestra:

- cabecera;
- estado;
- productos;
- totales;
- historial minimo si admin.

Acciones segun estado:

- editar si BORRADOR o LISTA_PARA_COMPRAR;
- marcar lista para comprar;
- cancelar;
- exportar Excel;
- ir a recepcion si COMPRADA;
- ver precios si RECIBIDA o CERRADA.

### RecepcionOrdenPage

Objetivo: revisar datos registrados por comprador y corregir si hace falta.

Campos editables por linea:

- cantidad comprada;
- costo total;
- cantidad interna;
- unidad interna;
- factura si/no;
- tipo de pago;
- comentario.

Acciones:

- guardar cambios;
- calcular precios sugeridos;
- marcar recibida;
- cerrar orden.

### PreciosSugeridosPage

Tabla con:

- producto;
- formato;
- cantidad comprada;
- cantidad interna;
- costo total;
- costo unitario;
- factura si/no;
- costo considerado;
- margen usado;
- precio sugerido;
- precio ajustable;
- margen resultante.

Reglas visuales:

- mostrar margen resultante en tiempo real al editar precio ajustado;
- resaltar productos sin cantidad interna o sin costo.

### ProductosPage

CRUD simple.

Campos:

- codigo de barras;
- nombre;
- categoria;
- margen recomendado;
- activo.

Debe tener buscador.

### ProveedoresPage

CRUD simple.

Campos:

- nombre;
- RUT;
- telefono;
- direccion;
- forma de pago habitual;
- activo.

### ComprasExternasPage

Permite registrar compras que llegan al local sin orden planificada.

Campos cabecera:

- proveedor;
- fecha;
- forma de pago;
- estado de pago;
- observaciones.

Detalle:

- producto;
- formato;
- cantidad;
- cantidad interna;
- costo;
- factura;
- comentario.

### ReportesPage

Solo admin.

Mostrar tablas simples:

- gasto diario;
- compras del dia;
- compras con factura;
- compras sin factura;
- pagos pendientes;
- productos no comprados;
- cantidad comprada por producto.

Filtros:

- fecha;
- producto;
- categoria;
- proveedor;
- tipo de compra;
- con/sin factura;
- forma de pago;
- comprador.

### HistorialPage

Solo admin.

MVP minimo:

- orden creada;
- orden cerrada.

Columnas:

- fecha;
- usuario;
- accion;
- descripcion;
- orden.

## 11. Reglas de interfaz y usabilidad

- No saturar las pantallas.
- Usar botones claros: Guardar, Cancelar, Agregar producto, Marcar lista, Cerrar orden.
- Confirmar acciones delicadas: cancelar orden, cerrar orden, eliminar producto, editar orden cerrada.
- Mostrar badges de estado con texto claro.
- Mostrar errores del backend en lenguaje simple.
- Evitar que usuarios no admin vean opciones sin permiso.
- En tablas, usar filtros y buscador simples.
- En pantallas de orden, siempre mostrar el estado actual de forma visible.

## 12. Reglas de calculo usadas en frontend

El backend debe ser la fuente principal de calculo, pero el frontend puede calcular vistas preliminares.

### Margen

```txt
margen = ((precioVenta - costoConsiderado) / precioVenta) * 100
```

### Precio sugerido

```txt
precioSugerido = costoConsiderado / (1 - margen)
```

### Costo considerado

Con factura:

```txt
costoConsiderado = costoRegistrado
```

Sin factura:

```txt
costoConsiderado = costoRegistrado * 1.19
```

### Costo unitario por cantidad interna

```txt
costoUnitario = costoTotal / cantidadInterna
```

### Redondeo

Regla inicial:

```txt
redondear hacia abajo a la decena mas cercana
```

Ejemplo:

```txt
1875 -> 1870
1879 -> 1870
1869 -> 1860
```

## 13. Manejo de errores

El frontend debe manejar:

- token expirado;
- error 401: cerrar sesion y redirigir a login;
- error 403: mostrar mensaje de acceso no permitido;
- error 404: recurso no encontrado;
- error 500: error del servidor;
- error de red: no se pudo conectar con el servidor.

Mensajes simples para usuario:

- No tienes permiso para realizar esta accion.
- No se pudo guardar la informacion.
- Revisa los campos obligatorios.
- No se pudo conectar con el servidor.

## 14. Orden de implementacion recomendado para Claude

### Paso 1

Crear proyecto React con Vite, rutas, layout, login y cliente HTTP.

### Paso 2

Implementar autenticacion JWT, AuthContext, ProtectedRoute y RoleRoute.

### Paso 3

Implementar CRUD de productos y proveedores.

### Paso 4

Implementar pendientes de compra.

### Paso 5

Implementar ordenes: listado, crear orden, detalle y editar orden.

### Paso 6

Implementar cambio de estados de orden.

### Paso 7

Implementar recepcion de orden.

### Paso 8

Implementar precios sugeridos.

### Paso 9

Implementar compras externas.

### Paso 10

Implementar reportes basicos.

### Paso 11

Implementar historial basico.

### Paso 12

Pulir validaciones, mensajes, permisos y estilos.

## 15. Prompt final sugerido para Claude

Usa esta especificacion para crear la aplicacion web React del MVP. No construyas backend. Consume los endpoints REST definidos. Si el backend no existe, crea servicios API separados con mocks temporales faciles de reemplazar. Implementa una estructura limpia, mantenible y modular. Prioriza el flujo de ordenes de compra, recepcion y precios sugeridos. No implementes funcionalidades fuera del MVP.

Primero genera la estructura del proyecto, rutas, tipos, servicios API y layout. Luego implementa pantalla por pantalla siguiendo el orden de desarrollo. Usa componentes reutilizables para tablas, formularios, botones, badges de estado y modales de confirmacion.