import axios from 'axios';
import { Producto, Proveedor, OrdenCompra } from '../types';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = 'Bearer ' + token;
  }
  return config;
});

// ========= MOCK DEL BACKEND (TEMPORAL) =========
// Simula el backend mientras no esté conectado.

let mockProductos: Producto[] = [
  { id: 1, nombre: 'Manzanas Red', descripcion: '', precio: 1500, stock: 100, formatoHabitual: 'Caja' },
  { id: 2, nombre: 'Tomate Primera', descripcion: '', precio: 1000, stock: 50, formatoHabitual: 'Caja' },
  { id: 3, nombre: 'Palta Hass', descripcion: '', precio: 3500, stock: 20, formatoHabitual: 'Malla' },
  { id: 4, nombre: 'Pimentón Rojo', descripcion: '', precio: 2000, stock: 30, formatoHabitual: 'Caja' },
  { id: 5, nombre: 'Lechuga Costina', descripcion: '', precio: 800, stock: 40, formatoHabitual: 'Unidad' },
  { id: 6, nombre: 'Papa Rosada', descripcion: '', precio: 600, stock: 200, formatoHabitual: 'Saco' },
  { id: 7, nombre: 'Zanahoria', descripcion: '', precio: 500, stock: 80, formatoHabitual: 'Malla' },
];

let mockProveedores: Proveedor[] = [
  { id: 1, nombre: 'Proveedor Local A', activo: true },
  { id: 2, nombre: 'Mercado Lo Valledor', activo: true },
  { id: 3, nombre: 'Distribuidora Frutas del Sur', activo: true },
];

let mockOrdenes: OrdenCompra[] = [];
let nextId = 100;

const originalGet = api.get;
const originalPost = api.post;

api.get = async (url: string, config?: any) => {
  console.log('[MOCK API] GET ->', url);

  if (url === '/productos') return { data: mockProductos } as any;
  if (url === '/proveedores') return { data: mockProveedores } as any;
  if (url === '/ordenes') return { data: mockOrdenes } as any;

  const ordenMatch = url.match(/^\/ordenes\/(\d+)$/);
  if (ordenMatch) {
    const id = Number(ordenMatch[1]);
    const orden = mockOrdenes.find(o => o.id === id);
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

  if (url === '/productos') {
    const nuevo: Producto = { id: nextId++, precio: 0, stock: 0, descripcion: '', ...data };
    mockProductos.push(nuevo);
    return { data: nuevo, status: 201 } as any;
  }

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
        estadoProducto: 'PENDIENTE',
        nombreProductoSnapshot: d.producto?.nombre || d.nombreProductoSnapshot,
      })),
    };
    mockOrdenes.push(nuevaOrden);
    return { data: nuevaOrden, status: 201 } as any;
  }

  // Agregar producto encontrado en el mercado
  const agregarProductoMatch = url.match(/^\/compras\/ordenes\/(\d+)\/agregar-producto$/);
  if (agregarProductoMatch) {
    const id = Number(agregarProductoMatch[1]);
    const orden = mockOrdenes.find(o => o.id === id);
    if (orden) {
      const nuevoDetalle = {
        id: nextId++,
        agregadoEnMercado: true,
        estadoProducto: 'AGREGADO_EN_MERCADO',
        ...data,
        nombreProductoSnapshot: data.nombreProductoSnapshot || data.producto?.nombre,
      };
      orden.detalles = [...orden.detalles, nuevoDetalle];
      return { data: nuevoDetalle, status: 201 } as any;
    }
  }

  try {
    return await originalPost.call(api, url, data, config);
  } catch {
    return { data: { success: true } } as any;
  }
};

// @ts-ignore — axios instance methods son sobreescribibles
api.patch = async (url: string, data?: any, _config?: any) => {
  console.log('[MOCK API] PATCH ->', url, data);

  // Cambiar estado de una orden
  const estadoMatch = url.match(/^\/ordenes\/(\d+)\/estado$/);
  if (estadoMatch) {
    const id = Number(estadoMatch[1]);
    const orden = mockOrdenes.find(o => o.id === id);
    if (orden && data?.estado) {
      orden.estado = data.estado;
      if (data.estado === 'COMPRADA') {
        orden.fechaCompraReal = new Date().toISOString();
      }
    }
    return { data: orden, status: 200 } as any;
  }

  // Iniciar modo compra (LISTA_PARA_COMPRAR → EN_COMPRA)
  const iniciarMatch = url.match(/^\/compras\/ordenes\/(\d+)\/iniciar$/);
  if (iniciarMatch) {
    const id = Number(iniciarMatch[1]);
    const orden = mockOrdenes.find(o => o.id === id);
    if (orden) {
      orden.estado = 'EN_COMPRA';
      // Asegura que cada detalle tenga ID
      orden.detalles = orden.detalles.map(d => ({
        ...d,
        id: d.id ?? nextId++,
      }));
    }
    return { data: orden, status: 200 } as any;
  }

  // Actualizar datos de un detalle durante la compra
  const detalleMatch = url.match(/^\/compras\/detalles\/(\d+)$/);
  if (detalleMatch) {
    const detalleId = Number(detalleMatch[1]);
    for (const orden of mockOrdenes) {
      const detalle = orden.detalles.find(d => d.id === detalleId);
      if (detalle) {
        Object.assign(detalle, data);
        return { data: detalle, status: 200 } as any;
      }
    }
  }

  // Finalizar compra (EN_COMPRA → COMPRADA)
  const finalizarMatch = url.match(/^\/compras\/ordenes\/(\d+)\/finalizar$/);
  if (finalizarMatch) {
    const id = Number(finalizarMatch[1]);
    const orden = mockOrdenes.find(o => o.id === id);
    if (orden) {
      orden.estado = 'COMPRADA';
      orden.fechaCompraReal = new Date().toISOString();
    }
    return { data: orden, status: 200 } as any;
  }

  // Actualizar detalle en recepción (corregir cantidades, costos y guardar precios)
  const recepcionDetalleMatch = url.match(/^\/recepcion\/detalles\/(\d+)$/);
  if (recepcionDetalleMatch) {
    const detalleId = Number(recepcionDetalleMatch[1]);
    for (const orden of mockOrdenes) {
      const detalle = orden.detalles.find(d => d.id === detalleId);
      if (detalle) {
        Object.assign(detalle, data);
        return { data: detalle, status: 200 } as any;
      }
    }
  }

  // Cerrar recepción (COMPRADA → RECIBIDA)
  const cerrarRecepcionMatch = url.match(/^\/recepcion\/ordenes\/(\d+)\/cerrar$/);
  if (cerrarRecepcionMatch) {
    const id = Number(cerrarRecepcionMatch[1]);
    const orden = mockOrdenes.find(o => o.id === id);
    if (orden) orden.estado = 'RECIBIDA';
    return { data: orden, status: 200 } as any;
  }

  return { data: { success: true }, status: 200 } as any;
};

// @ts-ignore
api.put = async (url: string, data?: any, _config?: any) => {
  console.log('[MOCK API] PUT ->', url, data);
  return { data: { success: true }, status: 200 } as any;
};

export default api;
