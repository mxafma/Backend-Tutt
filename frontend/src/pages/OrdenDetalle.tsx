import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { OrdenCompra, EstadoOrden } from '../types';
import { ArrowLeft, ShoppingBag, CheckCircle, XCircle, Pencil } from 'lucide-react';

const ESTADO_CONFIG: Record<EstadoOrden, { label: string; bg: string; text: string }> = {
  BORRADOR:           { label: 'Borrador',           bg: 'bg-gray-100',   text: 'text-gray-700' },
  LISTA_PARA_COMPRAR: { label: 'Lista para Comprar', bg: 'bg-blue-100',   text: 'text-blue-700' },
  EN_COMPRA:          { label: 'En Compra',           bg: 'bg-yellow-100', text: 'text-yellow-700' },
  COMPRADA:           { label: 'Comprada',            bg: 'bg-purple-100', text: 'text-purple-700' },
  RECIBIDA:           { label: 'Recibida',            bg: 'bg-teal-100',   text: 'text-teal-700' },
  CERRADA:            { label: 'Cerrada',             bg: 'bg-green-100',  text: 'text-green-700' },
  CANCELADA:          { label: 'Cancelada',           bg: 'bg-red-100',    text: 'text-red-600' },
};

const ESTADO_PRODUCTO_CONFIG: Record<string, { label: string; color: string }> = {
  PENDIENTE:           { label: 'Pendiente',           color: 'bg-yellow-100 text-yellow-700' },
  COMPRADO:            { label: 'Comprado',            color: 'bg-green-100 text-green-700' },
  COMPRA_PARCIAL:      { label: 'Compra Parcial',      color: 'bg-orange-100 text-orange-700' },
  NO_COMPRADO:         { label: 'No Comprado',         color: 'bg-red-100 text-red-600' },
  AGREGADO_EN_MERCADO: { label: 'Agregado en Mercado', color: 'bg-blue-100 text-blue-700' },
};

const TIPO_LABEL: Record<string, string> = {
  MERCADO:         'Mercado',
  PROVEEDOR_LOCAL: 'Proveedor Local',
  INSUMO:          'Insumo',
  GASTO_OPERATIVO: 'Gasto Operativo',
};

