import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { BarChart3, Search, AlertTriangle, TrendingUp } from 'lucide-react';

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

  const t = data?.totales;

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

      {/* Tabla por producto */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-400">Cargando...</div>
        ) : !data || data.items.length === 0 ? (
          <div className="p-10 text-center text-gray-400">Sin datos en el período seleccionado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 font-semibold text-gray-600">Producto</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 text-right">Comprado</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 text-right">Vendido</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 text-right">Ganancia</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 text-right">Margen real</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 text-center">Cobertura</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.items.map((it, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-2.5 font-medium text-gray-800">{it.producto}</td>
                    <td className="px-4 py-2.5 text-right text-gray-700">{it.comprado > 0 ? clp(it.comprado) : '—'}</td>
                    <td className="px-4 py-2.5 text-right text-gray-700">{it.vendido > 0 ? clp(it.vendido) : '—'}</td>
                    <td className="px-4 py-2.5 text-right text-gray-700">{it.ganancia !== 0 ? clp(it.ganancia) : '—'}</td>
                    <td className={`px-4 py-2.5 text-right font-semibold ${
                      it.margenReal == null ? 'text-gray-400'
                        : it.margenReal < 0 ? 'text-red-600' : 'text-green-700'
                    }`}>
                      {pct(it.margenReal)}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${COBERTURA_BADGE[it.cobertura].cls}`}>
                        {COBERTURA_BADGE[it.cobertura].txt}
                      </span>
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
        que aún no rota o que se vende con otro nombre en Eleventa.
      </p>
    </div>
  );
}
