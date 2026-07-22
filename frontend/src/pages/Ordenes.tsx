import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { OrdenCompra, EstadoOrden } from '../types';
import { PlusCircle, Eye, ShoppingBag, ClipboardList, FileDown } from 'lucide-react';

// Carga diferida: jsPDF solo se descarga cuando el usuario pide el PDF.
async function descargarPdf(orden: OrdenCompra) {
  const { descargarOrdenProveedorPdf } = await import('../utils/ordenPdf');
  descargarOrdenProveedorPdf(orden);
}

const ESTADO_CONFIG: Record<EstadoOrden, { label: string; bg: string; text: string }> = {
  BORRADOR:           { label: 'Borrador',           bg: 'bg-gray-100',    text: 'text-gray-600' },
  LISTA_PARA_COMPRAR: { label: 'Lista para Comprar', bg: 'bg-blue-100',    text: 'text-blue-700' },
  EN_COMPRA:          { label: 'En Compra',           bg: 'bg-yellow-100',  text: 'text-yellow-700' },
  COMPRADA:           { label: 'Comprada',            bg: 'bg-purple-100',  text: 'text-purple-700' },
  RECIBIDA:           { label: 'Recibida',            bg: 'bg-teal-100',    text: 'text-teal-700' },
  CERRADA:            { label: 'Cerrada',             bg: 'bg-green-100',   text: 'text-green-700' },
  CANCELADA:          { label: 'Cancelada',           bg: 'bg-red-100',     text: 'text-red-600' },
};

const TIPO_LABEL: Record<string, string> = {
  MERCADO:          'Mercado',
  PROVEEDOR_LOCAL:  'Prov. Local',
  INSUMO:           'Insumo',
  GASTO_OPERATIVO:  'Gasto Op.',
};

// Orden de prioridad: la orden activa del comprador siempre arriba.
const ESTADO_PRIORIDAD: Record<EstadoOrden, number> = {
  EN_COMPRA:          0,
  LISTA_PARA_COMPRAR: 1,
  BORRADOR:           2,
  COMPRADA:           3,
  RECIBIDA:           4,
  CERRADA:            5,
  CANCELADA:          6,
};

// Estados que se consideran "activos" (en curso). El resto va al historial.
const ESTADOS_ACTIVOS: EstadoOrden[] = [
  'EN_COMPRA', 'LISTA_PARA_COMPRAR', 'BORRADOR', 'COMPRADA', 'RECIBIDA',
];

const HISTORIAL_PAGINA = 15;

// Orden: primero por prioridad de estado, luego por fecha de última
// actualización (creación o cambio de estado) descendente.
function ordenarOrdenes(lista: OrdenCompra[]): OrdenCompra[] {
  return [...lista].sort((a, b) => {
    const pa = ESTADO_PRIORIDAD[a.estado] ?? 99;
    const pb = ESTADO_PRIORIDAD[b.estado] ?? 99;
    if (pa !== pb) return pa - pb;
    const fa = a.fechaActualizacion || a.fechaCreacion || '';
    const fb = b.fechaActualizacion || b.fechaCreacion || '';
    return fb.localeCompare(fa);
  });
}

