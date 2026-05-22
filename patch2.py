import re, base64

content = '''import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Producto, DetalleOrden, OrdenCompra, Proveedor } from '../types';
import { PlusCircle, Trash2, Save } from 'lucide-react';

export default function CrearOrden() {
  const navigate = useNavigate();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);

  const [orden, setOrden] = useState<Partial<OrdenCompra>>({
    fechaCompraPlanificada: new Date().toISOString().split('T')[0],
    tipoCompra: 'PROVEEDOR_LOCAL',
    estado: 'BORRADOR',
    detalles: [],
    total: 0,
    proveedorId: undefined,
    observaciones: '',
    encargadoCompra: ''
  });

  const [mostrarNuevoProducto, setMostrarNuevoProducto] = useState(false);
  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: '',
    categoria: 'General'
  });

  const [detalleActual, setDetalleActual] = useState<Partial<DetalleOrden> & { productoId?: number }>({
    productoId: undefined,
    cantidad: 1,
    precioUnitario: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resProductos, resProveedores] = await Promise.all([
          api.get('/productos'),
          api.get('/proveedores')
        ]);
        setProductos(resProductos.data);
        setProveedores(resProveedores.data);
      } catch (error) {
        console.error("Error fetching initial data:", error);
        alert('No se pudieron cargar los productos o proveedores.');
      }
    };
    fetchData();
  }, []);

  const handleOrdenChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setOrden(prev => ({ ...prev, [name]: name === 'proveedorId' ? (value ? Number(value) : undefined) : value }));
  };

  const handleDetalleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const isNumber = ['cantidad', 'precioUnitario', 'productoId'].includes(name);
    const parsedValue = isNumber ? Number(value) : value;

    setDetalleActual(prev => ({ ...prev, [name]: parsedValue }));

    if (name === 'productoId') {
      const selectedProduct = productos.find(p => p.id === parsedValue);
      if (selectedProduct) {
        setDetalleActual(prev => ({
          ...prev,
          precioUnitario: selectedProduct.precio,
        }));
      }
    }
  };

  const agregarDetalle = () => {
    if (!detalleActual.productoId || detalleActual.cantidad <= 0) {
      alert('Selecciona un producto y una cantidad válida.');
      return;
    }

    const producto = productos.find(p => p.id === detalleActual.productoId);
    if (!producto) {
      alert('Producto no encontrado.');
      return;
    }

    const nuevoDetalle: DetalleOrden = {
      producto: producto,
      cantidad: detalleActual.cantidad,
      precioUnitario: detalleActual.precioUnitario,
      subtotal: detalleActual.cantidad * detalleActual.precioUnitario,
    };

    const nuevosDetalles = [...(orden.detalles || []), nuevoDetalle];
    const nuevoTotal = nuevosDetalles.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    setOrden(prev => ({
      ...prev,
      detalles: nuevosDetalles,
      total: nuevoTotal,
    }));

    setDetalleActual({ productoId: undefined, cantidad: 1, precioUnitario: 0 });
  };

  const eliminarDetalle = (index: number) => {
    const nuevosDetalles = [...(orden.detalles || [])];
    nuevosDetalles.splice(index, 1);
    const nuevoTotal = nuevosDetalles.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    setOrden(prev => ({
      ...prev,
      detalles: nuevosDetalles,
      total: nuevoTotal,
    }));
  };

  const crearProductoRapido = async () => {
    if (!nuevoProducto.nombre.trim()) {
      alert('Debes ingresar un nombre para el producto nuevo.');
      return;
    }
    try {
      const res = await api.post('/productos', {
        nombre: nuevoProducto.nombre,
        categoria: nuevoProducto.categoria,
        precioSugerido: 0,
        descripcion: ''
      });
      const prodCreado = res.data;
      setProductos([...productos, prodCreado]);
      setDetalleActual({ ...detalleActual, productoId: prodCreado.id, precioUnitario: 0 });
      setMostrarNuevoProducto(false);
      setNuevoProducto({ nombre: '', categoria: 'General' });
      alert('Producto creado y agregado con éxito.');
    } catch (error) {
      console.error('Error al crear producto rápido:', error);
      alert('Error al crear producto.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orden.detalles || orden.detalles.length === 0) {
      alert('Debes agregar al menos un producto a la orden.');
      return;
    }
    if (!orden.proveedorId) {
      alert('Debes seleccionar un proveedor.');
      return;
    }

    const ordenParaEnviar: Omit<OrdenCompra, "id"> = {
      ...orden,
      fechaCompraPlanificada: orden.fechaCompraPlanificada!,
      tipoCompra: orden.tipoCompra!,
      estado: orden.estado!,
      proveedorId: orden.proveedorId!,
      detalles: orden.detalles.map(d => ({
        ...d,
        producto: { id: d.producto.id } as Producto,
      })),
      total: orden.total!,
    };

    try {
      await api.post('/ordenes', ordenParaEnviar);
      alert('Orden de compra creada con éxito.');
      navigate('/ordenes');
    } catch (error) {
      console.error('Error al crear la orden:', error);
      alert('Hubo un error al guardar la orden de compra.');
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Crear Nueva Orden de Compra</h1>
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Cabecera de la Orden */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Información General</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label htmlFor="fechaCompraPlanificada" className="block text-sm font-medium text-gray-600 mb-1">Fecha Planificada</label>
              <input
                type="date"
                id="fechaCompraPlanificada"
                name="fechaCompraPlanificada"
                value={orden.fechaCompraPlanificada}
                onChange={handleOrdenChange}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="proveedorId" className="block text-sm font-medium text-gray-600 mb-1">Proveedor</label>
              <select
                id="proveedorId"
                name="proveedorId"
                value={orden.proveedorId || ''}
                onChange={handleOrdenChange}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Seleccione un proveedor</option>
                {proveedores.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="tipoCompra" className="block text-sm font-medium text-gray-600 mb-1">Tipo de Compra</label>
              <select
                id="tipoCompra"
                name="tipoCompra"
                value={orden.tipoCompra}
                onChange={handleOrdenChange}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="PROVEEDOR_LOCAL">Proveedor Local</option>
                <option value="MERCADO">Mercado</option>
              </select>
            </div>
            <div>
              <label htmlFor="encargadoCompra" className="block text-sm font-medium text-gray-600 mb-1">Encargado de Compra</label>
              <input
                type="text"
                id="encargadoCompra"
                name="encargadoCompra"
                placeholder="Nombre o ID del encargado"
                value={orden.encargadoCompra || ''}
                onChange={handleOrdenChange}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <label htmlFor="observaciones" className="block text-sm font-medium text-gray-600 mb-1">Observaciones</label>
              <textarea
                id="observaciones"
                name="observaciones"
                value={orden.observaciones}
                onChange={handleOrdenChange}
                rows={3}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Detalles de la Orden */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Productos de la Orden</h2>
          
          {/* Formulario para agregar producto */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end mb-6 p-4 bg-gray-50 rounded-lg border">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-600 mb-1">Producto</label>
              <select
                name="productoId"
                value={detalleActual.productoId || ''}
                onChange={handleDetalleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Seleccionar producto</option>
                {productos.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Cantidad</label>
              <input
                type="number"
                name="cantidad"
                value={detalleActual.cantidad}
                onChange={handleDetalleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Precio Unit.</label>
              <input
                type="number"
                name="precioUnitario"
                value={detalleActual.precioUnitario}
                onChange={handleDetalleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                step="0.01"
              />
            </div>
            <button
              type="button"
              onClick={agregarDetalle}
              className="flex items-center justify-center gap-2 bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 h-10"
            >
              <PlusCircle size={20} /> Agregar
            </button>
          </div>

          <div className="mb-6">
            <button
              type="button"
              onClick={() => setMostrarNuevoProducto(!mostrarNuevoProducto)}
              className="text-blue-500 hover:text-blue-700 text-sm font-semibold"
            >
              {mostrarNuevoProducto ? 'Cancelar creación rápida' : '+ Crear producto nuevo rápidamente'}
            </button>
            {mostrarNuevoProducto && (
              <div className="mt-4 p-4 bg-blue-50 rounded-md border border-blue-200">
                <div className="flex flex-wrap gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-600 mb-1">Nombre (p.ej. con formato)</label>
                    <input
                      type="text"
                      className="w-full p-2 border border-gray-300 rounded-md"
                      value={nuevoProducto.nombre}
                      onChange={e => setNuevoProducto({...nuevoProducto, nombre: e.target.value})}
                      placeholder="Ej: Manzanas (1kg)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Categoría</label>
                    <input
                      type="text"
                      className="w-full p-2 border border-gray-300 rounded-md"
                      value={nuevoProducto.categoria}
                      onChange={e => setNuevoProducto({...nuevoProducto, categoria: e.target.value})}
                      placeholder="General"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={crearProductoRapido}
                    className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 h-10"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Tabla de productos agregados */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 border-b font-semibold text-gray-600">Producto</th>
                  <th className="p-3 border-b font-semibold text-gray-600">Cantidad</th>
                  <th className="p-3 border-b font-semibold text-gray-600">Precio Unit.</th>
                  <th className="p-3 border-b font-semibold text-gray-600">Subtotal</th>
                  <th className="p-3 border-b font-semibold text-gray-600">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {orden.detalles && orden.detalles.length > 0 ? (
                  orden.detalles.map((detalle, index) => (
                    <tr key={index} className="hover:bg-gray-50 border-b">
                      <td className="p-3">{detalle.producto.nombre}</td>
                      <td className="p-3">{detalle.cantidad}</td>
                      <td className="p-3">\</td>
                      <td className="p-3">\</td>
                      <td className="p-3">
                        <button
                          type="button"
                          onClick={() => eliminarDetalle(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={20} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-gray-500">
                      Aún no has agregado productos a la orden.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-gray-100">
                <tr>
                  <td colSpan={3} className="p-3 text-right font-bold text-gray-700">Total de la Orden:</td>
                  <td colSpan={2} className="p-3 font-bold text-xl text-gray-800">
                    \
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Botón de Guardar */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-green-700 transition-colors"
          >
            <Save size={20} /> Guardar Orden de Compra
          </button>
        </div>
      </form>
    </div>
  );
}
'''

with open('frontend/src/pages/CrearOrden.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
