import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { Producto, DetalleOrden, OrdenCompra, Proveedor, TipoCompra, Usuario } from '../types';
import { PlusCircle, Trash2, Save, CheckCircle, ArrowLeft } from 'lucide-react';
import ProductoPicker from '../components/ProductoPicker';

const FORMATOS_SUGERIDOS = ['Caja', 'Malla', 'Saco', 'Bandeja', 'Unidad', 'Kilo', 'Paquete'];

const TIPO_COMPRA_LABELS: Record<TipoCompra, string> = {
  MERCADO: 'Mercado',
  PROVEEDOR_LOCAL: 'Proveedor Local',
  INSUMO: 'Insumo',
  GASTO_OPERATIVO: 'Gasto Operativo',
};

export default function EditarOrden() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [orden, setOrden] = useState<Partial<OrdenCompra> | null>(null);

  const [detalleActual, setDetalleActual] = useState<{
    producto: Producto | undefined;
    formato: string;
    formatoCustom: string;
    cantidadSolicitada: number;
    comentario: string;
  }>({
    producto: undefined,
    formato: 'Caja',
    formatoCustom: '',
    cantidadSolicitada: 1,
    comentario: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resOrden, resProductos, resProveedores, resUsuarios] = await Promise.all([
          api.get(`/ordenes/${id}`),
          api.get('/productos'),
          api.get('/proveedores'),
          api.get('/usuarios'),
        ]);
        const o: OrdenCompra = resOrden.data;
        if (o.estado !== 'BORRADOR' && o.estado !== 'LISTA_PARA_COMPRAR') {
          alert('Solo se pueden editar órdenes en estado Borrador o Lista para Comprar.');
          navigate(`/ordenes/${id}`);
          return;
        }
        setOrden(o);
        setProductos(resProductos.data);
        setProveedores(resProveedores.data);
        setUsuarios((resUsuarios.data as Usuario[]).filter((u: Usuario) => u.activo));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleOrdenChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name === 'compradorAsignadoId') {
      const usuario = usuarios.find(u => u.id === Number(value));
      setOrden(prev =>
        prev
          ? {
              ...prev,
              compradorAsignadoId: value ? Number(value) : null,
              compradorAsignadoNombre: usuario?.nombre ?? null,
              encargadoCompra: usuario?.nombre ?? '',
            }
          : prev
      );
      return;
    }
    setOrden(prev =>
      prev
        ? { ...prev, [name]: name === 'proveedorId' ? (value ? Number(value) : undefined) : value }
        : prev
    );
  };

  const handleDetalleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setDetalleActual(prev => ({
      ...prev,
      [name]: name === 'productoId' || name === 'cantidadSolicitada' ? Number(value) : value,
    }));
  };

  const getFormatoFinal = () =>
    detalleActual.formato === 'Otro' ? detalleActual.formatoCustom.trim() : detalleActual.formato;

  const agregarDetalle = () => {
    if (!detalleActual.producto || detalleActual.cantidadSolicitada <= 0) {
      alert('Selecciona un producto y una cantidad válida.');
      return;
    }
    const formatoFinal = getFormatoFinal();
    if (!formatoFinal) {
      alert('Ingresa un formato válido.');
      return;
    }

    const nuevoDetalle: DetalleOrden = {
      producto: detalleActual.producto,
      nombreProductoSnapshot: detalleActual.producto.nombre,
      formato: formatoFinal,
      cantidadSolicitada: detalleActual.cantidadSolicitada,
      estadoProducto: 'PENDIENTE',
      comentario: detalleActual.comentario.trim() || undefined,
    };

    setOrden(prev =>
      prev ? { ...prev, detalles: [...(prev.detalles || []), nuevoDetalle] } : prev
    );
    setDetalleActual({
      producto: undefined,
      formato: 'Caja',
      formatoCustom: '',
      cantidadSolicitada: 1,
      comentario: '',
    });
  };

  const eliminarDetalle = (index: number) => {
    setOrden(prev =>
      prev ? { ...prev, detalles: (prev.detalles || []).filter((_, i) => i !== index) } : prev
    );
  };

  const guardarOrden = async (estado: 'BORRADOR' | 'LISTA_PARA_COMPRAR') => {
    if (!orden?.detalles || orden.detalles.length === 0) {
      alert('Debes agregar al menos un producto a la orden.');
      return;
    }
    const ordenParaEnviar = {
      ...orden,
      estado,
      detalles: (orden.detalles || []).map(d => ({
        ...d,
        producto: { id: d.producto.id, nombre: d.producto.nombre },
      })),
    };
    try {
      await api.put(`/ordenes/${id}`, ordenParaEnviar);
      navigate(`/ordenes/${id}`);
    } catch (error) {
      console.error('Error al guardar la orden:', error);
      alert('Hubo un error al guardar la orden.');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando orden...</div>;
  if (!orden) return <div className="p-8 text-center text-red-500">Orden no encontrada.</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(`/ordenes/${id}`)}
          className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-3xl font-bold text-gray-800">Editar Orden #{id}</h1>
      </div>

      <div className="space-y-8">
        {/* Información General */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Información General</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Fecha Planificada</label>
              <input
                type="date"
                name="fechaCompraPlanificada"
                value={orden.fechaCompraPlanificada}
                onChange={handleOrdenChange}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Tipo de Compra</label>
              <select
                name="tipoCompra"
                value={orden.tipoCompra}
                onChange={handleOrdenChange}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
              >
                {(Object.entries(TIPO_COMPRA_LABELS) as [TipoCompra, string][]).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Proveedor <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <select
                name="proveedorId"
                value={orden.proveedorId || ''}
                onChange={handleOrdenChange}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
              >
                <option value="">Sin proveedor asignado</option>
                {proveedores.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Lugar de Compra <span className="text-gray-400 font-normal">(si aplica)</span>
              </label>
              <input
                type="text"
                name="lugarCompra"
                value={orden.lugarCompra || ''}
                onChange={handleOrdenChange}
                placeholder="Ej: Mercado Lo Valledor, Galpón 3"
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Encargado de Compra</label>
              <select
                name="compradorAsignadoId"
                value={orden.compradorAsignadoId ?? ''}
                onChange={handleOrdenChange}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
              >
                <option value="">Sin asignar</option>
                {usuarios.map(u => (
                  <option key={u.id} value={u.id}>{u.nombre}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium text-gray-600 mb-1">Observaciones</label>
              <textarea
                name="observaciones"
                value={orden.observaciones || ''}
                onChange={handleOrdenChange}
                rows={2}
                placeholder="Notas generales para esta orden..."
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>
        </div>

        {/* Productos Solicitados */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Productos Solicitados</h2>

          {/* Formulario para agregar producto */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-4">
                <label className="block text-sm font-medium text-gray-600 mb-1">Producto</label>
                <ProductoPicker
                  productos={productos}
                  seleccionado={detalleActual.producto}
                  onSelect={p => setDetalleActual(prev => ({ ...prev, producto: p }))}
                  onClear={() => setDetalleActual(prev => ({ ...prev, producto: undefined }))}
                  onCreado={p => setProductos(prev => [...prev, p].sort((a, b) => a.nombre.localeCompare(b.nombre)))}
                />
              </div>

              <div className={detalleActual.formato === 'Otro' ? 'md:col-span-2' : 'md:col-span-3'}>
                <label className="block text-sm font-medium text-gray-600 mb-1">Formato</label>
                <select
                  name="formato"
                  value={detalleActual.formato}
                  onChange={handleDetalleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                >
                  {FORMATOS_SUGERIDOS.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                  <option value="Otro">Otro...</option>
                </select>
              </div>

              {detalleActual.formato === 'Otro' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Formato personalizado</label>
                  <input
                    type="text"
                    name="formatoCustom"
                    value={detalleActual.formatoCustom}
                    onChange={handleDetalleChange}
                    placeholder="Ej: Bolsa 5kg"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              )}

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-600 mb-1">Cant. Solicitada</label>
                <input
                  type="number"
                  name="cantidadSolicitada"
                  value={detalleActual.cantidadSolicitada || ''}
                  onChange={handleDetalleChange}
                  onFocus={e => e.target.select()}
                  min="1"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-10">
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Comentario para el comprador{' '}
                  <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  name="comentario"
                  value={detalleActual.comentario}
                  onChange={handleDetalleChange}
                  placeholder="Ej: Solo si el precio es razonable, preferir calidad buena..."
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div className="md:col-span-2">
                <button
                  type="button"
                  onClick={agregarDetalle}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 h-10 font-medium"
                >
                  <PlusCircle size={18} /> Agregar
                </button>
              </div>
            </div>
          </div>

          {/* Tabla de productos */}
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-sm font-semibold text-gray-600">Producto</th>
                  <th className="p-3 text-sm font-semibold text-gray-600">Formato</th>
                  <th className="p-3 text-sm font-semibold text-gray-600 text-center">Cant. Solicitada</th>
                  <th className="p-3 text-sm font-semibold text-gray-600 text-center">Estado</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {orden.detalles && orden.detalles.length > 0 ? (
                  orden.detalles.map((detalle, index) => (
                    <tr key={detalle.id ?? `new_${index}`} className="hover:bg-gray-50 border-b border-gray-100">
                      <td className="p-3 font-medium text-gray-800">
                        {detalle.nombreProductoSnapshot || detalle.producto.nombre}
                        {!detalle.id && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">nuevo</span>
                        )}
                        {detalle.comentario && (
                          <p className="text-xs text-blue-600 font-normal mt-0.5 italic">{detalle.comentario}</p>
                        )}
                      </td>
                      <td className="p-3">
                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">{detalle.formato}</span>
                      </td>
                      <td className="p-3 text-center font-semibold">{detalle.cantidadSolicitada}</td>
                      <td className="p-3 text-center">
                        <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-medium">
                          Pendiente
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => eliminarDetalle(index)}
                          className="text-red-400 hover:text-red-600"
                          title="Quitar producto"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-400 italic">
                      Aún no hay productos en la orden.
                    </td>
                  </tr>
                )}
              </tbody>
              {orden.detalles && orden.detalles.length > 0 && (
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={5} className="p-3 text-sm text-gray-500">
                      {orden.detalles.length} producto{orden.detalles.length !== 1 ? 's' : ''} solicitado{orden.detalles.length !== 1 ? 's' : ''}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* Botones */}
        <div className="flex flex-col sm:flex-row justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(`/ordenes/${id}`)}
            className="flex items-center justify-center gap-2 bg-white text-gray-600 font-semibold py-3 px-6 rounded-lg shadow border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={20} /> Cancelar
          </button>
          <button
            type="button"
            onClick={() => guardarOrden('BORRADOR')}
            className="flex items-center justify-center gap-2 bg-gray-500 text-white font-semibold py-3 px-6 rounded-lg shadow hover:bg-gray-600 transition-colors"
          >
            <Save size={20} /> Guardar como Borrador
          </button>
          <button
            type="button"
            onClick={() => guardarOrden('LISTA_PARA_COMPRAR')}
            className="flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-green-700 transition-colors"
          >
            <CheckCircle size={20} /> Marcar Lista para Comprar
          </button>
        </div>
      </div>
    </div>
  );
}
