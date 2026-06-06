import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { ShoppingCart, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('Ingresa tu usuario y contraseña.');
      return;
    }
    setLoading(true);
    try {
      await login(username.trim(), password);
      navigate('/', { replace: true });
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Usuario o contraseña incorrectos.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo / título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-700 rounded-full mb-4 shadow-lg">
            <ShoppingCart size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Sistema de Compras</h1>
          <p className="text-gray-500 text-sm mt-1">TuttiFruty</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl shadow-md p-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-6">Iniciar sesión</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Usuario
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
                placeholder="Ingresa tu usuario"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="Ingresa tu contraseña"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-green-700 hover:bg-green-800 text-white font-semibold py-3 rounded-lg shadow transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                'Ingresando...'
              ) : (
                <>
                  <LogIn size={18} /> Ingresar
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-400 text-xs mt-6">
          &copy; {new Date().getFullYear()} MVP GestionComrpas TuttiFruty
        </p>
      </div>
    </div>
  );
}
