import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Usuario, Rol } from '../types';
import { UserPlus, ToggleLeft, ToggleRight, Pencil, X, Check, ShieldCheck } from 'lucide-react';

const ROL_LABELS: Record<Rol, string> = {
  ADMIN: 'Administrador',
  CREADOR_OC: 'Creador de OC',
  COMPRADOR: 'Comprador',
  RECEPCION: 'Recepción',
};

const ROL_COLORS: Record<Rol, string> = {
  ADMIN: 'bg-purple-100 text-purple-700',
  CREADOR_OC: 'bg-blue-100 text-blue-700',
  COMPRADOR: 'bg-green-100 text-green-700',
  RECEPCION: 'bg-orange-100 text-orange-700',
};

const ROLES: Rol[] = ['ADMIN', 'CREADOR_OC', 'COMPRADOR', 'RECEPCION'];

interface FormNuevo {
  nombre: string;
  email: string;
  rol: Rol;
  password: string;
  confirmarPassword: string;
}

interface FormEditar {
  nombre: string;
  rol: Rol;
  password: string;
}

const formNuevoVacio = (): FormNuevo => ({
  nombre: '',
  email: '',
  rol: 'COMPRADOR',
  password: '',
  confirmarPassword: '',
});

export default function Admin() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarFormNuevo, setMostrarFormNuevo] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [formNuevo, setFormNuevo] = useState<FormNuevo>(formNuevoVacio());
  const [formEditar, setFormEditar] = useState<FormEditar>({ nombre: '', rol: 'COMPRADOR', password: '' });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      const res = await api.get('/usuarios');
      setUsuarios(res.data);
    } catch {
      setError('Error al cargar usuarios.');
    } finally {
      setLoading(false);
    }
  };

  const crearUsuario = async () => {
    setError('');
    if (!formNuevo.nombre.trim() || !formNuevo.email.trim() || !formNuevo.password) {
      setError('Nombre, usuario y contraseña son obligatorios.');
      return;
    }
    if (formNuevo.password !== formNuevo.confirmarPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (formNuevo.password.length < 4) {
      setError('La contraseña debe tener al menos 4 caracteres.');
      return;
    }
    setGuardando(true);
    try {
      const res = await api.post('/usuarios', {
        nombre: formNuevo.nombre.trim(),
        email: formNuevo.email.trim(),
        rol: formNuevo.rol,
        password: formNuevo.password,
        activo: true,
      });
      setUsuarios(prev => [...prev, res.data]);
      setFormNuevo(formNuevoVacio());
      setMostrarFormNuevo(false);
    } catch {
      setError('Error al crear usuario.');
    } finally {
      setGuardando(false);
    }
  };

  const iniciarEdicion = (u: Usuario) => {
    setEditandoId(u.id!);
    setFormEditar({ nombre: u.nombre, rol: u.rol, password: '' });
    setError('');
  };

  const guardarEdicion = async (id: number) => {
    setError('');
    if (!formEditar.nombre.trim()) {
      setError('El nombre no puede estar vacío.');
      return;
    }
    if (formEditar.password && formEditar.password.length < 4) {
      setError('La contraseña debe tener al menos 4 caracteres.');
      return;
    }
    setGuardando(true);
    try {
      const payload: any = { nombre: formEditar.nombre.trim(), rol: formEditar.rol };
      if (formEditar.password) payload.password = formEditar.password;
      const res = await api.put(`/usuarios/${id}`, payload);
      setUsuarios(prev => prev.map(u => (u.id === id ? res.data : u)));
      setEditandoId(null);
    } catch {
      setError('Error al guardar cambios.');
    } finally {
      setGuardando(false);
    }
  };

  const toggleActivo = async (u: Usuario) => {
    const accion = u.activo ? 'desactivar' : 'activar';
    const confirmar = confirm(
      `¿${u.activo ? 'Desactivar' : 'Activar'} al usuario "${u.nombre}"?`
    );
    if (!confirmar) return;
    try {
      const res = await api.patch(`/usuarios/${u.id}/${accion}`, {});
      setUsuarios(prev => prev.map(x => (x.id === u.id ? res.data : x)));
    } catch {
      alert('Error al cambiar el estado del usuario.');
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ShieldCheck size={28} className="text-green-700" />
          <h1 className="text-3xl font-bold text-gray-800">Administración de Usuarios</h1>
        </div>
        <button
          onClick={() => { setMostrarFormNuevo(true); setEditandoId(null); setError(''); }}
          className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white font-semibold px-4 py-2.5 rounded-lg shadow transition"
        >
          <UserPlus size={18} /> Nuevo Usuario
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Formulario nuevo usuario */}
      {mostrarFormNuevo && (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-700">Crear Nuevo Usuario</h2>
            <button onClick={() => { setMostrarFormNuevo(false); setError(''); }}>
              <X size={20} className="text-gray-400 hover:text-gray-600" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Nombre completo *</label>
              <input
                type="text"
                value={formNuevo.nombre}
                onChange={e => setFormNuevo(p => ({ ...p, nombre: e.target.value }))}
                placeholder="Ej: Juan Pérez"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Usuario (login) *</label>
              <input
                type="text"
                value={formNuevo.email}
                onChange={e => setFormNuevo(p => ({ ...p, email: e.target.value }))}
                placeholder="Ej: juan o juan@empresa.cl"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Rol *</label>
              <select
                value={formNuevo.rol}
                onChange={e => setFormNuevo(p => ({ ...p, rol: e.target.value as Rol }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              >
                {ROLES.map(r => (
                  <option key={r} value={r}>{ROL_LABELS[r]}</option>
                ))}
              </select>
            </div>
            <div />
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Contraseña *</label>
              <input
                type="password"
                value={formNuevo.password}
                onChange={e => setFormNuevo(p => ({ ...p, password: e.target.value }))}
                placeholder="Mínimo 4 caracteres"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Confirmar contraseña *</label>
              <input
                type="password"
                value={formNuevo.confirmarPassword}
                onChange={e => setFormNuevo(p => ({ ...p, confirmarPassword: e.target.value }))}
                placeholder="Repite la contraseña"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button
              onClick={crearUsuario}
              disabled={guardando}
              className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white font-semibold px-5 py-2 rounded-lg transition disabled:opacity-60"
            >
              <Check size={16} /> {guardando ? 'Guardando...' : 'Crear Usuario'}
            </button>
            <button
              onClick={() => { setMostrarFormNuevo(false); setFormNuevo(formNuevoVacio()); setError(''); }}
              className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Tabla de usuarios */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-400">Cargando usuarios...</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600">Nombre</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600">Usuario</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600">Rol</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600 text-center">Estado</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {usuarios.map(u => (
                <tr key={u.id} className={`hover:bg-gray-50 transition ${!u.activo ? 'opacity-50' : ''}`}>
                  {editandoId === u.id ? (
                    /* Fila en modo edición */
                    <>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={formEditar.nombre}
                          onChange={e => setFormEditar(p => ({ ...p, nombre: e.target.value }))}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-green-500 outline-none"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{u.email}</td>
                      <td className="px-4 py-3">
                        <select
                          value={formEditar.rol}
                          onChange={e => setFormEditar(p => ({ ...p, rol: e.target.value as Rol }))}
                          className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-green-500 outline-none"
                        >
                          {ROLES.map(r => (
                            <option key={r} value={r}>{ROL_LABELS[r]}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="password"
                          value={formEditar.password}
                          onChange={e => setFormEditar(p => ({ ...p, password: e.target.value }))}
                          placeholder="Nueva contraseña (opcional)"
                          className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-green-500 outline-none"
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => guardarEdicion(u.id!)}
                            disabled={guardando}
                            className="flex items-center gap-1 bg-green-700 hover:bg-green-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                          >
                            <Check size={13} /> Guardar
                          </button>
                          <button
                            onClick={() => { setEditandoId(null); setError(''); }}
                            className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                          >
                            <X size={13} /> Cancelar
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    /* Fila normal */
                    <>
                      <td className="px-4 py-3 font-medium text-gray-800">{u.nombre}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 font-mono">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ROL_COLORS[u.rol]}`}>
                          {ROL_LABELS[u.rol]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          u.activo
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {u.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => iniciarEdicion(u)}
                            title="Editar"
                            className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition"
                          >
                            <Pencil size={13} /> Editar
                          </button>
                          <button
                            onClick={() => toggleActivo(u)}
                            title={u.activo ? 'Desactivar' : 'Activar'}
                            className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
                              u.activo
                                ? 'text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100'
                                : 'text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100'
                            }`}
                          >
                            {u.activo ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                            {u.activo ? 'Desactivar' : 'Activar'}
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-4">
        Los usuarios inactivos no pueden iniciar sesión. Solo el administrador puede gestionar usuarios.
      </p>
    </div>
  );
}
