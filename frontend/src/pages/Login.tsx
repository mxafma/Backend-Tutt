import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { LogIn, ShoppingBasket } from 'lucide-react';
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
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'linear-gradient(135deg, #eaf5c2 0%, #d4e89a 50%, #c8e07a 100%)',
      }}
    >
      <div className="w-full max-w-sm">
        {/* Branding */}
        <div className="text-center mb-6 select-none">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 shadow-lg"
            style={{ background: '#2a7a2e' }}
          >
            <ShoppingBasket size={32} className="text-white" />
          </div>

          {/* Logo TuttiFruty */}
          <h1 className="text-4xl font-extrabold leading-none tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
            <span style={{ color: '#f5921d' }}>Tutti</span>
            <span style={{ color: '#2a7a2e' }}>fruty</span>
          </h1>
          <p className="text-sm mt-1.5" style={{ color: '#3a6e3e' }}>
            Sistema de Gestión de Compras
          </p>
        </div>

        {/* Card */}
        <div className="card bg-base-100 shadow-2xl">
          <div className="card-body gap-4">
            <h2 className="text-lg font-semibold text-base-content/80">Iniciar sesión</h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div className="form-control">
                <label className="label py-0.5">
                  <span className="label-text font-medium">Usuario</span>
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  autoComplete="username"
                  autoFocus
                  placeholder="Ingresa tu usuario"
                  className="input input-bordered w-full focus:outline-none"
                  style={{ '--tw-ring-color': '#2a7a2e' } as React.CSSProperties}
                />
              </div>

              <div className="form-control">
                <label className="label py-0.5">
                  <span className="label-text font-medium">Contraseña</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="Ingresa tu contraseña"
                  className="input input-bordered w-full focus:outline-none"
                />
              </div>

              {error && (
                <div role="alert" className="alert alert-error py-2.5 text-sm">
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn w-full gap-2 mt-1 text-white border-0"
                style={{ background: loading ? '#4db520' : '#2a7a2e' }}
              >
                {loading ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  <LogIn size={18} />
                )}
                {loading ? 'Ingresando...' : 'Ingresar'}
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-xs mt-5" style={{ color: '#5a7e3a' }}>
          &copy; {new Date().getFullYear()} GestionOC — TuttiFruty
        </p>
      </div>
    </div>
  );
}
