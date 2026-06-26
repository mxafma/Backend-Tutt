import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Merge, ArrowLeft, CheckCircle2, AlertTriangle } from 'lucide-react';

interface DupItem {
  id: number;
  nombre: string;
  descripcion?: string | null;
  formatoHabitual?: string | null;
  usosEnOrdenes: number;
}

export default function FusionProductos() {
  const [grupos, setGrupos] = useState<DupItem[][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // principal elegido por grupo (índice de grupo -> id de producto principal)
  const [principales, setPrincipales] = useState<Record<number, number>>({});
  const [fusionando, setFusionando] = useState<number | null>(null);
  const [mensaje, setMensaje] = useState('');

  const cargar = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get<DupItem[][]>('/productos/duplicados');
      setGrupos(res.data);
      // Por defecto, el principal sugerido es el que más se usa en órdenes.
      const def: Record<number, number> = {};
      res.data.forEach((g, i) => {
        const sugerido = [...g].sort((a, b) => b.usosEnOrdenes - a.usosEnOrdenes)[0];
        def[i] = sugerido.id;
      });
      setPrincipales(def);
    } catch {
      setError('No se pudieron cargar los duplicados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const fusionar = async (grupoIdx: number) => {
    const grupo = grupos[grupoIdx];
    const principalId = principales[grupoIdx];
    if (!principalId) return;
    const principal = grupo.find(p => p.id === principalId)!;
    const duplicadoIds = grupo.filter(p => p.id !== principalId).map(p => p.id);
    const ok = confirm(
      `Se fusionarán ${duplicadoIds.length} producto(s) en "${principal.nombre}".\n\n` +
      `Todo el historial de los duplicados pasará a "${principal.nombre}" y los duplicados quedarán inactivos. ` +
      `Esta acción no borra datos, pero conviene revisarla.\n\n¿Continuar?`
    );
    if (!ok) return;
    try {
      setFusionando(grupoIdx);
      setMensaje('');
      await api.post('/productos/fusionar', { principalId, duplicadoIds });
      setMensaje(`Productos fusionados en "${principal.nombre}".`);
      await cargar();
    } catch {
      setError('Error al fusionar. Intenta nuevamente.');
    } finally {
      setFusionando(null);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Merge size={28} className="text-green-700" />
          <h1 className="text-3xl font-bold text-gray-800">Fusionar productos duplicados</h1>
        </div>
        <Link to="/productos" className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-gray-800">
          <ArrowLeft size={16} /> Volver a Productos
        </Link>
      </div>

      <p className="text-sm text-gray-500 mb-5 max-w-3xl">
        Aquí aparecen los productos cuyo nombre es prácticamente el mismo ignorando tildes y mayúsculas
        (por ejemplo <span className="font-medium">"Plátano"</span> y <span className="font-medium">"platano"</span>).
        Elige cuál se mantiene como principal y fusiona: el historial de los demás se reasigna al principal y
        los duplicados quedan inactivos.
      </p>

      {mensaje && (
        <div className="mb-4 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">
          <CheckCircle2 size={16} /> {mensaje}
        </div>
      )}
      {error && (
        <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {loading ? (
        <div className="p-10 text-center text-gray-400">Buscando duplicados...</div>
      ) : grupos.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-10 text-center">
          <CheckCircle2 size={36} className="text-green-500 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No hay productos duplicados.</p>
          <p className="text-sm text-gray-400 mt-1">Todo limpio por ahora.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {grupos.map((grupo, i) => (
            <div key={i} className="bg-white rounded-xl shadow-md border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-gray-700">
                  {grupo.length} productos parecidos
                </h2>
                <button
                  onClick={() => fusionar(i)}
                  disabled={fusionando !== null}
                  className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white text-sm font-semibold px-4 py-2 rounded-lg transition disabled:opacity-60"
                >
                  <Merge size={15} /> {fusionando === i ? 'Fusionando...' : 'Fusionar en el principal'}
                </button>
              </div>
              <div className="space-y-2">
                {grupo.map(p => (
                  <label
                    key={p.id}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg border cursor-pointer transition ${
                      principales[i] === p.id
                        ? 'border-green-400 bg-green-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`principal-${i}`}
                      checked={principales[i] === p.id}
                      onChange={() => setPrincipales(prev => ({ ...prev, [i]: p.id }))}
                      className="accent-green-600"
                    />
                    <div className="flex-1">
                      <span className="font-medium text-gray-800">{p.nombre}</span>
                      {p.formatoHabitual && (
                        <span className="ml-2 text-xs text-gray-400">({p.formatoHabitual})</span>
                      )}
                      {principales[i] === p.id && (
                        <span className="ml-2 text-xs font-semibold text-green-600">PRINCIPAL</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {p.usosEnOrdenes} uso{p.usosEnOrdenes === 1 ? '' : 's'} en órdenes
                    </span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-3">
                Se mantiene el marcado como <span className="font-medium">PRINCIPAL</span>; los demás se inactivan.
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
