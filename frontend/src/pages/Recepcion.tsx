import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { OrdenCompra } from '../types';
import { ArrowLeft, CheckCircle, Plus } from 'lucide-react';

const FORMATOS_SUGERIDOS = ['Bins', 'Caja', 'Malla', 'Saco', 'Bandeja', 'Unidad', 'Kilo', 'Paquete'];

const ESTADO_LABEL: Record<string, { label: string; cls: string }> = {
  COMPRADO:          { label: 'Comprado',        cls: 'bg-green-100 text-green-700' },
  COMPRA_PARCIAL:    { label: 'Parcial',          cls: 'bg-yellow-100 text-yellow-700' },
  NO_COMPRADO:       { label: 'No comprado',      cls: 'bg-red-100 text-red-700' },
  AGREGADO_EN_MERCADO: { label: 'Mercado',        cls: 'bg-blue-100 text-blue-600' },
  PENDIENTE:         { label: 'Pendiente',        cls: 'bg-gray-100 text-gray-600' },
};

const redondearDecena = (valor: number): number => Math.floor(valor / 10) * 10;

interface DetalleRecepcion {
  cantidadComprada: number;
  costoTotal: number;
  factura: boolean;
  cantidadInterna: number;
  margenSugerido: number;
  precioFinalEditado: number;
}

interface Calculos {
  costoConsiderado: number;
  totalInterno: number;
  costoUnitario: number;
  precioSugerido: number;
  margenResultante: number;
  unidadLabel: string;
}

function calcular(edit: DetalleRecepcion): Calculos {
  const costoConsiderado = edit.factura
    ? edit.costoTotal
    : Math.round(edit.costoTotal * 1.19);

  const totalInterno =
    edit.cantidadComprada > 0 && edit.cantidadInterna > 0
      ? edit.cantidadComprada * edit.cantidadInterna
      : 0;

  const costoUnitario =
    totalInterno > 0
      ? costoConsiderado / totalInterno
      : edit.cantidadComprada > 0
      ? costoConsiderado / edit.cantidadComprada
      : 0;

  const precioSugerido =
    costoUnitario > 0 && edit.margenSugerido < 100
      ? redondearDecena(costoUnitario / (1 - edit.margenSugerido / 100))
      : 0;

  const margenResultante =
    edit.precioFinalEditado > 0 && costoUnitario > 0
      ? ((edit.precioFinalEditado - costoUnitario) / edit.precioFinalEditado) * 100
      : 0;

  const unidadLabel = totalInterno > 0 ? 'unidad' : 'formato';

  return { costoConsiderado, totalInterno, costoUnitario, precioSugerido, margenResultante, unidadLabel };
}

