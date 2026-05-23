import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { OrdenCompra, EstadoProductoOrden } from '../types';
import { CheckCircle, Minus, Plus, ArrowLeft, ShoppingBag } from 'lucide-react';

const FORMATOS_SUGERIDOS = ['Caja', 'Malla', 'Saco', 'Bandeja', 'Unidad', 'Kilo', 'Paquete', 'Otro'];

interface DetalleEdit {
  cantidadComprada: number;
  costoTotal: number;
  factura: boolean;
  comentario: string;
  estadoProducto: EstadoProductoOrden;
  cantidadInterna: number;
  formato: string;
}

export default function ModoCompra() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [orden, setOrden] = useState<OrdenCompra | null>(null);
  const [loading, setLoading] = useState(true);
  const [edits, setEdits] = useState<Record<string, DetalleEdit>>({});
  const [mostrarAgregar, setMostrarAgregar] = useState(false);
  const [nuevoItem, setNuevoItem] = useState({
    nombre: '',
    formato: 'Caja',
    cantidadComprada: 1,
    costoTotal: 0,
    factura: false,
  });
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    fetchOrden();
  }, [id]);

  const fetchOrden = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/ordenes/${id}`);
      const o: OrdenCompra = res.data;

      if (o.estado === 'LISTA_PARA_COMPRAR') {
        await api.patch(`/compras/ordenes/${id}/iniciar`, {});
        const res2 = await api.get(`/ordenes/${id}`);
        setOrden(res2.data);
        initEdits(res2.data);
      } else {
        setOrden(o);
        initEdits(o);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const initEdits = (o: OrdenCompra) => {
    const initial: Record<string, DetalleEdit> = {};
    o.detalles.forEach((d, index) => {
      const key = String(d.id ?? `idx_${index}`);
      initial[key] = {
        cantidadComprada: d.cantidadComprada ?? d.cantidadSolicitada,
        costoTotal: d.costoTotal ?? 0,
        factura: d.factura ?? false,
        comentario: d.comentario ?? '',
        estadoProducto: d.estadoProducto ?? 'PENDIENTE',
        cantidadInterna: d.cantidadInterna ?? 0,
        formato: d.formato ?? 'Caja',
      };
    });
    setEdits(initial);
  };

  const updateEdit = (key: string, field: keyof DetalleEdit, value: unknown) => {
    setEdits(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  };

  const marcarEstado = (key: string, estado: EstadoProductoOrden) => {
    setEdits(prev => {
      const actual = prev[key]?.estadoProducto;
      const nuevo: EstadoProductoOrden = actual === estado ? 'PENDIENTE' : estado;
      return { ...prev, [key]: { ...prev[key], estadoProducto: nuevo } };
    });
  };

  const guardarDetalle = async (detalleId: number, key: string) => {
    const edit = edits[key];
    if (!edit) return;
    try {
      await api.patch(`/compras/detalles/${detalleId}`, edit);
    } catch (err) {
      console.error('Error al guardar detalle:', err);
    }
  };

  const agregarProductoMercado = async () => {
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
        estadoProducto: 'AGREGADO_EN_MERCADO',
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
              comentario: d.comentario ?? '',
              estadoProducto: d.estadoProducto ?? 'PENDIENTE',
              cantidadInterna: d.cantidadInterna ?? 0,
              formato: d.formato ?? 'Caja',
            };
          }
        });
        return merged;
      });
      setNuevoItem({ nombre: '', formato: 'Caja', cantidadComprada: 1, costoTotal: 0, factura: false });
      setMostrarAgregar(false);
    } catch (err) {
      console.error('Error al agregar producto:', err);
    }
  };

  const finalizarCompra = async () => {
    const pendientes = orden!.detalles.filter((d, i) => {
      const key = String(d.id ?? `idx_${i}`);
      return (edits[key]?.estadoProducto ?? 'PENDIENTE') === 'PENDIENTE';
    });

    if (pendientes.length > 0) {
      const lista = pendientes
        .map(d => `• ${d.nombreProductoSnapshot || d.producto?.nombre}`)
        .join('\n');
      const continuar = confirm(
        `Hay ${pendientes.length} producto(s) sin marcar estado:\n${lista}\n\n¿Deseas finalizar de todas formas?`
      );
      if (!continuar) return;
    }

    if (!confirm('¿Finalizar la compra? Se guardarán todos los datos ingresados.')) return;

    setGuardando(true);
    try {
      if (orden?.detalles) {
        for (let i = 0; i < orden.detalles.length; i++) {
          const d = orden.detalles[i];
          const key = String(d.id ?? `idx_${i}`);
          if (d.id !== undefined) {
            await guardarDetalle(d.id, key);
          }
        }
      }
      await api.patch(`/compras/ordenes/${id}/finalizar`, {});
      alert('¡Compra finalizada exitosamente!');
      navigate(`/ordenes/${id}`);
    } catch (err) {
      console.error(err);
      alert('Error al finalizar la compra.');
    } finally {
      setGuardando(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500 text-xl">Cargando orden...</div>
    );
  }
  if (!orden) {
    return <div className="p-8 text-center text-red-500">Orden no encontrada.</div>;
  }
  if (orden.estado === 'COMPRADA' || orden.estado === 'CERRADA') {
    return (
      <div className="p-8 text-center">
        <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-700 mb-2">Compra Finalizada</h2>
        <p className="text-gray-500 mb-4">Esta orden ya fue completada.</p>
        <button
          onClick={() => navigate(`/ordenes/${id}`)}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 font-semibold"
        >
          Ver Detalle de Orden
        </button>
      </div>
    );
  }

  const totalAcumulado = orden.detalles.reduce((sum, d, i) => {
    const key = String(d.id ?? `idx_${i}`);
    return sum + (edits[key]?.costoTotal ?? d.costoTotal ?? 0);
  }, 0);

  const productosListos = orden.detalles.filter((d, i) => {
    const key = String(d.id ?? `idx_${i}`);
    const estado = edits[key]?.estadoProducto;
    return estado && estado !== 'PENDIENTE';
  }).length;

  return (
    <div className="bg-gray-100 min-h-screen pb-28">
      {/* Header fijo */}
      <div className="bg-green-700 text-white p-4 sticky top-0 z-10 shadow-md">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <button
            onClick={() => navigate('/ordenes')}
            className="p-1 hover:bg-green-600 rounded-md transition-colors"
          >
            <ArrowLeft size={22} />
          </button>
          <div className="flex-grow min-w-0">
            <h1 className="font-bold text-lg leading-tight">
              Modo Compra — Orden #{orden.id}
            </h1>
            <p className="text-green-200 text-sm truncate">
              {orden.tipoCompra} · {orden.lugarCompra || orden.proveedorNombre || orden.fechaCompraPlanificada}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-green-200 text-xs">Total</p>
            <p className="font-bold text-lg">${totalAcumulado.toLocaleString('es-CL')}</p>
          </div>
        </div>
        {/* Barra de progreso */}
        <div className="max-w-2xl mx-auto mt-2">
          <div className="flex items-center justify-between text-xs text-green-200 mb-1">
            <span>{productosListos} de {orden.detalles.length} productos marcados</span>
          </div>
          <div className="w-full bg-green-800 rounded-full h-1.5">
            <div
              className="bg-white rounded-full h-1.5 transition-all"
              style={{
                width: orden.detalles.length > 0
                  ? `${(productosListos / orden.detalles.length) * 100}%`
                  : '0%',
              }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-3">

        {/* Cards de productos */}
        {orden.detalles.map((detalle, index) => {
          const key = String(detalle.id ?? `idx_${index}`);
          const edit: DetalleEdit = edits[key] ?? {
            cantidadComprada: detalle.cantidadSolicitada,
            costoTotal: 0,
            factura: false,
            comentario: '',
            estadoProducto: 'PENDIENTE',
            cantidadInterna: 0,
            formato: detalle.formato ?? 'Caja',
          };

          const borderColor = {
            COMPRADO:            'border-green-400',
            COMPRA_PARCIAL:      'border-orange-400',
            NO_COMPRADO:         'border-red-400',
            PENDIENTE:           'border-gray-200',
            AGREGADO_EN_MERCADO: 'border-blue-300',
          }[edit.estadoProducto] ?? 'border-gray-200';

          const bgColor = {
            COMPRADO:            'bg-green-50',
            COMPRA_PARCIAL:      'bg-orange-50',
            NO_COMPRADO:         'bg-red-50',
            PENDIENTE:           'bg-white',
            AGREGADO_EN_MERCADO: 'bg-blue-50',
          }[edit.estadoProducto] ?? 'bg-white';

          const costoConsiderado = !edit.factura && edit.costoTotal > 0
            ? Math.round(edit.costoTotal * 1.19)
            : edit.costoTotal;

          return (
            <div
              key={key}
              className={`rounded-xl border-2 shadow-sm p-4 transition-colors ${borderColor} ${bgColor}`}
            >
              {/* Encabezado del producto */}
              <div className="mb-3">
                <h3 className="font-bold text-gray-800 text-lg leading-tight">
                  {detalle.nombreProductoSnapshot || detalle.producto?.nombre}
                  {detalle.agregadoEnMercado && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium align-middle">
                      Del mercado
                    </span>
                  )}
                </h3>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <select
                    value={edit.formato}
                    onChange={e => updateEdit(key, 'formato', e.target.value)}
                    className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-xs font-medium border border-gray-200 focus:ring-1 focus:ring-green-400 outline-none"
                  >
                    {['Caja', 'Malla', 'Saco', 'Bandeja', 'Unidad', 'Kilo', 'Paquete'].map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                    {!['Caja', 'Malla', 'Saco', 'Bandeja', 'Unidad', 'Kilo', 'Paquete'].includes(edit.formato) && edit.formato && (
                      <option value={edit.formato}>{edit.formato}</option>
                    )}
                  </select>
                  {!detalle.agregadoEnMercado && (
                    <span className="text-gray-500 text-sm">
                      Solicitado: <strong className="text-gray-700">{detalle.cantidadSolicitada}</strong>
                    </span>
                  )}
                </div>
              </div>

              {/* Botones de estado */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {(
                  [
                    { estado: 'COMPRADO' as EstadoProductoOrden, label: 'Comprado', activeClass: 'bg-green-600 text-white shadow-md' },
                    { estado: 'COMPRA_PARCIAL' as EstadoProductoOrden, label: 'Parcial', activeClass: 'bg-orange-500 text-white shadow-md' },
                    { estado: 'NO_COMPRADO' as EstadoProductoOrden, label: 'No Comprado', activeClass: 'bg-red-500 text-white shadow-md' },
                  ] as const
                ).map(({ estado, label, activeClass }) => (
                  <button
                    key={estado}
                    onClick={() => marcarEstado(key, estado)}
                    className={`py-3 rounded-xl font-semibold text-sm transition-all ${
                      edit.estadoProducto === estado
                        ? activeClass
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Campos cuando NO es "No Comprado" */}
              {edit.estadoProducto !== 'NO_COMPRADO' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                        Cantidad Comprada
                      </label>
                      <input
                        type="number"
                        value={edit.cantidadComprada || ''}
                        onChange={e => updateEdit(key, 'cantidadComprada', Number(e.target.value) || 0)}
                        onFocus={e => e.target.select()}
                        min="0"
                        className="w-full p-3 border-2 border-gray-200 rounded-xl text-xl font-bold text-center focus:ring-2 focus:ring-green-400 focus:border-green-400 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                        Costo Total ($)
                      </label>
                      <input
                        type="number"
                        value={edit.costoTotal || ''}
                        onChange={e => updateEdit(key, 'costoTotal', Number(e.target.value) || 0)}
                        onFocus={e => e.target.select()}
                        min="0"
                        step="100"
                        className="w-full p-3 border-2 border-gray-200 rounded-xl text-xl font-bold text-center focus:ring-2 focus:ring-green-400 focus:border-green-400 outline-none"
                      />
                    </div>
                  </div>

                  {/* Factura */}
                  <button
                    type="button"
                    onClick={() => updateEdit(key, 'factura', !edit.factura)}
                    className={`w-full py-3 rounded-xl border-2 font-semibold text-sm flex items-center justify-center gap-2 transition-colors ${
                      edit.factura
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                    }`}
                  >
                    {edit.factura ? (
                      <><CheckCircle size={16} /> Con Factura</>
                    ) : (
                      <><Minus size={16} /> Sin Factura</>
                    )}
                  </button>

                  {/* Aviso de costo considerado cuando no hay factura */}
                  {!edit.factura && edit.costoTotal > 0 && (
                    <p className="text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
                      Sin factura: costo considerado ×1,19 ={' '}
                      <strong>${costoConsiderado.toLocaleString('es-CL')}</strong>
                    </p>
                  )}

                  {/* Contenido por formato */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                      Contenido por {detalle.formato || 'formato'}{' '}
                      <span className="font-normal normal-case text-gray-400">(kg, unidades — opcional)</span>
                    </label>
                    <input
                      type="number"
                      value={edit.cantidadInterna || ''}
                      onChange={e => updateEdit(key, 'cantidadInterna', Number(e.target.value) || 0)}
                      onFocus={e => e.target.select()}
                      min="0"
                      placeholder="Ej: 20 (kg por caja)"
                      className="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-400 focus:border-green-400 outline-none"
                    />
                  </div>

                  {/* Cálculo en tiempo real */}
                  {edit.cantidadInterna > 0 && edit.cantidadComprada > 0 && edit.costoTotal > 0 && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm space-y-1">
                      <div className="flex justify-between text-gray-600">
                        <span>Total interno</span>
                        <strong>
                          {edit.cantidadComprada} × {edit.cantidadInterna} ={' '}
                          {edit.cantidadComprada * edit.cantidadInterna}
                        </strong>
                      </div>
                      <div className="flex justify-between text-green-700 font-bold border-t border-gray-200 pt-1">
                        <span>Costo por unidad</span>
                        <span>
                          ${Math.round(
                            costoConsiderado / (edit.cantidadComprada * edit.cantidadInterna)
                          ).toLocaleString('es-CL')}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Comentario */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                      Comentario{' '}
                      {detalle.comentario && !detalle.agregadoEnMercado && (
                        <span className="text-amber-600 normal-case font-normal">← nota del creador</span>
                      )}
                      {' '}<span className="font-normal normal-case text-gray-400">(opcional)</span>
                    </label>
                    <input
                      type="text"
                      value={edit.comentario}
                      onChange={e => updateEdit(key, 'comentario', e.target.value)}
                      placeholder="Ej: Buena calidad, precio normal..."
                      className="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-400 focus:border-green-400 outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Campo motivo cuando es "No Comprado" */}
              {edit.estadoProducto === 'NO_COMPRADO' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                    Motivo <span className="font-normal normal-case text-gray-400">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={edit.comentario}
                    onChange={e => updateEdit(key, 'comentario', e.target.value)}
                    placeholder="Ej: No había, precio muy alto, agotado..."
                    className="w-full p-2.5 border border-red-200 rounded-xl text-sm focus:ring-2 focus:ring-red-300 outline-none"
                  />
                </div>
              )}
            </div>
          );
        })}

        {/* Sección agregar producto del mercado */}
        {!mostrarAgregar ? (
          <button
            onClick={() => setMostrarAgregar(true)}
            className="w-full py-4 border-2 border-dashed border-green-400 text-green-700 rounded-xl font-semibold hover:bg-green-50 transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={20} /> Agregar producto encontrado en el mercado
          </button>
        ) : (
          <div className="bg-white rounded-xl border-2 border-blue-300 p-4 shadow-sm">
            <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
              <Plus size={18} className="text-blue-600" /> Nuevo Producto del Mercado
            </h3>
            <div className="space-y-3">
              <input
                type="text"
                value={nuevoItem.nombre}
                onChange={e => setNuevoItem(p => ({ ...p, nombre: e.target.value }))}
                placeholder="Nombre del producto"
                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none"
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={nuevoItem.formato}
                  onChange={e => setNuevoItem(p => ({ ...p, formato: e.target.value }))}
                  className="p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none"
                >
                  {FORMATOS_SUGERIDOS.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
                <input
                  type="number"
                  value={nuevoItem.cantidadComprada || ''}
                  onChange={e => setNuevoItem(p => ({ ...p, cantidadComprada: Number(e.target.value) || 1 }))}
                  onFocus={e => e.target.select()}
                  min="1"
                  placeholder="Cantidad"
                  className="p-3 border-2 border-gray-200 rounded-xl text-center font-semibold focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>
              <input
                type="number"
                value={nuevoItem.costoTotal || ''}
                onChange={e => setNuevoItem(p => ({ ...p, costoTotal: Number(e.target.value) || 0 }))}
                onFocus={e => e.target.select()}
                min="0"
                step="100"
                placeholder="Costo total ($)"
                className="w-full p-3 border-2 border-gray-200 rounded-xl text-center font-semibold focus:ring-2 focus:ring-blue-400 outline-none"
              />
              <button
                type="button"
                onClick={() => setNuevoItem(p => ({ ...p, factura: !p.factura }))}
                className={`w-full py-3 rounded-xl border-2 font-semibold text-sm ${
                  nuevoItem.factura
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white border-gray-300 text-gray-600'
                }`}
              >
                {nuevoItem.factura ? '✓ Con Factura' : 'Sin Factura (toca para cambiar)'}
              </button>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={agregarProductoMercado}
                  className="py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
                >
                  Agregar
                </button>
                <button
                  onClick={() => setMostrarAgregar(false)}
                  className="py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer fijo — botón finalizar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={finalizarCompra}
            disabled={guardando}
            className="w-full py-4 bg-green-600 text-white rounded-xl font-bold text-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-md transition-colors"
          >
            {guardando ? (
              'Guardando...'
            ) : (
              <><ShoppingBag size={24} /> Finalizar Compra</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
