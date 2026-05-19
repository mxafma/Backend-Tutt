export interface Producto {
  id?: number;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  categoria?: { id: number; nombre?: string };
  proveedor?: { id: number; nombre?: string };
}

export interface OrdenCompra {
  id?: number;
  fechaHora?: string;
  total: number;
  detalles?: DetalleOrden[];
}

export interface DetalleOrden {
  id?: number;
  cantidad: number;
  precioUnitario: number;
  subtotal?: number;
  producto: { id: number; nombre?: string };
}
