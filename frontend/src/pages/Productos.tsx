import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Producto } from '../types';
import { PackageOpen, PlusCircle, X, Check, Pencil, Trash2, History, Settings2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getFormatos, saveFormatos, DEFAULT_FORMATOS } from '../utils/formatos';

// lista cargada/gestionada desde utils/formatos

const formVacio = (): Omit<Producto, 'id'> => ({
  nombre: '',
  descripcion: '',
  formatoHabitual: 'Caja',
  margenRecomendado: 40,
  activo: true,
});

export default function Productos() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formatos, setFormatos] = useState<string[]>(getFormatos);
  const [mostrarFormatos, setMostrarFormatos] = useState(false);
  const [nuevoFormato, setNuevoFormato] = useState('');
  const nuevoFormatoRef = useRef<HTMLInputElement>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState(formVacio());
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    fetchProductos();
  }, []);

  const fetchProductos = async () => {
    try {
      setLoading(true);
      const res = await api.get('/productos');
      setProductos(res.data.filter((p: Producto) => p.activo !== false));
    } catch (err: any) {
      setError(err.message || 'Error al cargar los productos');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === 'margenRecomendado' ? Number(value) : value,
    }));
  };

  const guardar = async () => {
    if (!form.nombre.trim()) {
      alert('El nombre del producto es obligatorio.');
      return;
    }
    setGuardando(true);
    try {
      if (editandoId !== null) {
        const res = await api.put(`/productos/${editandoId}`, form);
        setProductos(prev => prev.map(p => (p.id === editandoId ? res.data : p)));
        setEditandoId(null);
      } else {
        const res = await api.post('/productos', form);
        setProductos(prev => [...prev, res.data].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      }
      setForm(formVacio());
      setMostrarForm(false);
    } catch {
      alert('Error al guardar el producto.');
    } finally {
      setGuardando(false);
    }
  };

  const iniciarEdicion = (p: Producto) => {
    setEditandoId(p.id!);
    setForm({
      nombre: p.nombre,
      descripcion: p.descripcion ?? '',
      formatoHabitual: p.formatoHabitual ?? 'Caja',
      margenRecomendado: p.margenRecomendado ?? 40,
      activo: p.activo ?? true,
    });
    setMostrarForm(true);
  };

  const cancelar = () => {
    setForm(formVacio());
    setEditandoId(null);
    setMostrarForm(false);
  };

  const agregarFormato = () => {
    const val = nuevoFormato.trim();
    if (!val || formatos.includes(val)) return;
    const updated = [...formatos, val];
    saveFormatos(updated);
    setFormatos(updated);
    setNuevoFormato('');
    nuevoFormatoRef.current?.focus();
  };

  const eliminarFormato = (f: string) => {
    const updated = formatos.filter(x => x !== f);
    saveFormatos(updated);
    setFormatos(updated);
  };

  const resetFormatos = () => {
    saveFormatos(DEFAULT_FORMATOS);
    setFormatos([...DEFAULT_FORMATOS]);
  };

  const desactivar = async (p: Producto) => {
    if (!confirm(`¿Eliminar "${p.nombre}"? El producto quedará inactivo.`)) return;
    try {
      await api.patch(`/productos/${p.id}/desactivar`);
      setProductos(prev => prev.filter(x => x.id !== p.id));
    } catch {
      alert('Error al eliminar el producto.');
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <PackageOpen size={26} className="text-green-700" />
          <h1 className="text-3xl font-bold text-gray-800">Gestión de Productos</h1>
        </div>
        {!mostrarForm && (
          <button
            onClick={() => { setMostrarForm(true); setEditandoId(null); setForm(formVacio()); }}
            className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white font-semibold px-4 py-2.5 rounded-lg shadow transition"
          >
            <PlusCircle size={18} /> Nuevo Producto
          </button>
        )}
      </div>

      {/* Formulario */}
      {mostrarForm && (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-700">
              {editandoId ? 'Editar Producto' : 'Nuevo Producto'}
            </h2>
            <button onClick={cancelar}>
              <X size={20} className="text-gray-400 hover:text-gray-600" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Nombre *</label>
              <input
                type="text"
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                placeholder="Ej: Tomate Primera"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Descripción</label>
              <input
                type="text"
                name="descripcion"
                value={form.descripcion}
                onChange={handleChange}
                placeholder="Opcional"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Formato Habitual</label>
              <select
                name="formatoHabitual"
                value={form.formatoHabitual}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              >
                {formatos.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Margen Recomendado (%) — sobre precio de venta
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  name="margenRecomendado"
                  min={10}
                  max={70}
                  value={form.margenRecomendado}
                  onChange={handleChange}
                  className="flex-grow accent-green-600"
                />
                <span className="font-bold text-green-700 w-12 text-right">
                  {form.margenRecomendado}%
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button
              onClick={guardar}
              disabled={guardando}
              className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white font-semibold px-5 py-2 rounded-lg transition disabled:opacity-60"
            >
              <Check size={16} /> {guardando ? 'Guardando...' : editandoId ? 'Guardar Cambios' : 'Crear Producto'}
            </button>
            <button
              onClick={cancelar}
              className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Panel de formatos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-4">
        <button
          onClick={() => setMostrarFormatos(v => !v)}
          className="w-full flex items-center justify-between px-5 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition rounded-xl"
        >
          <span className="flex items-center gap-2"><Settings2 size={15} /> Formatos disponibles</span>
          <span className="text-gray-400 text-xs">{mostrarFormatos ? '▲ cerrar' : '▼ ver/editar'}</span>
        </button>
        {mostrarFormatos && (
          <div className="px-5 pb-4 border-t border-gray-100">
            <div className="flex flex-wrap gap-2 mt-3 mb-3">
              {formatos.map(f => (
                <span key={f} className="flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                  {f}
                  <button onClick={() => eliminarFormato(f)} className="text-gray-400 hover:text-red-500 ml-1">
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2 items-center">
              <input
                ref={nuevoFormatoRef}
                type="text"
                value={nuevoFormato}
                onChange={e => setNuevoFormato(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && agregarFormato()}
                placeholder="Nuevo formato..."
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none w-44"
              />
              <button
                onClick={agregarFormato}
                className="flex items-center gap-1 bg-green-700 hover:bg-green-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
              >
                <PlusCircle size={13} /> Agregar
              </button>
              <button
                onClick={resetFormatos}
                className="text-xs text-gray-400 hover:text-gray-600 underline ml-2"
              >
                Restablecer
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-gray-400">Cargando productos...</p>
        ) : error ? (
          <p className="p-8 text-center text-red-500">{error}</p>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nombre</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Descripción</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Formato Hab.</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">Margen Rec.</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {productos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400">No hay productos registrados.</td>
                </tr>
              ) : (
                productos.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-medium text-gray-800">{p.nombre}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{p.descripcion || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded text-sm">
                        {p.formatoHabitual || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-sm font-semibold px-2.5 py-1 rounded-full ${
                        (p.margenRecomendado ?? 0) >= 40
                          ? 'bg-green-100 text-green-700'
                          : (p.margenRecomendado ?? 0) >= 25
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-600'
                      }`}>
                        {p.margenRecomendado ?? 40}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/productos/${p.id}/historial`)}
                          className="flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition"
                        >
                          <History size={13} /> Historial
                        </button>
                        <button
                          onClick={() => iniciarEdicion(p)}
                          className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition"
                        >
                          <Pencil size={13} /> Editar
                        </button>
                        {user?.rol === 'ADMIN' && (
                          <button
                            onClick={() => desactivar(p)}
                            className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition"
                          >
                            <Trash2 size={13} /> Eliminar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
