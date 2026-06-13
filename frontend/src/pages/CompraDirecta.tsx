import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Producto, Proveedor, Usuario, TipoCompra, OrdenCompra } from '../types';
import { Trash2, CheckCircle, Receipt, ArrowLeft } from 'lucide-react';
import ProductoPicker from '../components/ProductoPicker';
import { getFormatos } from '../utils/formatos';
import { calcularPrecios } from '../utils/precios';

const TIPO_COMPRA_LABELS: Record<TipoCompra, string> = {
  MERCADO: 'Mercado',
  PROVEEDOR_LOCAL: 'Proveedor Local',
  INSUMO: 'Insumo',
  GASTO_OPERATIVO: 'Gasto Operativo',
};

interface ItemCompra {
  localId: number;
  producto: Producto;
  formato: string;
  cantidadComprada: number;
  cantidadInterna: number;
  costoTotal: number;
  factura: boolean;
  comentario: string;
  margenSugerido: number;
  precioFinalEditado: number;
}

export default function CompraDirecta() {
  const navigate = useNavigate();
  const [formatos] = useState<string[]>(getFormatos);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [guardando, setGuardando] = useState(false);

  const [cabecera, setCabecera] = useState({
    fechaCompraPlanificada: new Date().toISOString().split('T')[0],
    tipoCompra: 'PROVEEDOR_LOCAL' as TipoCompra,
    proveedorId: '' as number | '',
    compradorAsignadoId: '' as number | '',
    observaciones: '',
  });

  const [items, setItems] = useState<ItemCompra[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [resProductos, resProveedores, resUsuarios] = await Promise.allSettled([
        api.get('/productos'),
        api.get('/proveedores'),
        api.get('/usuarios'),
      ]);
      if (resProductos.status === 'fulfilled') setProductos(resProductos.value.data);
      if (resProveedores.status === 'fulfilled') setProveedores(resProveedores.value.data);
      if (resUsuarios.status === 'fulfilled')
        setUsuarios((resUsuarios.value.data as Usuario[]).filter(u => u.activo));
    };
    fetchData();
  }, []);

  const handleCabeceraChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setCabecera(prev => ({
      ...prev,
      [name]: name === 'proveedorId' || name === 'compradorAsignadoId'
        ? (value ? Number(value) : '')
        : value,
    }));
  };

  const agregarItem = (producto: Producto) => {
    setItems(prev => [
      ...prev,
      {
        localId: Date.now() + prev.length,
        producto,
        formato: producto.formatoHabitual || 'Caja',
        cantidadComprada: 1,
        cantidadInterna: 0,
        costoTotal: 0,
        factura: false,
        comentario: '',
        margenSugerido: producto.margenRecomendado ?? 40,
        precioFinalEditado: 0,
      },
    ]);
  };

  const eliminarItem = (localId: number) => {
    setItems(prev => prev.filter(it => it.localId !== localId));
  };

  const updateItem = (localId: number, campo: keyof ItemCompra, valor: unknown) => {
    setItems(prev =>
      prev.map(it => (it.localId === localId ? { ...it, [campo]: valor } : it))
    );
  };

  // Al cambiar el margen, prerellena el precio final con el sugerido si está vacío.
  const handleMargenChange = (localId: number, margen: number) => {
    setItems(prev =>
      prev.map(it => {
        if (it.localId !== localId) return it;
        const nuevo = { ...it, margenSugerido: margen };
        const { precioSugerido } = calcularPrecios(nuevo);
        return { ...nuevo, precioFinalEditado: it.precioFinalEditado || precioSugerido };
      })
    );
  };

  // Al cambiar datos de compra, si el precio final seguía al sugerido, lo reajusta.
  const handleDatoCompraChange = (localId: number, campo: keyof ItemCompra, valor: unknown) => {
    setItems(prev =>
      prev.map(it => {
        if (it.localId !== localId) return it;
        const { precioSugerido: viejoSugerido } = calcularPrecios(it);
        const nuevo = { ...it, [campo]: valor };
        const { precioSugerido: nuevoSugerido } = calcularPrecios(nuevo);
        const precioFinalEditado =
          it.precioFinalEditado === 0 || it.precioFinalEditado === viejoSugerido
            ? nuevoSugerido
            : it.precioFinalEditado;
        return { ...nuevo, precioFinalEditado };
      })
    );
  };

  const totalGeneral = items.reduce((s, it) => s + (it.costoTotal || 0), 0);

  const guardarCompra = async () => {
    if (items.length === 0) {
      alert('Agrega al menos un producto a la compra.');
      return;
    }
    const incompleto = items.find(it => it.cantidadComprada <= 0 || it.costoTotal <= 0);
    if (incompleto) {
      alert(`Completa cantidad y costo de "${incompleto.producto.nombre}".`);
      return;
    }

    const proveedor = cabecera.proveedorId
      ? proveedores.find(p => p.id === cabecera.proveedorId)
      : undefined;
    const encargado = cabecera.compradorAsignadoId
      ? usuarios.find(u => u.id === cabecera.compradorAsignadoId)
      : undefined;

    const payload: Partial<OrdenCompra> = {
      fechaCompraPlanificada: cabecera.fechaCompraPlanificada,
      fechaCompraReal: new Date().toISOString(),
      tipoCompra: cabecera.tipoCompra,
      estado: 'RECIBIDA',
      proveedorId: cabecera.proveedorId || null,
      proveedorNombre: proveedor?.nombre ?? null,
      compradorAsignadoId: cabecera.compradorAsignadoId || null,
      compradorAsignadoNombre: encargado?.nombre ?? null,
      encargadoCompra: encargado?.nombre ?? '',
      observaciones: cabecera.observaciones || undefined,
      total: totalGeneral,
      detalles: items.map(it => {
        const c = calcularPrecios(it);
        return {
          producto: it.producto.id
            ? { id: it.producto.id, nombre: it.producto.nombre }
            : { nombre: it.producto.nombre },
          nombreProductoSnapshot: it.producto.nombre,
          formato: it.formato,
          cantidadSolicitada: it.cantidadComprada,
          cantidadComprada: it.cantidadComprada,
          costoTotal: it.costoTotal,
          factura: it.factura,
          comentario: it.comentario.trim() || undefined,
          estadoProducto: 'COMPRADO',
          cantidadInterna: it.cantidadInterna || undefined,
          costoUnitarioCalculado: Math.round(c.costoUnitario),
          precioSugerido: c.precioSugerido,
          margenSugerido: it.margenSugerido,
          precioFinalEditado: it.precioFinalEditado || undefined,
          margenResultante: Math.round(c.margenResultante * 10) / 10,
          agregadoEnMercado: false,
        };
      }),
    };

    setGuardando(true);
    try {
      const res = await api.post('/ordenes', payload);
      alert('Compra registrada. Orden marcada como Recibida.');
      navigate(`/ordenes/${res.data.id}`);
    } catch (err) {
      console.error('Error al registrar la compra:', err);
      alert('Hubo un error al registrar la compra.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center gap-3 mb-1">
        <Receipt size={28} className="text-teal-600" />
        <h1 className="text-3xl font-bold text-gray-800">Compra Directa</h1>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Registra una compra ya realizada (sin orden previa). Queda lista con sus precios calculados.
      </p>

      <div className="space-y-6">
        {/* Cabecera */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Datos de la Compra</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Fecha</label>
              <input
                type="date"
                name="fechaCompraPlanificada"
                value={cabecera.fechaCompraPlanificada}
                onChange={handleCabeceraChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Tipo de Compra</label>
              <select
                name="tipoCompra"
                value={cabecera.tipoCompra}
                onChange={handleCabeceraChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
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
                value={cabecera.proveedorId}
                onChange={handleCabeceraChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              >
                <option value="">Sin proveedor</option>
                {proveedores.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Encargado <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <select
                name="compradorAsignadoId"
                value={cabecera.compradorAsignadoId}
                onChange={handleCabeceraChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              >
                <option value="">Sin asignar</option>
                {usuarios.map(u => (
                  <option key={u.id} value={u.id}>{u.nombre}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2 lg:col-span-4">
              <label className="block text-sm font-medium text-gray-600 mb-1">Observaciones</label>
              <textarea
                name="observaciones"
                value={cabecera.observaciones}
                onChange={handleCabeceraChange}
                rows={2}
                placeholder="Notas generales de esta compra..."
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>
        </div>

        {/* Agregar producto */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-700 mb-3">Productos Comprados</h2>
          <div className="max-w-md">
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Agregar producto a la compra
            </label>
            <ProductoPicker
              productos={productos}
              seleccionado={undefined}
              onSelect={agregarItem}
              onClear={() => {}}
              onCreado={p => {
                setProductos(prev => [...prev, p].sort((a, b) => a.nombre.localeCompare(b.nombre)));
              }}
            />
            <p className="text-xs text-gray-400 mt-1">
              Busca y selecciona un producto: se agregará una tarjeta para completar sus datos.
            </p>
          </div>
        </div>

        {/* Tarjetas por producto */}
        {items.length === 0 ? (
          <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-10 text-center text-gray-400 italic">
            Aún no agregaste productos. Usa el buscador de arriba para empezar.
          </div>
        ) : (
          <div className="space-y-5">
            {items.map(it => {
              const { costoConsiderado, totalInterno, costoUnitario, precioSugerido, margenResultante, unidadLabel } =
                calcularPrecios(it);
              const tieneCalculo = costoUnitario > 0;

              const margenColor =
                margenResultante >= 35 ? 'text-green-700'
                : margenResultante >= 20 ? 'text-yellow-600'
                : 'text-red-600';
              const margenBg =
                margenResultante >= 35 ? 'bg-green-50 border-green-200'
                : margenResultante >= 20 ? 'bg-yellow-50 border-yellow-200'
                : 'bg-red-50 border-red-200';

              return (
                <div key={it.localId} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  {/* Encabezado */}
                  <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-gray-800 text-base">{it.producto.nombre}</h3>
                      {tieneCalculo && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          Costo por {unidadLabel}:{' '}
                          <strong className="text-gray-700">
                            ${Math.round(costoUnitario).toLocaleString('es-CL')}
                          </strong>
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => eliminarItem(it.localId)}
                      className="text-red-400 hover:text-red-600"
                      title="Quitar producto"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Datos de compra */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Datos de Compra</h4>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Formato</label>
                          <select
                            value={it.formato}
                            onChange={e => updateItem(it.localId, 'formato', e.target.value)}
                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 outline-none"
                          >
                            {formatos.map(f => (
                              <option key={f} value={f}>{f}</option>
                            ))}
                            {!formatos.includes(it.formato) && (
                              <option value={it.formato}>{it.formato}</option>
                            )}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Formatos comprados</label>
                          <input
                            type="number"
                            value={it.cantidadComprada || ''}
                            onChange={e => handleDatoCompraChange(it.localId, 'cantidadComprada', Number(e.target.value) || 0)}
                            onFocus={e => e.target.select()}
                            min="0"
                            className="w-full p-2.5 border border-gray-300 rounded-lg text-center font-bold text-lg focus:ring-2 focus:ring-green-400 outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Contenido por {it.formato}</label>
                          <input
                            type="number"
                            value={it.cantidadInterna || ''}
                            onChange={e => handleDatoCompraChange(it.localId, 'cantidadInterna', Number(e.target.value) || 0)}
                            onFocus={e => e.target.select()}
                            min="0"
                            placeholder="ej: 20 kg"
                            className="w-full p-2.5 border border-gray-300 rounded-lg text-center font-bold text-lg focus:ring-2 focus:ring-green-400 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Costo total ($)</label>
                          <input
                            type="number"
                            value={it.costoTotal || ''}
                            onChange={e => handleDatoCompraChange(it.localId, 'costoTotal', Number(e.target.value) || 0)}
                            onFocus={e => e.target.select()}
                            min="0"
                            step="100"
                            className="w-full p-2.5 border border-gray-300 rounded-lg text-center font-bold text-lg focus:ring-2 focus:ring-green-400 outline-none"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDatoCompraChange(it.localId, 'factura', !it.factura)}
                        className={`w-full py-2.5 rounded-lg border-2 font-semibold text-sm flex items-center justify-center gap-2 transition-colors ${
                          it.factura
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                        }`}
                      >
                        <CheckCircle size={15} />
                        {it.factura ? 'Con Factura' : 'Sin Factura'}
                      </button>

                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Comentario <span className="text-gray-400">(opcional)</span>
                        </label>
                        <input
                          type="text"
                          value={it.comentario}
                          onChange={e => updateItem(it.localId, 'comentario', e.target.value)}
                          placeholder="Ej: calidad buena, oferta..."
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 outline-none"
                        />
                      </div>

                      {tieneCalculo && (
                        <div className="bg-gray-50 rounded-lg border border-gray-200 p-3 text-xs space-y-1.5">
                          {!it.factura && (
                            <div className="flex justify-between text-orange-600">
                              <span>Costo considerado (×1,19)</span>
                              <strong>${costoConsiderado.toLocaleString('es-CL')}</strong>
                            </div>
                          )}
                          {totalInterno > 0 && (
                            <div className="flex justify-between text-gray-600">
                              <span>{it.cantidadComprada} formatos × {it.cantidadInterna}</span>
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

                    {/* Precio de venta */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Precio de Venta</h4>

                      {!tieneCalculo ? (
                        <div className="flex items-center justify-center h-40">
                          <p className="text-sm text-gray-400 text-center italic">
                            Completa cantidad y costo
                            <br />
                            para calcular el precio sugerido.
                          </p>
                        </div>
                      ) : (
                        <>
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-xs text-gray-500">Margen sugerido</label>
                              <span className="text-base font-bold text-gray-700">{it.margenSugerido}%</span>
                            </div>
                            <input
                              type="range"
                              min="10"
                              max="70"
                              step="1"
                              value={it.margenSugerido}
                              onChange={e => handleMargenChange(it.localId, Number(e.target.value))}
                              className="w-full accent-green-600"
                            />
                            <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                              <span>10%</span>
                              <span>40%</span>
                              <span>70%</span>
                            </div>
                          </div>

                          <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                            <p className="text-xs text-green-600 font-medium mb-0.5">Precio Sugerido</p>
                            <p className="text-3xl font-bold text-green-700">
                              ${precioSugerido.toLocaleString('es-CL')}
                            </p>
                            <p className="text-xs text-green-500 mt-0.5">Redondeado hacia abajo a la decena</p>
                          </div>

                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Precio final de venta ($)</label>
                            <input
                              type="number"
                              value={it.precioFinalEditado || ''}
                              onChange={e => updateItem(it.localId, 'precioFinalEditado', Number(e.target.value) || 0)}
                              onFocus={e => e.target.select()}
                              min="0"
                              step="10"
                              placeholder={`Sugerido: $${precioSugerido.toLocaleString('es-CL')}`}
                              className="w-full p-2.5 border border-gray-300 rounded-lg text-center text-xl font-bold focus:ring-2 focus:ring-green-400 outline-none"
                            />
                          </div>

                          {it.precioFinalEditado > 0 && (
                            <div className={`rounded-xl p-3 text-center border ${margenBg}`}>
                              <p className="text-xs text-gray-500 mb-0.5">Margen resultante</p>
                              <p className={`text-2xl font-bold ${margenColor}`}>{margenResultante.toFixed(1)}%</p>
                              {margenResultante < 20 && (
                                <p className="text-xs text-red-500 mt-0.5">Margen bajo — revisa el precio</p>
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
        )}

        {/* Total */}
        {items.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between">
            <span className="text-gray-600 font-medium">
              {items.length} producto{items.length !== 1 ? 's' : ''}
            </span>
            <span className="text-lg">
              Total compra:{' '}
              <strong className="text-gray-800">${totalGeneral.toLocaleString('es-CL')}</strong>
            </span>
          </div>
        )}

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/ordenes')}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold transition-colors"
          >
            <ArrowLeft size={18} /> Cancelar
          </button>
          <button
            type="button"
            onClick={guardarCompra}
            disabled={guardando || items.length === 0}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors shadow-md"
          >
            <CheckCircle size={20} /> {guardando ? 'Guardando...' : 'Registrar Compra'}
          </button>
        </div>
      </div>
    </div>
  );
}
