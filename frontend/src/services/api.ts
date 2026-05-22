import axios from 'axios';
import { Producto, Proveedor, OrdenCompra } from '../types';

const api = axios.create({
  baseURL: 'http://localhost:8080/api', // Conexión con Spring Boot
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = 'Bearer ' + token;
  }
  return config;
});

// ========= MOCK DEL BACKEND (TEMPORAL) =========
// Esto permite crear productos, ver proveedores y testear el flujo de órdenes 
// mientras el backend no está conectado o en desarrollo.

let mockProductos: Producto[] = [
  { id: 1, nombre: 'Manzanas Red (1kg)', descripcion: '', precio: 1500, stock: 100 },
  { id: 2, nombre: 'Tomate Primera (1kg)', descripcion: '', precio: 1000, stock: 50 },
  { id: 3, nombre: 'Palta Hass (1kg)', descripcion: '', precio: 3500, stock: 20 }
];

let mockProveedores: Proveedor[] = [
  { id: 1, nombre: 'Proveedor Local A' },
  { id: 2, nombre: 'Mercado Mayorista' }
];

let mockOrdenes: OrdenCompra[] = [];
let nextId = 10;

// Reemplazar métodos para interceptar las llamadas al backend sin crashear
const originalGet = api.get;
const originalPost = api.post;

api.get = async (url: string, config?: any) => {
  console.log('[MOCK API] GET ->', url);
  if (url === '/productos') return { data: mockProductos } as any;
  if (url === '/proveedores') return { data: mockProveedores } as any;
  if (url === '/ordenes') return { data: mockOrdenes } as any;

  try {
    return await originalGet.call(api, url, config);
  } catch (e) {
    return { data: [] } as any;
  }
};

api.post = async (url: string, data?: any, config?: any) => {
  console.log('[MOCK API] POST ->', url, data);
  if (url === '/productos') {
    const nuevo = { id: nextId++, precio: 0, stock: 0, descripcion: '', ...data };
    mockProductos.push(nuevo);
    return { data: nuevo, status: 201 } as any;
  }
  if (url === '/ordenes') {
    const nuevaOrden = { id: nextId++, ...data, estado: data.estado || 'BORRADOR' };
    mockOrdenes.push(nuevaOrden);
    return { data: nuevaOrden, status: 201 } as any;
  }

  try {
    return await originalPost.call(api, url, data, config);
  } catch (e) {
    return { data: { success: true } } as any;
  }
};

export default api;
