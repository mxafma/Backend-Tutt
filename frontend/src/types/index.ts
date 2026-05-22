export type Rol = 'ADMIN' | 'CREADOR_OC' | 'COMPRADOR';

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
  activo: boolean;
}

export interface Categoria {
  id?: number;
  nombre: string;
}

export interface Proveedor {
  id?: number;
  nombre: string;
  rut?: string;
  telefono?: string;
  direccion?: string;
  formaPagoHabitual?: FormaPago;
  activo?: boolean;
}

export interface Producto {
  id?: number;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  categoria?: Categoria;
  proveedor?: Proveedor;
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
  id?: number;
  fechaCreacion?: string;
  fechaCompraPlanificada: string;
  fechaCompraReal?: string | null;
  creadorId?: number;
  creadorNombre?: string;
  compradorAsignadoId?: number | null;
  compradorAsignadoNombre?: string | null;
  encargadoCompra?: string;
  proveedorId?: number | null;
  proveedorNombre?: string | null;
  lugarCompra?: string;
  tipoCompra: 'MERCADO' | 'PROVEEDOR_LOCAL';
  estado: EstadoOrden;
  observaciones?: string;
  total: number;
  detalles: DetalleOrden[];
}

export interface DetalleOrden {
  id?: number;
  cantidad: number;
  precioUnitario: number;
  subtotal?: number;
  producto: Producto;
}
