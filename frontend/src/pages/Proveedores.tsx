import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Proveedor, FormaPago } from '../types';
import { Truck, PlusCircle, X, Check, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const FORMA_PAGO_LABELS: Record<FormaPago, string> = {
  EFECTIVO: 'Efectivo',
  TRANSFERENCIA: 'Transferencia',
  TARJETA: 'Tarjeta',
  CREDITO: 'Crédito',
  PAGO_POSTERIOR: 'Pago posterior',
};

const FORMAS_PAGO: FormaPago[] = ['EFECTIVO', 'TRANSFERENCIA', 'TARJETA', 'CREDITO', 'PAGO_POSTERIOR'];

const formVacio = (): Omit<Proveedor, 'id' | 'activo'> => ({
  nombre: '',
  rut: '',
  telefono: '',
  direccion: '',
  formaPagoHabitual: undefined,
});

export default function Proveedores() {
  const { user } = useAuth();
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState(formVacio());
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProveedores();
  }, []);

  const fetchProveedores = async () => {
    try {
      setLoading(true);
      const res = await api.get('/proveedores');
      setProveedores(res.data);
    } catch {
      setError('Error al cargar proveedores.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value || undefined }));
  };

  const guardar = async () => {
    if (!form.nombre.trim()) {
      setError('El nombre del proveedor es obligatorio.');
      return;
    }
    setError('');
    setGuardando(true);
    try {
      if (editandoId !== null) {
        const res = await api.put(`/proveedores/${editandoId}`, form);
        setProveedores(prev => prev.map(p => (p.id === editandoId ? res.data : p)));
        setEditandoId(null);
      } else {
        const res = await api.post('/proveedores', form);
        setProveedores(prev => [...prev, res.data].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      }
      setForm(formVacio());
      setMostrarForm(false);
    } catch {
      setError('Error al guardar el proveedor.');
    } finally {
      setGuardando(false);
    }
  };

  const iniciarEdicion = (p: Proveedor) => {
    setEditandoId(p.id!);
    setForm({
      nombre: p.nombre,
      rut: p.rut ?? '',
      telefono: p.telefono ?? '',
      direccion: p.direccion ?? '',
      formaPagoHabitual: p.formaPagoHabitual,
    });
    setMostrarForm(true);
    setError('');
  };

  const cancelar = () => {
    setForm(formVacio());
    setEditandoId(null);
    setMostrarForm(false);
    setError('');
  };

  const desactivar = async (p: Proveedor) => {
    if (!confirm(`¿Eliminar proveedor "${p.nombre}"? Quedará inactivo.`)) return;
    try {
      await api.patch(`/proveedores/${p.id}/desactivar`);
      setProveedores(prev => prev.filter(x => x.id !== p.id));
    } catch {
      alert('Error al eliminar el proveedor.');
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Truck size={26} className="text-green-700" />
          <h1 className="text-3xl font-bold text-gray-800">Proveedores</h1>
        </div>
        {!mostrarForm && (
          <button
            onClick={() => { setMostrarForm(true); setEditandoId(null); setForm(formVacio()); setError(''); }}
            className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white font-semibold px-4 py-2.5 rounded-lg shadow transition"
          >
            <PlusCircle size={18} /> Nuevo Proveedor
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Formulario */}
      {mostrarForm && (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-700">
              {editandoId ? 'Editar Proveedor' : 'Nuevo Proveedor'}
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
                placeholder="Ej: Frutas Don Pedro"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">RUT</label>
              <input
                type="text"
                name="rut"
                value={form.rut ?? ''}
                onChange={handleChange}
                placeholder="Ej: 12.345.678-9"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Teléfono</label>
              <input
                type="text"
                name="telefono"
                value={form.telefono ?? ''}
                onChange={handleChange}
                placeholder="Ej: +56 9 1234 5678"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Dirección</label>
              <input
                type="text"
                name="direccion"
                value={form.direccion ?? ''}
                onChange={handleChange}
                placeholder="Ej: Galpón 5, Lo Valledor"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Forma de pago habitual</label>
              <select
                name="formaPagoHabitual"
                value={form.formaPagoHabitual ?? ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              >
                <option value="">Sin definir</option>
                {FORMAS_PAGO.map(f => (
                  <option key={f} value={f}>{FORMA_PAGO_LABELS[f]}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button
              onClick={guardar}
              disabled={guardando}
              className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white font-semibold px-5 py-2 rounded-lg transition disabled:opacity-60"
            >
              <Check size={16} /> {guardando ? 'Guardando...' : editandoId ? 'Guardar Cambios' : 'Crear Proveedor'}
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

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-gray-400">Cargando proveedores...</p>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nombre</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">RUT</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Teléfono</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Dirección</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Pago habitual</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {proveedores.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400">No hay proveedores registrados.</td>
                </tr>
              ) : (
                proveedores.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-medium text-gray-800">{p.nombre}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 font-mono">{p.rut || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{p.telefono || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{p.direccion || '—'}</td>
                    <td className="px-4 py-3">
                      {p.formaPagoHabitual ? (
                        <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded text-xs font-semibold">
                          {FORMA_PAGO_LABELS[p.formaPagoHabitual]}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
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