export default function OrdenDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [orden, setOrden] = useState<OrdenCompra | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrden();
  }, [id]);

  const fetchOrden = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/ordenes/${id}`);
      setOrden(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const cambiarEstado = async (nuevoEstado: EstadoOrden) => {
    try {
      await api.patch(`/ordenes/${id}/estado`, { estado: nuevoEstado });
      fetchOrden();
    } catch (err) {
      console.error(err);
      alert('Error al cambiar el estado de la orden.');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Cargando orden...</div>;
  }
  if (!orden) {
    return <div className="p-8 text-center text-red-500">Orden no encontrada.</div>;
  }

  const estadoConf = ESTADO_CONFIG[orden.estado] ?? ESTADO_CONFIG.BORRADOR;

  const totalComprado = orden.detalles.reduce(
    (sum, d) => sum + (d.costoTotal ?? 0),
    0
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/ordenes')}
          className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex-grow">
          <h1 className="text-2xl font-bold text-gray-800">Orden #{orden.id}</h1>
          <p className="text-sm text-gray-500">
            Creada el{' '}
            {orden.fechaCreacion
              ? new Date(orden.fechaCreacion).toLocaleDateString('es-CL', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })
              : '—'}
          </p>
        </div>
        <span
          className={`px-3 py-1.5 rounded-full text-sm font-semibold ${estadoConf.bg} ${estadoConf.text}`}
        >
          {estadoConf.label}
        </span>
      </div>

      {/* Información General */}
      <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 mb-5">
        <h2 className="text-base font-semibold text-gray-700 mb-3">Información General</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">
              Fecha Planificada
            </p>
            <p className="text-gray-800 font-medium">
              {orden.fechaCompraPlanificada || '—'}
            </p>
          </div>
          <div>
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">
              Tipo de Compra
            </p>
            <p className="text-gray-800 font-medium">
              {TIPO_LABEL[orden.tipoCompra] ?? orden.tipoCompra}
            </p>
          </div>
          <div>
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">
              Proveedor / Lugar
            </p>
            <p className="text-gray-800 font-medium">
              {orden.proveedorNombre || orden.lugarCompra || '—'}
            </p>
          </div>
          <div>
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">
              Encargado
            </p>
            <p className="text-gray-800 font-medium">{orden.encargadoCompra || '—'}</p>
          </div>
          {orden.fechaCompraReal && (
            <div>
              <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">
                Fecha Compra Real
              </p>
              <p className="text-gray-800 font-medium">
                {new Date(orden.fechaCompraReal).toLocaleDateString('es-CL')}
              </p>
            </div>
          )}
          {totalComprado > 0 && (
            <div>
              <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">
                Total Comprado
              </p>
              <p className="text-gray-800 font-bold text-base">
                ${totalComprado.toLocaleString('es-CL')}
              </p>
            </div>
          )}
          {orden.observaciones && (
            <div className="col-span-2 md:col-span-4">
              <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">
                Observaciones
              </p>
              <p className="text-gray-700">{orden.observaciones}</p>
            </div>
          )}
        </div>
      </div>

      {/* Tabla de productos */}
      <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 mb-5">
        <h2 className="text-base font-semibold text-gray-700 mb-3">
          Productos ({orden.detalles?.length ?? 0})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Producto
                </th>
                <th className="p-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Formato
                </th>
                <th className="p-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Solicitado
                </th>
                <th className="p-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Comprado
                </th>
                <th className="p-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Costo Total
                </th>
                <th className="p-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Factura
                </th>
                <th className="p-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Comentario
                </th>
                <th className="p-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody>
              {orden.detalles?.length > 0 ? (
                orden.detalles.map((d, i) => {
                  const epConf = ESTADO_PRODUCTO_CONFIG[d.estadoProducto ?? 'PENDIENTE'];
                  return (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-3 font-medium text-gray-800">
                        {d.nombreProductoSnapshot || d.producto?.nombre}
                        {d.agregadoEnMercado && (
                          <span className="ml-1.5 text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">
                            mercado
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">
                          {d.formato || '—'}
                        </span>
                      </td>
                      <td className="p-3 text-center">{d.cantidadSolicitada}</td>
                      <td className="p-3 text-center">
                        {d.cantidadComprada != null ? (
                          d.cantidadComprada
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        {d.costoTotal != null ? (
                          <span className="font-medium">
                            ${d.costoTotal.toLocaleString('es-CL')}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {d.factura === true ? (
                          <span className="text-green-600 font-bold">Sí</span>
                        ) : d.factura === false ? (
                          <span className="text-gray-500">No</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="p-3 text-gray-600 text-xs max-w-xs truncate">
                        {d.comentario || '—'}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            epConf?.color ?? 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {epConf?.label ?? d.estadoProducto ?? 'Pendiente'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-gray-400">
                    Sin productos en esta orden.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Precios calculados — solo para órdenes recibidas o cerradas */}
      {(orden.estado === 'RECIBIDA' || orden.estado === 'CERRADA') &&
        orden.detalles.some(d => d.costoUnitarioCalculado != null || d.precioSugerido != null) && (
          <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 mb-5">
            <h2 className="text-base font-semibold text-gray-700 mb-3">Precios Calculados</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="p-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Producto
                    </th>
                    <th className="p-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Formato
                    </th>
                    <th className="p-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Costo / Unidad
                    </th>
                    <th className="p-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Precio Sugerido
                    </th>
                    <th className="p-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Precio Final
                    </th>
                    <th className="p-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Margen
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orden.detalles.map((d, i) => {
                    const margen = d.margenResultante;
                    const margenColor =
                      margen == null
                        ? 'text-gray-400'
                        : margen >= 35
                        ? 'text-green-700 font-bold'
                        : margen >= 20
                        ? 'text-yellow-600 font-bold'
                        : 'text-red-600 font-bold';
                    return (
                      <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-3 font-medium text-gray-800">
                          {d.nombreProductoSnapshot || d.producto?.nombre}
                        </td>
                        <td className="p-3">
                          <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">
                            {d.formato || '—'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {d.costoUnitarioCalculado != null ? (
                            `$${d.costoUnitarioCalculado.toLocaleString('es-CL')}`
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          {d.precioSugerido != null ? (
                            <span className="text-green-700 font-semibold">
                              ${d.precioSugerido.toLocaleString('es-CL')}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          {d.precioFinalEditado != null && d.precioFinalEditado > 0 ? (
                            <span className="font-bold">
                              ${d.precioFinalEditado.toLocaleString('es-CL')}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className={`p-3 text-center ${margenColor}`}>
                          {margen != null ? `${margen.toFixed(1)}%` : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      {/* Acciones según estado */}
      <div className="flex flex-wrap gap-3 justify-end">
        {orden.estado === 'BORRADOR' && (
          <>
            <button
              onClick={() => cambiarEstado('LISTA_PARA_COMPRAR')}
              className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 font-semibold transition-colors"
            >
              <CheckCircle size={18} /> Marcar Lista para Comprar
            </button>
            <button
              onClick={() => {
                if (confirm('¿Cancelar esta orden?')) cambiarEstado('CANCELADA');
              }}
              className="flex items-center gap-2 bg-red-500 text-white px-5 py-2.5 rounded-lg hover:bg-red-600 font-semibold transition-colors"
            >
              <XCircle size={18} /> Cancelar Orden
            </button>
          </>
        )}

        {orden.estado === 'LISTA_PARA_COMPRAR' && (
          <>
            <Link
              to={`/compra/${orden.id}`}
              className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 font-semibold transition-colors"
            >
              <ShoppingBag size={18} /> Ir a Modo Compra
            </Link>
            <button
              onClick={() => cambiarEstado('BORRADOR')}
              className="flex items-center gap-2 bg-gray-400 text-white px-5 py-2.5 rounded-lg hover:bg-gray-500 font-semibold transition-colors"
            >
              <ArrowLeft size={18} /> Volver a Borrador
            </button>
          </>
        )}

        {orden.estado === 'EN_COMPRA' && (
          <Link
            to={`/compra/${orden.id}`}
            className="flex items-center gap-2 bg-yellow-500 text-white px-5 py-2.5 rounded-lg hover:bg-yellow-600 font-semibold transition-colors"
          >
            <ShoppingBag size={18} /> Continuar Compra
          </Link>
        )}

        {orden.estado === 'COMPRADA' && (
          <Link
            to={`/recepcion/${orden.id}`}
            className="flex items-center gap-2 bg-teal-600 text-white px-5 py-2.5 rounded-lg hover:bg-teal-700 font-semibold transition-colors"
          >
            <CheckCircle size={18} /> Ir a Recepción
          </Link>
        )}

        {orden.estado === 'RECIBIDA' && (
          <button
            onClick={() => cambiarEstado('CERRADA')}
            className="flex items-center gap-2 bg-green-700 text-white px-5 py-2.5 rounded-lg hover:bg-green-800 font-semibold transition-colors"
          >
            <CheckCircle size={18} /> Cerrar Orden
          </button>
        )}

        {(orden.estado === 'RECIBIDA' || orden.estado === 'CERRADA') && (
          <Link
            to={`/recepcion/${orden.id}`}
            className="flex items-center gap-2 bg-orange-500 text-white px-5 py-2.5 rounded-lg hover:bg-orange-600 font-semibold transition-colors"
          >
            <Pencil size={18} /> Editar Datos
          </Link>
        )}
      </div>
    </div>
  );
}
