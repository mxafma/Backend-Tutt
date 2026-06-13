import axios from 'axios';
import { Producto, Proveedor, OrdenCompra } from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = 'Bearer ' + token;
  }
  return config;
});

// Interceptor de respuesta para errores globales (activo cuando se conecte el backend real)
api.interceptors.response.use(
  res => res,
  err => {
    if (err?.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ========= MOCK DEL BACKEND (TEMPORAL) =========

interface MockUsuario {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  activo: boolean;
  password: string;
}

// Persistencia en localStorage para que los datos sobrevivan recargas de página
function loadMock<T>(key: string, defaults: T): T {
  try {
    const raw = localStorage.getItem(`mock_${key}`);
    return raw ? JSON.parse(raw) : defaults;
  } catch {
    return defaults;
  }
}

function saveMock(key: string, value: unknown) {
  try {
    localStorage.setItem(`mock_${key}`, JSON.stringify(value));
  } catch { /* cuota excedida — ignorar */ }
}

const USUARIOS_DEFAULT: MockUsuario[] = [
  { id: 1, nombre: 'Administrador', email: 'admin', rol: 'ADMIN', activo: true, password: 'admin' },
  { id: 2, nombre: 'Comprador', email: 'comprador', rol: 'COMPRADOR', activo: true, password: 'comprador' },
  { id: 3, nombre: 'Encargado Cierre', email: 'cierre', rol: 'CREADOR_OC', activo: true, password: 'cierre' },
  { id: 4, nombre: 'Recepción', email: 'recepcion', rol: 'RECEPCION', activo: true, password: 'recepcion' },
];

const PRODUCTOS_DEFAULT: Producto[] = [
  { id: 1, nombre: 'Manzanas Red', descripcion: '', formatoHabitual: 'Caja', margenRecomendado: 40 },
  { id: 2, nombre: 'Tomate Primera', descripcion: '', formatoHabitual: 'Caja', margenRecomendado: 40 },
  { id: 3, nombre: 'Palta Hass', descripcion: '', formatoHabitual: 'Malla', margenRecomendado: 45 },
  { id: 4, nombre: 'Pimentón Rojo', descripcion: '', formatoHabitual: 'Caja', margenRecomendado: 40 },
  { id: 5, nombre: 'Lechuga Costina', descripcion: '', formatoHabitual: 'Unidad', margenRecomendado: 50 },
  { id: 6, nombre: 'Papa Rosada', descripcion: '', formatoHabitual: 'Saco', margenRecomendado: 35 },
  { id: 7, nombre: 'Zanahoria', descripcion: '', formatoHabitual: 'Malla', margenRecomendado: 40 },
];

const PROVEEDORES_DEFAULT: Proveedor[] = [
  { id: 1, nombre: 'Proveedor Local A', activo: true },
  { id: 2, nombre: 'Mercado Lo Valledor', activo: true },
  { id: 3, nombre: 'Distribuidora Frutas del Sur', activo: true },
];

let mockUsuarios: MockUsuario[]  = loadMock('usuarios', USUARIOS_DEFAULT);
let mockProductos: Producto[]    = loadMock('productos', PRODUCTOS_DEFAULT);
let mockProveedores: Proveedor[] = loadMock('proveedores', PROVEEDORES_DEFAULT);
let mockOrdenes: OrdenCompra[]   = loadMock('ordenes', []);
let nextId: number               = loadMock('nextId', 100);

const sinPassword = (u: MockUsuario) => {
  const { password, ...datos } = u;
  return datos;
};

const USE_MOCK = !import.meta.env.VITE_API_URL;

if (USE_MOCK) {

const originalGet = api.get;
const originalPost = api.post;

api.get = async (url: string, config?: any) => {
  console.log('[MOCK API] GET ->', url);

  // Auth
  if (url === '/auth/me') {
    const token = localStorage.getItem('token');
    if (token?.startsWith('mock-token-')) {
      const userId = Number(token.replace('mock-token-', ''));
      const user = mockUsuarios.find(u => u.id === userId && u.activo);
      if (user) return { data: sinPassword(user), status: 200 } as any;
    }
    const err: any = new Error('No autenticado');
    err.response = { status: 401 };
    throw err;
  }

  // Usuarios
  if (url === '/usuarios') return { data: mockUsuarios.map(sinPassword), status: 200 } as any;
  const usuarioMatch = url.match(/^\/usuarios\/(\d+)$/);
  if (usuarioMatch) {
    const user = mockUsuarios.find(u => u.id === Number(usuarioMatch[1]));
    return { data: user ? sinPassword(user) : null, status: user ? 200 : 404 } as any;
  }

  // Productos y proveedores
  if (url === '/productos') return { data: mockProductos } as any;
  if (url === '/proveedores') return { data: mockProveedores } as any;

  // Órdenes
  if (url === '/ordenes') return { data: mockOrdenes } as any;
  const ordenMatch = url.match(/^\/ordenes\/(\d+)$/);
  if (ordenMatch) {
    const orden = mockOrdenes.find(o => o.id === Number(ordenMatch[1]));
    return { data: orden ?? null, status: orden ? 200 : 404 } as any;
  }

  try {
    return await originalGet.call(api, url, config);
  } catch {
    return { data: [] } as any;
  }
};

api.post = async (url: string, data?: any, config?: any) => {
  console.log('[MOCK API] POST ->', url, data);

  // Auth login
  if (url === '/auth/login') {
    const { username, password } = data ?? {};
    const user = mockUsuarios.find(
      u => u.email === username && u.password === password && u.activo
    );
    if (user) {
      const token = `mock-token-${user.id}`;
      return { data: { token, user: sinPassword(user) }, status: 200 } as any;
    }
    const err: any = new Error('Credenciales incorrectas');
    err.response = { status: 401, data: { message: 'Usuario o contraseña incorrectos' } };
    throw err;
  }

  // Crear usuario
  if (url === '/usuarios') {
    const nuevo: MockUsuario = { id: nextId++, activo: true, ...data };
    mockUsuarios.push(nuevo);
    saveMock('usuarios', mockUsuarios);
    saveMock('nextId', nextId);
    return { data: sinPassword(nuevo), status: 201 } as any;
  }

  // Crear producto
  if (url === '/productos') {
    const nuevo: Producto = { id: nextId++, ...data };
    mockProductos.push(nuevo);
    saveMock('productos', mockProductos);
    saveMock('nextId', nextId);
    return { data: nuevo, status: 201 } as any;
  }

  // Crear orden
  if (url === '/ordenes') {
    const proveedor = data.proveedorId
      ? mockProveedores.find(p => p.id === data.proveedorId)
      : null;
    const nuevaOrden: OrdenCompra = {
      ...data,
      id: nextId++,
      fechaCreacion: new Date().toISOString(),
      estado: data.estado || 'BORRADOR',
      proveedorNombre: proveedor?.nombre ?? null,
      detalles: (data.detalles || []).map((d: any) => ({
        ...d,
        id: nextId++,
        estadoProducto: d.estadoProducto || 'PENDIENTE',
        nombreProductoSnapshot: d.producto?.nombre || d.nombreProductoSnapshot,
      })),
    };
    mockOrdenes.push(nuevaOrden);
    saveMock('ordenes', mockOrdenes);
    saveMock('nextId', nextId);
    return { data: nuevaOrden, status: 201 } as any;
  }

  // Agregar producto del mercado
  const agregarMatch = url.match(/^\/compras\/ordenes\/(\d+)\/agregar-producto$/);
  if (agregarMatch) {
    const orden = mockOrdenes.find(o => o.id === Number(agregarMatch[1]));
    if (orden) {
      const nuevoDetalle = {
        id: nextId++,
        agregadoEnMercado: true,
        estadoProducto: 'AGREGADO_EN_MERCADO',
        ...data,
        nombreProductoSnapshot: data.nombreProductoSnapshot || data.producto?.nombre,
      };
      orden.detalles = [...orden.detalles, nuevoDetalle];
      saveMock('ordenes', mockOrdenes);
      saveMock('nextId', nextId);
      return { data: nuevoDetalle, status: 201 } as any;
    }
  }

  // Agregar producto olvidado en recepción
  const agregarRecepcionMatch = url.match(/^\/recepcion\/ordenes\/(\d+)\/agregar-producto$/);
  if (agregarRecepcionMatch) {
    const orden = mockOrdenes.find(o => o.id === Number(agregarRecepcionMatch[1]));
    if (orden) {
      const nuevoDetalle = {
        id: nextId++,
        agregadoEnMercado: true,
        estadoProducto: 'AGREGADO_EN_MERCADO',
        ...data,
        nombreProductoSnapshot: data.nombreProductoSnapshot || data.nombre,
      };
      orden.detalles = [...orden.detalles, nuevoDetalle];
      saveMock('ordenes', mockOrdenes);
      saveMock('nextId', nextId);
      return { data: nuevoDetalle, status: 201 } as any;
    }
  }

  try {
    return await originalPost.call(api, url, data, config);
  } catch {
    return { data: { success: true } } as any;
  }
};

// @ts-ignore
api.patch = async (url: string, data?: any, _config?: any) => {
  console.log('[MOCK API] PATCH ->', url, data);

  // Cambiar estado de una orden
  const estadoMatch = url.match(/^\/ordenes\/(\d+)\/estado$/);
  if (estadoMatch) {
    const orden = mockOrdenes.find(o => o.id === Number(estadoMatch[1]));
    if (orden && data?.estado) {
      orden.estado = data.estado;
      if (data.estado === 'COMPRADA') orden.fechaCompraReal = new Date().toISOString();
      saveMock('ordenes', mockOrdenes);
    }
    return { data: orden, status: 200 } as any;
  }

  // Iniciar modo compra
  const iniciarMatch = url.match(/^\/compras\/ordenes\/(\d+)\/iniciar$/);
  if (iniciarMatch) {
    const orden = mockOrdenes.find(o => o.id === Number(iniciarMatch[1]));
    if (orden) {
      orden.estado = 'EN_COMPRA';
      orden.detalles = orden.detalles.map(d => ({ ...d, id: d.id ?? nextId++ }));
      saveMock('ordenes', mockOrdenes);
      saveMock('nextId', nextId);
    }
    return { data: orden, status: 200 } as any;
  }

  // Actualizar detalle durante la compra
  const detalleCompraMatch = url.match(/^\/compras\/detalles\/(\d+)$/);
  if (detalleCompraMatch) {
    const detalleId = Number(detalleCompraMatch[1]);
    for (const orden of mockOrdenes) {
      const detalle = orden.detalles.find(d => d.id === detalleId);
      if (detalle) {
        Object.assign(detalle, data);
        saveMock('ordenes', mockOrdenes);
        return { data: detalle, status: 200 } as any;
      }
    }
  }

  // Finalizar compra
  const finalizarMatch = url.match(/^\/compras\/ordenes\/(\d+)\/finalizar$/);
  if (finalizarMatch) {
    const orden = mockOrdenes.find(o => o.id === Number(finalizarMatch[1]));
    if (orden) {
      orden.estado = 'COMPRADA';
      orden.fechaCompraReal = new Date().toISOString();
      saveMock('ordenes', mockOrdenes);
    }
    return { data: orden, status: 200 } as any;
  }

  // Actualizar detalle en recepción
  const recepcionDetalleMatch = url.match(/^\/recepcion\/detalles\/(\d+)$/);
  if (recepcionDetalleMatch) {
    const detalleId = Number(recepcionDetalleMatch[1]);
    for (const orden of mockOrdenes) {
      const detalle = orden.detalles.find(d => d.id === detalleId);
      if (detalle) {
        Object.assign(detalle, data);
        saveMock('ordenes', mockOrdenes);
        return { data: detalle, status: 200 } as any;
      }
    }
  }

  // Cerrar recepción
  const cerrarRecepcionMatch = url.match(/^\/recepcion\/ordenes\/(\d+)\/cerrar$/);
  if (cerrarRecepcionMatch) {
    const orden = mockOrdenes.find(o => o.id === Number(cerrarRecepcionMatch[1]));
    if (orden) {
      orden.estado = 'RECIBIDA';
      saveMock('ordenes', mockOrdenes);
    }
    return { data: orden, status: 200 } as any;
  }

  // Activar / desactivar usuario
  const usuarioEstadoMatch = url.match(/^\/usuarios\/(\d+)\/(activar|desactivar)$/);
  if (usuarioEstadoMatch) {
    const user = mockUsuarios.find(u => u.id === Number(usuarioEstadoMatch[1]));
    if (user) {
      user.activo = usuarioEstadoMatch[2] === 'activar';
      saveMock('usuarios', mockUsuarios);
      return { data: sinPassword(user), status: 200 } as any;
    }
  }

  return { data: { success: true }, status: 200 } as any;
};

// @ts-ignore
api.put = async (url: string, data?: any, _config?: any) => {
  console.log('[MOCK API] PUT ->', url, data);

  // Editar orden completa
  const ordenMatch = url.match(/^\/ordenes\/(\d+)$/);
  if (ordenMatch) {
    const idx = mockOrdenes.findIndex(o => o.id === Number(ordenMatch[1]));
    if (idx !== -1) {
      const proveedor = data.proveedorId
        ? mockProveedores.find(p => p.id === data.proveedorId)
        : null;
      mockOrdenes[idx] = {
        ...mockOrdenes[idx],
        ...data,
        proveedorNombre: proveedor?.nombre ?? mockOrdenes[idx].proveedorNombre,
        detalles: (data.detalles || []).map((d: any) => ({
          ...d,
          id: d.id ?? nextId++,
          estadoProducto: d.estadoProducto ?? 'PENDIENTE',
          nombreProductoSnapshot: d.producto?.nombre || d.nombreProductoSnapshot,
        })),
      };
      saveMock('ordenes', mockOrdenes);
      saveMock('nextId', nextId);
      return { data: mockOrdenes[idx], status: 200 } as any;
    }
  }

  // Editar producto
  const productoMatch = url.match(/^\/productos\/(\d+)$/);
  if (productoMatch) {
    const idx = mockProductos.findIndex(p => p.id === Number(productoMatch[1]));
    if (idx !== -1) {
      mockProductos[idx] = { ...mockProductos[idx], ...data };
      saveMock('productos', mockProductos);
      return { data: mockProductos[idx], status: 200 } as any;
    }
  }

  // Editar usuario
  const usuarioMatch = url.match(/^\/usuarios\/(\d+)$/);
  if (usuarioMatch) {
    const user = mockUsuarios.find(u => u.id === Number(usuarioMatch[1]));
    if (user) {
      Object.assign(user, data);
      saveMock('usuarios', mockUsuarios);
      return { data: sinPassword(user), status: 200 } as any;
    }
  }

  return { data: { success: true }, status: 200 } as any;
};

} // end USE_MOCK

export default api;
