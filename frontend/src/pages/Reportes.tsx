import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { normalizar } from '../utils/texto';
import { Producto } from '../types';
import { BarChart3, Search, AlertTriangle, TrendingUp, X, Link2 } from 'lucide-react';

interface ItemRentabilidad {
  producto: string;
  comprado: number;
  vendido: number;
  ganancia: number;
  cantComprada: number;
  cantVendida: number;
  margenReal: number | null;
  cobertura: 'ok' | 'solo_compra' | 'solo_venta';
}

interface Respuesta {
  desde: string;
  hasta: string;
  items: ItemRentabilidad[];
  totales: { comprado: number; vendido: number; ganancia: number; margenReal: number | null };
}

const clp = (n: number) => `$${Math.round(n).toLocaleString('es-CL')}`;
const pct = (n: number | null) => (n == null ? '—' : `${n.toFixed(1)}%`);
const qty = (n: number) => (n ? n.toLocaleString('es-CL', { maximumFractionDigits: 1 }) : '—');

// Primer y último día del mes actual como rango por defecto.
function rangoMesActual(): { desde: string; hasta: string } {
  const hoy = new Date();
  const primero = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { desde: iso(primero), hasta: iso(hoy) };
}

const COBERTURA_BADGE: Record<ItemRentabilidad['cobertura'], { txt: string; cls: string }> = {
  ok: { txt: 'Compra y venta', cls: 'bg-green-100 text-green-700' },
  solo_compra: { txt: 'Comprado, no vendido', cls: 'bg-amber-100 text-amber-700' },
  solo_venta: { txt: 'Vendido, sin compra', cls: 'bg-blue-100 text-blue-700' },
};

