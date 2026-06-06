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
    <div className="hero min-h-screen bg-base-200">
      <div className="hero-content flex-col w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-2">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4 shadow-lg">
            <ShoppingCart size={32} className="text-primary-content" />
          </div>
          <h1 className="text-3xl font-bold text-base-content">Sistema de Compras</h1>
          <p className="text-base-content/60 text-sm mt-1">TuttiFruty</p>
        </div>

        {/* Card */}
        <div className="card w-full shadow-2xl bg-base-100">
          <div className="card-body">
            <h2 className="card-title text-lg mb-2">Iniciar sesión</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Usuario</span>
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  autoComplete="username"
                  autoFocus
                  placeholder="Ingresa tu usuario"
                  className="input input-bordered w-full focus:input-primary"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Contraseña</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="Ingresa tu contraseña"
                  className="input input-bordered w-full focus:input-primary"
                />
              </div>

              {error && (
                <div role="alert" className="alert alert-error py-2.5 text-sm">
                  <span>{error}</span>
                </div>
              )}

              <div className="form-control mt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary w-full gap-2"
                >
                  {loading ? (
                    <span className="loading loading-spinner loading-sm" />
                  ) : (
                    <LogIn size={18} />
                  )}
                  {loading ? 'Ingresando...' : 'Ingresar'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <p className="text-base-content/40 text-xs mt-2">
          &copy; {new Date().getFullYear()} MVP GestionCompras TuttiFruty
        </p>
      </div>
    </div>
  );
}
