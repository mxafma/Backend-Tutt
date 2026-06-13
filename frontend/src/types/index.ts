export type Rol = 'ADMIN' | 'CREADOR_OC' | 'COMPRADOR' | 'RECEPCION';

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
  descripcion?: string;
  formatoHabitual?: string;
  margenRecomendado?: number;
  categoria?: Categoria;
  activo?: boolean;
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

export type TipoCompra = 'MERCADO' | 'PROVEEDOR_LOCAL' | 'INSUMO' | 'GASTO_OPERATIVO';

export type EstadoPago = 'PAGADO' | 'PENDIENTE' | 'PARCIALMENTE_PAGADO';

export interface DetalleOrden {
  id?: number;
  producto: Producto;
  nombreProductoSnapshot?: string;
  formato?: string;
  cantidadSolicitada: number;
  cantidadComprada?: number;
  costoTotal?: number;
  factura?: boolean;
  comentario?: string;
  estadoProducto?: EstadoProductoOrden;
  tipoPago?: FormaPago;
  cantidadInterna?: number;
  costoUnitarioCalculado?: number;
  precioSugerido?: number;
  margenSugerido?: number;
  precioFinalEditado?: number;
  margenResultante?: number;
  agregadoEnMercado?: boolean;
}

export interface OrdenCompra {
  id?: number;
  fechaCreacion?: string;
  fechaActualizacion?: string;
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
  tipoCompra: TipoCompra;
  estado: EstadoOrden;
  observaciones?: string;
  total?: number;
  detalles: DetalleOrden[];
}
