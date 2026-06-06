import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface HistorialItem {
  detalleId: number;
  ordenId: number;
  fecha: string;
  formato: string;
  cantidadComprada: number;
  cantidadInterna: number | null;
  costoTotal: number | null;
  costoUnitario: number | null;
  precioFinal: number | null;
  factura: boolean | null;
  estadoProducto: string | null;
  proveedorNombre: string | null;
}

const ESTADO_LABEL: Record<string, { label: string; cls: string }> = {
  COMPRADO:            { label: 'Comprado',   cls: 'bg-green-100 text-green-700' },
  COMPRA_PARCIAL:      { label: 'Parcial',    cls: 'bg-yellow-100 text-yellow-700' },
  NO_COMPRADO:         { label: 'No comprado',cls: 'bg-red-100 text-red-700' },
  AGREGADO_EN_MERCADO: { label: 'Mercado',    cls: 'bg-blue-100 text-blue-600' },
  PENDIENTE:           { label: 'Pendiente',  cls: 'bg-gray-100 text-gray-500' },
};

export default function HistorialProducto() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [historial, setHistorial] = useState<HistorialItem[]>([]);
  const [nombreProducto, setNombreProducto] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resProducto, resHistorial] = await Promise.all([
          api.get(`/productos/${id}`),
          api.get(`/productos/${id}/historial`),
        ]);
        setNombreProducto(resProducto.data.nombre);
        setHistorial(resHistorial.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const compras = historial.filter(h => h.costoTotal != null && h.costoTotal > 0);
  const ultimoCostoUnitario = compras.length > 0 ? compras[0].costoUnitario : null;
  const anteriorCostoUnitario = compras.length > 1 ? compras[1].costoUnitario : null;
  const promedioCostoUnitario = compras.length > 0
    ? compras.reduce((s, h) => s + (h.costoUnitario ?? 0), 0) / compras.filter(h => h.costoUnitario != null).length
    : null;

  const tendencia = ultimoCostoUnitario != null && anteriorCostoUnitario != null
    ? ultimoCostoUnitario > anteriorCostoUnitario ? 'sube'
    : ultimoCostoUnitario < anteriorCostoUnitario ? 'baja'
    : 'igual'
    : null;

  if (loading) return <div className="p-8 text-center text-gray-400">Cargando historial...</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/productos')}
          className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Historial — {nombreProducto}</h1>
          <p className="text-sm text-gray-500">Compras realizadas en órdenes completadas</p>
        </div>
      </div>

      {/* Cards resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-xs text-gray-500 uppercase font-medium mb-1">Veces comprado</p>
          <p className="text-3xl font-bold text-gray-800">{compras.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-xs text-gray-500 uppercase font-medium mb-1">Última compra</p>
          <p className="text-base font-bold text-gray-800">
            {compras.length > 0 ? compras[0].fecha : '—'}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-xs text-gray-500 uppercase font-medium mb-1">Costo unitario reciente</p>
          <div className="flex items-center justify-center gap-1">
            <p className="text-xl font-bold text-gray-800">
              {ultimoCostoUnitario != null ? `$${Math.round(ultimoCostoUnitario).toLocaleString('es-CL')}` : '—'}
            </p>
            {tendencia === 'sube' && <TrendingUp size={18} className="text-red-500" />}
            {tendencia === 'baja' && <TrendingDown size={18} className="text-green-500" />}
            {tendencia === 'igual' && <Minus size={18} className="text-gray-400" />}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-xs text-gray-500 uppercase font-medium mb-1">Costo unitario promedio</p>
          <p className="text-xl font-bold text-gray-800">
            {promedioCostoUnitario != null ? `$${Math.round(promedioCostoUnitario).toLocaleString('es-CL')}` : '—'}
          </p>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {historial.length === 0 ? (
          <p className="p-10 text-center text-gray-400 italic">
            No hay compras registradas para este producto.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Formato</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-center">Cant.</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Costo total</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Costo/formato</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Costo unit.</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Precio venta</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-center">Factura</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Proveedor</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-center">OC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {historial.map((h, i) => (
                <tr key={h.detalleId} className={`hover:bg-gray-50 transition ${i === 0 ? 'bg-green-50/40' : ''}`}>
                  <td className="px-4 py-3 font-medium text-gray-800">{h.fecha}</td>
                  <td className="px-4 py-3">
                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">{h.formato || '—'}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {h.cantidadComprada != null ? h.cantidadComprada : '—'}
                    {h.cantidadInterna ? <span className="text-gray-400 text-xs ml-1">×{h.cantidadInterna}</span> : ''}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {h.costoTotal != null ? `$${h.costoTotal.toLocaleString('es-CL')}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-orange-700">
                    {h.costoTotal != null && h.cantidadComprada != null && h.cantidadComprada > 0
                      ? `$${Math.round(h.costoTotal / h.cantidadComprada).toLocaleString('es-CL')}`
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-gray-800">
                    {h.costoUnitario != null ? `$${Math.round(h.costoUnitario).toLocaleString('es-CL')}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-green-700 font-semibold">
                    {h.precioFinal != null ? `$${h.precioFinal.toLocaleString('es-CL')}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {h.factura == null ? '—' : h.factura
                      ? <span className="text-blue-600 font-semibold text-xs">Sí</span>
                      : <span className="text-gray-400 text-xs">No</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{h.proveedorNombre || '—'}</td>
                  <td className="px-4 py-3">
                    {h.estadoProducto && ESTADO_LABEL[h.estadoProducto]
                      ? <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${ESTADO_LABEL[h.estadoProducto].cls}`}>
                          {ESTADO_LABEL[h.estadoProducto].label}
                        </span>
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => navigate(`/ordenes/${h.ordenId}`)}
                      className="text-xs text-blue-600 hover:underline font-medium"
                    >
                      #{h.ordenId}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