export default function Recepcion() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [orden, setOrden] = useState<OrdenCompra | null>(null);
  const [loading, setLoading] = useState(true);
  const [edits, setEdits] = useState<Record<string, DetalleRecepcion>>({});
  const [guardando, setGuardando] = useState(false);
  const [mostrarAgregar, setMostrarAgregar] = useState(false);
  const [nuevoItem, setNuevoItem] = useState({
    nombre: '',
    formato: 'Caja',
    cantidadComprada: 1,
    costoTotal: 0,
    factura: false,
  });

  useEffect(() => {
    fetchOrden();
  }, [id]);

  const fetchOrden = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/ordenes/${id}`);
      const o: OrdenCompra = res.data;
      setOrden(o);
      initEdits(o);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const initEdits = (o: OrdenCompra) => {
    const initial: Record<string, DetalleRecepcion> = {};
    o.detalles.forEach((d, index) => {
      const key = String(d.id ?? `idx_${index}`);
      initial[key] = {
        cantidadComprada: d.cantidadComprada ?? d.cantidadSolicitada,
        costoTotal: d.costoTotal ?? 0,
        factura: d.factura ?? false,
        cantidadInterna: d.cantidadInterna ?? 0,
        margenSugerido: d.margenSugerido ?? 40,
        precioFinalEditado: d.precioFinalEditado ?? 0,
      };
    });
    setEdits(initial);
  };

  const updateEdit = (key: string, field: keyof DetalleRecepcion, value: unknown) => {
    setEdits(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  };

  // Al cambiar el margen recalcula y pre-rellena precioFinalEditado si está vacío
  const handleMargenChange = (key: string, margen: number) => {
    setEdits(prev => {
      const newEdit = { ...prev[key], margenSugerido: margen };
      const { precioSugerido } = calcular(newEdit);
      return {
        ...prev,
        [key]: {
          ...newEdit,
          precioFinalEditado: prev[key]?.precioFinalEditado || precioSugerido,
        },
      };
    });
  };

  // Al cambiar datos de compra, si precioFinalEditado coincide con el sugerido anterior,
  // lo actualiza automáticamente al nuevo sugerido
  const handleDatoCompraChange = (key: string, field: keyof DetalleRecepcion, value: unknown) => {
    setEdits(prev => {
      const oldEdit = prev[key];
      const { precioSugerido: oldSugerido } = calcular(oldEdit);
      const newEdit = { ...oldEdit, [field]: value };
      const { precioSugerido: newSugerido } = calcular(newEdit);
      const precioFinalEditado =
        oldEdit.precioFinalEditado === 0 || oldEdit.precioFinalEditado === oldSugerido
          ? newSugerido
          : oldEdit.precioFinalEditado;
      return { ...prev, [key]: { ...newEdit, precioFinalEditado } };
    });
  };

  const agregarProducto = async () => {
    if (!nuevoItem.nombre.trim()) {
      alert('Ingresa el nombre del producto.');
      return;
    }
    try {
      await api.post(`/compras/ordenes/${id}/agregar-producto`, {
        producto: { nombre: nuevoItem.nombre },
        nombreProductoSnapshot: nuevoItem.nombre,
        formato: nuevoItem.formato,
        cantidadSolicitada: nuevoItem.cantidadComprada,
        cantidadComprada: nuevoItem.cantidadComprada,
        costoTotal: nuevoItem.costoTotal,
        factura: nuevoItem.factura,
        estadoProducto: 'COMPRADO',
        agregadoEnMercado: true,
      });
      const res = await api.get(`/ordenes/${id}`);
      const newOrden: OrdenCompra = res.data;
      setOrden(newOrden);
      setEdits(prevEdits => {
        const merged = { ...prevEdits };
        newOrden.detalles.forEach((d, index) => {
          const key = String(d.id ?? `idx_${index}`);
          if (!merged[key]) {
            merged[key] = {
              cantidadComprada: d.cantidadComprada ?? d.cantidadSolicitada,
              costoTotal: d.costoTotal ?? 0,
              factura: d.factura ?? false,
              cantidadInterna: d.cantidadInterna ?? 0,
              margenSugerido: d.margenSugerido ?? 40,
              precioFinalEditado: d.precioFinalEditado ?? 0,
            };
          }
        });
        return merged;
      });
      setNuevoItem({ nombre: '', formato: 'Caja', cantidadComprada: 1, costoTotal: 0, factura: false });
      setMostrarAgregar(false);
    } catch (err) {
      console.error('Error al agregar producto:', err);
      alert('Error al agregar el producto.');
    }
  };

  const cerrarRecepcion = async () => {
    if (
      !confirm(
        '¿Cerrar la recepción? Los precios y datos quedarán guardados. La orden pasará a estado Recibida.'
      )
    )
      return;

    setGuardando(true);
    try {
      if (orden?.detalles) {
        for (let i = 0; i < orden.detalles.length; i++) {
          const d = orden.detalles[i];
          const key = String(d.id ?? `idx_${i}`);
          const edit = edits[key];
          if (d.id !== undefined && edit) {
            const { costoUnitario, precioSugerido, margenResultante } = calcular(edit);
            await api.patch(`/recepcion/detalles/${d.id}`, {
              ...edit,
              costoUnitarioCalculado: Math.round(costoUnitario),
              precioSugerido,
              margenResultante: Math.round(margenResultante * 10) / 10,
            });
          }
        }
      }
      await api.patch(`/recepcion/ordenes/${id}/cerrar`, {});
      alert('Recepción cerrada. Orden marcada como Recibida.');
      navigate(`/ordenes/${id}`);
    } catch (err) {
      console.error(err);
      alert('Error al cerrar la recepción.');
    } finally {
      setGuardando(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando orden...</div>;
  if (!orden) return <div className="p-8 text-center text-red-500">Orden no encontrada.</div>;

  const totalGeneral = orden.detalles.reduce((s, d, i) => {
    const key = String(d.id ?? `idx_${i}`);
    return s + (edits[key]?.costoTotal ?? d.costoTotal ?? 0);
  }, 0);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(`/ordenes/${id}`)}
          className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex-grow">
          <h1 className="text-2xl font-bold text-gray-800">Recepción — Orden #{orden.id}</h1>
          <p className="text-sm text-gray-500">
            Revisa y corrige cantidades, costos y calcula precios de venta
          </p>
        </div>
        <span className="bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full text-sm font-semibold">
          Comprada
        </span>
      </div>

      {/* Resumen de orden */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-gray-500 text-xs uppercase font-medium mb-0.5">Fecha</p>
          <p className="font-medium">{orden.fechaCompraPlanificada}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs uppercase font-medium mb-0.5">Tipo</p>
          <p className="font-medium">{orden.tipoCompra}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs uppercase font-medium mb-0.5">Proveedor / Lugar</p>
          <p className="font-medium">{orden.proveedorNombre || orden.lugarCompra || '—'}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs uppercase font-medium mb-0.5">Total comprado</p>
          <p className="font-bold text-lg">${totalGeneral.toLocaleString('es-CL')}</p>
        </div>
      </div>

      {/* Cards por producto */}
      <div className="space-y-5">
        {orden.detalles.map((detalle, index) => {
          const key = String(detalle.id ?? `idx_${index}`);
          const edit: DetalleRecepcion = edits[key] ?? {
            cantidadComprada: detalle.cantidadSolicitada,
            costoTotal: 0,
            factura: false,
            cantidadInterna: 0,
            margenSugerido: 40,
            precioFinalEditado: 0,
          };

          const { costoConsiderado, totalInterno, costoUnitario, precioSugerido, margenResultante, unidadLabel } =
            calcular(edit);
          const tieneCalculo = costoUnitario > 0;

          const margenColor =
            margenResultante >= 35
              ? 'text-green-700'
              : margenResultante >= 20
              ? 'text-yellow-600'
              : 'text-red-600';

          const margenBg =
            margenResultante >= 35
              ? 'bg-green-50 border-green-200'
              : margenResultante >= 20
              ? 'bg-yellow-50 border-yellow-200'
              : 'bg-red-50 border-red-200';

          return (
            <div
              key={key}
              className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
            >
              {/* Encabezado del producto */}
              <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-800 text-base flex items-center flex-wrap gap-2">
                    {detalle.nombreProductoSnapshot || detalle.producto?.nombre}
                    {detalle.estadoProducto && ESTADO_LABEL[detalle.estadoProducto] && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${ESTADO_LABEL[detalle.estadoProducto].cls}`}>
                        {ESTADO_LABEL[detalle.estadoProducto].label}
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    <span className="bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded text-xs mr-2">
                      {detalle.formato}
                    </span>
                    Solicitado: {detalle.cantidadSolicitada}
                  </p>
                </div>
                {tieneCalculo && (
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Costo por {unidadLabel}</p>
                    <p className="text-2xl font-bold text-gray-800">
                      ${Math.round(costoUnitario).toLocaleString('es-CL')}
                    </p>
                  </div>
                )}
              </div>

              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Columna izquierda: Datos de compra */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                    Datos de Compra
                  </h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Formatos comprados
                      </label>
                      <input
                        type="number"
                        value={edit.cantidadComprada || ''}
                        onChange={e =>
                          handleDatoCompraChange(key, 'cantidadComprada', Number(e.target.value) || 0)
                        }
                        onFocus={e => e.target.select()}
                        min="0"
                        className="w-full p-2.5 border border-gray-300 rounded-lg text-center font-bold text-lg focus:ring-2 focus:ring-green-400 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Contenido por {detalle.formato || 'formato'}
                      </label>
                      <input
                        type="number"
                        value={edit.cantidadInterna || ''}
                        onChange={e =>
                          handleDatoCompraChange(key, 'cantidadInterna', Number(e.target.value) || 0)
                        }
                        onFocus={e => e.target.select()}
                        min="0"
                        placeholder="ej: 20 kg"
                        className="w-full p-2.5 border border-gray-300 rounded-lg text-center font-bold text-lg focus:ring-2 focus:ring-green-400 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Costo total ($)</label>
                    <input
                      type="number"
                      value={edit.costoTotal || ''}
                      onChange={e =>
                        handleDatoCompraChange(key, 'costoTotal', Number(e.target.value) || 0)
                      }
                      onFocus={e => e.target.select()}
                      min="0"
                      step="100"
                      className="w-full p-2.5 border border-gray-300 rounded-lg text-center font-bold text-lg focus:ring-2 focus:ring-green-400 outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDatoCompraChange(key, 'factura', !edit.factura)}
                    className={`w-full py-2.5 rounded-lg border-2 font-semibold text-sm flex items-center justify-center gap-2 transition-colors ${
                      edit.factura
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                    }`}
                  >
                    <CheckCircle size={15} />
                    {edit.factura ? 'Con Factura' : 'Sin Factura'}
                  </button>

                  {/* Resumen de costos calculados */}
                  {tieneCalculo && (
                    <div className="bg-gray-50 rounded-lg border border-gray-200 p-3 text-xs space-y-1.5">
                      {!edit.factura && (
                        <div className="flex justify-between text-orange-600">
                          <span>Costo considerado (×1,19)</span>
                          <strong>${costoConsiderado.toLocaleString('es-CL')}</strong>
                        </div>
                      )}
                      {totalInterno > 0 && (
                        <div className="flex justify-between text-gray-600">
                          <span>
                            {edit.cantidadComprada} formatos × {edit.cantidadInterna}
                          </span>
                          <strong>{totalInterno} unidades totales</strong>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-gray-800 border-t border-gray-200 pt-1.5">
                        <span>Costo por {unidadLabel}</span>
                        <span className="text-green-700">
                          ${Math.round(costoUnitario).toLocaleString('es-CL')}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Columna derecha: Precio de venta */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                    Precio de Venta
                  </h4>

                  {!tieneCalculo ? (
                    <div className="flex items-center justify-center h-40">
                      <p className="text-sm text-gray-400 text-center italic">
                        Completa los datos de compra
                        <br />
                        para calcular el precio sugerido.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Slider de margen */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs text-gray-500">Margen sugerido</label>
                          <span className="text-base font-bold text-gray-700">
                            {edit.margenSugerido}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="70"
                          step="1"
                          value={edit.margenSugerido}
                          onChange={e => handleMargenChange(key, Number(e.target.value))}
                          className="w-full accent-green-600"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                          <span>10%</span>
                          <span>40%</span>
                          <span>70%</span>
                        </div>
                      </div>

                      {/* Precio sugerido calculado */}
                      <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                        <p className="text-xs text-green-600 font-medium mb-0.5">Precio Sugerido</p>
                        <p className="text-3xl font-bold text-green-700">
                          ${precioSugerido.toLocaleString('es-CL')}
                        </p>
                        <p className="text-xs text-green-500 mt-0.5">
                          Redondeado hacia abajo a la decena
                        </p>
                      </div>

                      {/* Precio final editable */}
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Precio final de venta ($)
                        </label>
                        <input
                          type="number"
                          value={edit.precioFinalEditado || ''}
                          onChange={e =>
                            updateEdit(key, 'precioFinalEditado', Number(e.target.value) || 0)
                          }
                          onFocus={e => e.target.select()}
                          min="0"
                          step="10"
                          placeholder={`Sugerido: $${precioSugerido.toLocaleString('es-CL')}`}
                          className="w-full p-2.5 border border-gray-300 rounded-lg text-center text-xl font-bold focus:ring-2 focus:ring-green-400 outline-none"
                        />
                      </div>

                      {/* Margen resultante */}
                      {edit.precioFinalEditado > 0 && (
                        <div className={`rounded-xl p-3 text-center border ${margenBg}`}>
                          <p className="text-xs text-gray-500 mb-0.5">Margen resultante</p>
                          <p className={`text-2xl font-bold ${margenColor}`}>
                            {margenResultante.toFixed(1)}%
                          </p>
                          {margenResultante < 20 && (
                            <p className="text-xs text-red-500 mt-0.5">
                              Margen bajo — revisa el precio
                            </p>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Agregar producto olvidado */}
      <div className="mt-5">
        {!mostrarAgregar ? (
          <button
            onClick={() => setMostrarAgregar(true)}
            className="w-full py-4 border-2 border-dashed border-blue-300 text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={20} /> Agregar producto olvidado
          </button>
        ) : (
          <div className="bg-white rounded-xl border-2 border-blue-300 p-5 shadow-sm">
            <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
              <Plus size={18} className="text-blue-600" /> Agregar producto olvidado
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-4">
                <label className="block text-xs text-gray-500 mb-1">Nombre del producto</label>
                <input
                  type="text"
                  value={nuevoItem.nombre}
                  onChange={e => setNuevoItem(p => ({ ...p, nombre: e.target.value }))}
                  placeholder="Ej: Pimentón rojo"
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-500 mb-1">Formato</label>
                <select
                  value={nuevoItem.formato}
                  onChange={e => setNuevoItem(p => ({ ...p, formato: e.target.value }))}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                >
                  {FORMATOS_SUGERIDOS.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-500 mb-1">Cantidad comprada</label>
                <input
                  type="number"
                  value={nuevoItem.cantidadComprada || ''}
                  onChange={e => setNuevoItem(p => ({ ...p, cantidadComprada: Number(e.target.value) || 1 }))}
                  onFocus={e => e.target.select()}
                  min="1"
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-center font-semibold focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-500 mb-1">Costo total ($)</label>
                <input
                  type="number"
                  value={nuevoItem.costoTotal || ''}
                  onChange={e => setNuevoItem(p => ({ ...p, costoTotal: Number(e.target.value) || 0 }))}
                  onFocus={e => e.target.select()}
                  min="0"
                  step="100"
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-center font-semibold focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <button
                  type="button"
                  onClick={() => setNuevoItem(p => ({ ...p, factura: !p.factura }))}
                  className={`w-full p-2.5 rounded-lg border-2 font-semibold text-sm transition-colors ${
                    nuevoItem.factura
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  {nuevoItem.factura ? 'Con Factura' : 'Sin Factura'}
                </button>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={agregarProducto}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors"
              >
                <Plus size={16} /> Agregar
              </button>
              <button
                onClick={() => {
                  setMostrarAgregar(false);
                  setNuevoItem({ nombre: '', formato: 'Caja', cantidadComprada: 1, costoTotal: 0, factura: false });
                }}
                className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Botones footer */}
      <div className="mt-8 flex flex-col sm:flex-row justify-end gap-3">
        <button
          onClick={() => navigate(`/ordenes/${id}`)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold transition-colors"
        >
          <ArrowLeft size={18} /> Volver sin cerrar
        </button>
        <button
          onClick={cerrarRecepcion}
          disabled={guardando}
          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-bold disabled:opacity-50 transition-colors shadow-md"
        >
          <CheckCircle size={18} />
          {guardando ? 'Guardando...' : 'Cerrar Recepción'}
        </button>
      </div>
    </div>
  );
}