export default function Reportes() {
  const inicial = rangoMesActual();
  const [desde, setDesde] = useState(inicial.desde);
  const [hasta, setHasta] = useState(inicial.hasta);
  const [data, setData] = useState<Respuesta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  // Vinculación de una venta sin compra a un producto de compra (alias).
  const [vinculando, setVinculando] = useState<string | null>(null);

  const cargar = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get<Respuesta>('/reportes/rentabilidad', { params: { desde, hasta } });
      setData(res.data);
    } catch {
      setError('No se pudo cargar el reporte.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); /* carga inicial con el mes actual */ }, []);

  // Crea el alias nombre-de-venta → producto y recarga el reporte.
  const vincular = async (nombreVenta: string, productoId: number) => {
    await api.post('/reportes/alias', { nombreVenta, productoId });
    setVinculando(null);
    await cargar();
  };

  const t = data?.totales;
  const itemsFiltrados = data
    ? data.items.filter(i => normalizar(i.producto).includes(normalizar(busqueda)))
    : [];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 size={28} className="text-green-700" />
        <h1 className="text-3xl font-bold text-gray-800">Rentabilidad: compra vs venta</h1>
      </div>

      <p className="text-sm text-gray-500 mb-5 max-w-3xl">
        Cruza lo comprado (órdenes) con lo vendido (Eleventa) por producto en el período.
        El cruce es por nombre, y la comparación es en dinero — las cantidades se muestran como
        referencia pero no equivalen entre formatos de compra (cajas, mallas) y unidades de venta (kg).
      </p>

      {/* Filtros de fecha */}
      <div className="flex flex-wrap items-end gap-3 mb-5 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Desde</label>
          <input type="date" value={desde} onChange={e => setDesde(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Hasta</label>
          <input type="date" value={hasta} onChange={e => setHasta(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none" />
        </div>
        <button onClick={cargar} disabled={loading}
          className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white text-sm font-semibold px-4 py-2 rounded-lg transition disabled:opacity-60">
          <Search size={15} /> {loading ? 'Cargando...' : 'Consultar'}
        </button>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {/* Tarjetas de totales */}
      {t && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Comprado</p>
            <p className="text-xl font-bold text-gray-800">{clp(t.comprado)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Vendido</p>
            <p className="text-xl font-bold text-gray-800">{clp(t.vendido)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Ganancia (Eleventa)</p>
            <p className="text-xl font-bold text-gray-800">{clp(t.ganancia)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><TrendingUp size={12} /> Margen real</p>
            <p className="text-xl font-bold text-green-700">{pct(t.margenReal)}</p>
          </div>
        </div>
      )}

      {/* Buscador por producto (mismo patrón que la pantalla Productos) */}
      {data && data.items.length > 0 && (
        <div className="relative mb-3">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar producto en el reporte..."
            className="w-full pl-9 pr-9 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
          />
          {busqueda && (
            <button
              onClick={() => setBusqueda('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Limpiar búsqueda"
            >
              <X size={16} />
            </button>
          )}
        </div>
      )}

      {/* Tabla por producto */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-400">Cargando...</div>
        ) : !data || data.items.length === 0 ? (
          <div className="p-10 text-center text-gray-400">Sin datos en el período seleccionado.</div>
        ) : itemsFiltrados.length === 0 ? (
          <div className="p-10 text-center text-gray-400">No se encontraron productos para "{busqueda}".</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 font-semibold text-gray-600">Producto</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 text-right">Comprado</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 text-right">Cant. comprada</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 text-right">Vendido</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 text-right">Cant. vendida</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 text-right">Ganancia</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 text-right">Margen real</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 text-center">Cobertura</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {itemsFiltrados.map((it, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-2.5 font-medium text-gray-800">{it.producto}</td>
                    <td className="px-4 py-2.5 text-right text-gray-700">{it.comprado > 0 ? clp(it.comprado) : '—'}</td>
                    <td className="px-4 py-2.5 text-right text-gray-700">{qty(it.cantComprada)}</td>
                    <td className="px-4 py-2.5 text-right text-gray-700">{it.vendido > 0 ? clp(it.vendido) : '—'}</td>
                    <td className="px-4 py-2.5 text-right text-gray-700">{qty(it.cantVendida)}</td>
                    <td className="px-4 py-2.5 text-right text-gray-700">{it.ganancia !== 0 ? clp(it.ganancia) : '—'}</td>
                    <td className={`px-4 py-2.5 text-right font-semibold ${
                      it.margenReal == null ? 'text-gray-400'
                        : it.margenReal < 0 ? 'text-red-600' : 'text-green-700'
                    }`}>
                      {pct(it.margenReal)}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${COBERTURA_BADGE[it.cobertura].cls}`}>
                          {COBERTURA_BADGE[it.cobertura].txt}
                        </span>
                        {it.cobertura === 'solo_venta' && (
                          <button
                            onClick={() => setVinculando(it.producto)}
                            title="Vincular esta venta a un producto de compra"
                            className="flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900"
                          >
                            <Link2 size={13} /> Vincular
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-4">
        Margen real = (Vendido − Comprado) / Vendido. "Comprado, no vendido" suele indicar mercadería
        que aún no rota o que se vende con otro nombre en Eleventa. Usa "Vincular" en las filas
        "Vendido, sin compra" para asociarlas al producto de compra correcto; el vínculo queda guardado.
      </p>

      {vinculando && (
        <VincularModal
          nombreVenta={vinculando}
          onCancelar={() => setVinculando(null)}
          onVincular={productoId => vincular(vinculando, productoId)}
        />
      )}
    </div>
  );
}

/** Modal para elegir a qué producto de compra se atribuye una venta sin contraparte. */
function VincularModal({
  nombreVenta,
  onVincular,
  onCancelar,
}: {
  nombreVenta: string;
  onVincular: (productoId: number) => Promise<void>;
  onCancelar: () => void;
}) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [q, setQ] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<Producto[]>('/productos')
      .then(res => setProductos(res.data.filter(p => p.activo !== false)))
      .catch(() => setError('No se pudieron cargar los productos.'));
  }, []);

  const filtrados = productos
    .filter(p => normalizar(p.nombre).includes(normalizar(q)))
    .slice(0, 50);

  const elegir = async (id?: number) => {
    if (id == null || guardando) return;
    setGuardando(true);
    setError('');
    try {
      await onVincular(id);
    } catch {
      setError('No se pudo guardar el vínculo.');
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onCancelar}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Vincular venta a producto</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Venta: <span className="font-semibold text-gray-700">{nombreVenta}</span>
            </p>
          </div>
          <button onClick={onCancelar} className="text-gray-400 hover:text-gray-600" aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              autoFocus
              type="text"
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Buscar producto de compra..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>
        </div>

        {error && (
          <div className="mx-4 mt-3 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">
            <AlertTriangle size={15} /> {error}
          </div>
        )}

        <div className="overflow-y-auto flex-1 p-2">
          {filtrados.length === 0 ? (
            <p className="p-6 text-center text-gray-400 text-sm">Sin productos que coincidan.</p>
          ) : (
            filtrados.map(p => (
              <button
                key={p.id}
                onClick={() => elegir(p.id)}
                disabled={guardando}
                className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-green-50 transition flex items-center justify-between disabled:opacity-60"
              >
                <span className="font-medium text-gray-800">{p.nombre}</span>
                {p.formatoHabitual && <span className="text-xs text-gray-400">{p.formatoHabitual}</span>}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