function TablaOrdenes({ ordenes }: { ordenes: OrdenCompra[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="p-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              ID
            </th>
            <th className="p-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Fecha Planificada
            </th>
            <th className="p-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Tipo
            </th>
            <th className="p-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Proveedor / Lugar
            </th>
            <th className="p-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">
              Productos
            </th>
            <th className="p-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Estado
            </th>
            <th className="p-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {ordenes.map(orden => {
            const estadoConf = ESTADO_CONFIG[orden.estado] ?? ESTADO_CONFIG.BORRADOR;
            return (
              <tr
                key={orden.id}
                className="hover:bg-gray-50 border-b border-gray-100 last:border-0"
              >
                <td className="p-3 font-mono text-gray-500 text-sm">#{orden.id}</td>
                <td className="p-3 text-sm text-gray-700">
                  {orden.fechaCompraPlanificada || '—'}
                </td>
                <td className="p-3 text-sm text-gray-600">
                  {TIPO_LABEL[orden.tipoCompra] ?? orden.tipoCompra}
                </td>
                <td className="p-3 text-sm text-gray-600">
                  {orden.proveedorNombre || orden.lugarCompra || (
                    <span className="text-gray-400 italic">Sin asignar</span>
                  )}
                </td>
                <td className="p-3 text-center">
                  <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full text-sm font-semibold">
                    {orden.detalles?.length ?? 0}
                  </span>
                </td>
                <td className="p-3">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold ${estadoConf.bg} ${estadoConf.text}`}
                  >
                    {estadoConf.label}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex gap-3 items-center">
                    <Link
                      to={`/ordenes/${orden.id}`}
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      <Eye size={15} /> Ver
                    </Link>
                    {orden.estado === 'LISTA_PARA_COMPRAR' && (
                      <Link
                        to={`/compra/${orden.id}`}
                        className="flex items-center gap-1 text-sm text-green-700 hover:text-green-900 font-medium"
                      >
                        <ShoppingBag size={15} /> Iniciar Compra
                      </Link>
                    )}
                    {orden.estado === 'EN_COMPRA' && (
                      <Link
                        to={`/compra/${orden.id}`}
                        className="flex items-center gap-1 text-sm text-yellow-700 hover:text-yellow-900 font-medium"
                      >
                        <ShoppingBag size={15} /> Continuar
                      </Link>
                    )}
                    <button
                      onClick={() => descargarPdf(orden)}
                      className="flex items-center gap-1 text-sm text-green-700 hover:text-green-900 font-medium"
                      title="Descargar orden en PDF"
                    >
                      <FileDown size={15} /> PDF
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function Ordenes() {
  const [ordenes, setOrdenes] = useState<OrdenCompra[]>([]);
  const [loading, setLoading] = useState(true);
  const [historialVisible, setHistorialVisible] = useState(HISTORIAL_PAGINA);

  useEffect(() => {
    fetchOrdenes();
  }, []);

  const fetchOrdenes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/ordenes');
      setOrdenes(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const { activas, historial } = useMemo(() => {
    const ordenadas = ordenarOrdenes(ordenes);
    return {
      activas: ordenadas.filter(o => ESTADOS_ACTIVOS.includes(o.estado)),
      historial: ordenadas.filter(o => !ESTADOS_ACTIVOS.includes(o.estado)),
    };
  }, [ordenes]);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Órdenes de Compra</h1>
        <Link
          to="/ordenes/nueva"
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm"
        >
          <PlusCircle size={18} /> Nueva Orden
        </Link>
      </div>

      {loading ? (
        <div className="bg-white border rounded-lg shadow-sm">
          <p className="p-6 text-center text-gray-500">Cargando órdenes...</p>
        </div>
      ) : ordenes.length === 0 ? (
        <div className="bg-white border rounded-lg shadow-sm">
          <div className="p-12 text-center">
            <ClipboardList size={48} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-lg font-medium">No hay órdenes registradas aún.</p>
            <Link
              to="/ordenes/nueva"
              className="text-green-600 hover:underline mt-2 inline-block text-sm"
            >
              Crear la primera orden →
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Órdenes activas: siempre visibles, sin límite */}
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Órdenes activas
            </h2>
            <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
              {activas.length === 0 ? (
                <p className="p-6 text-center text-gray-400 text-sm">
                  No hay órdenes activas en este momento.
                </p>
              ) : (
                <TablaOrdenes ordenes={activas} />
              )}
            </div>
          </section>

          {/* Historial: cerradas y canceladas, con carga progresiva */}
          {historial.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Historial <span className="text-gray-400 normal-case">({historial.length})</span>
              </h2>
              <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
                <TablaOrdenes ordenes={historial.slice(0, historialVisible)} />
                {historialVisible < historial.length && (
                  <div className="border-t border-gray-100 p-3 text-center">
                    <button
                      onClick={() => setHistorialVisible(v => v + HISTORIAL_PAGINA)}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      Cargar más ({historial.length - historialVisible} restantes)
                    </button>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
