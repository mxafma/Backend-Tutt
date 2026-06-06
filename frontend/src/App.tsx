import { Routes, Route, Link, Navigate } from 'react-router-dom';
import {
  ShoppingCart, PackageOpen, LayoutDashboard,
  PlusCircle, ClipboardList, ShieldCheck, LogOut, User,
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Productos from './pages/Productos';
import Ordenes from './pages/Ordenes';
import CrearOrden from './pages/CrearOrden';
import OrdenDetalle from './pages/OrdenDetalle';
import EditarOrden from './pages/EditarOrden';
import ModoCompra from './pages/ModoCompra';
import Recepcion from './pages/Recepcion';
import Admin from './pages/Admin';

const ROL_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  CREADOR_OC: 'Creador OC',
  COMPRADOR: 'Comprador',
  RECEPCION: 'Recepción',
};

function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-green-700 text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="font-bold text-xl flex items-center gap-2 shrink-0">
          <ShoppingCart size={22} /> GestionOC
        </Link>

        {/* Links principales */}
        <ul className="flex gap-1 flex-wrap items-center flex-grow">
          <li>
            <Link to="/" className="hover:bg-green-600 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition">
              <LayoutDashboard size={16} /> Dashboard
            </Link>
          </li>
          <li>
            <Link to="/productos" className="hover:bg-green-600 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition">
              <PackageOpen size={16} /> Productos
            </Link>
          </li>
          <li>
            <Link to="/ordenes" className="hover:bg-green-600 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition">
              <ClipboardList size={16} /> Órdenes
            </Link>
          </li>
          {(user?.rol === 'ADMIN' || user?.rol === 'CREADOR_OC') && (
            <li>
              <Link
                to="/ordenes/nueva"
                className="hover:bg-green-600 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition"
              >
                <PlusCircle size={16} /> Nueva Orden
              </Link>
            </li>
          )}
          {user?.rol === 'ADMIN' && (
            <li>
              <Link
                to="/admin"
                className="hover:bg-green-600 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition"
              >
                <ShieldCheck size={16} /> Admin
              </Link>
            </li>
          )}
        </ul>

        {/* Usuario y logout */}
        {user && (
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold leading-tight">{user.nombre}</p>
              <p className="text-xs text-green-200">{ROL_LABELS[user.rol] ?? user.rol}</p>
            </div>
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
              <User size={16} />
            </div>
            <button
              onClick={logout}
              title="Cerrar sesión"
              className="flex items-center gap-1.5 hover:bg-green-600 px-2 py-1.5 rounded-md text-sm transition"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

function AppShell() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-grow container mx-auto p-4 mt-4">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/productos" element={<Productos />} />
          <Route path="/ordenes" element={<Ordenes />} />
          <Route
            path="/ordenes/nueva"
            element={
              <ProtectedRoute roles={['ADMIN', 'CREADOR_OC']}>
                <CrearOrden />
              </ProtectedRoute>
            }
          />
          <Route path="/ordenes/:id" element={<OrdenDetalle />} />
          <Route path="/ordenes/:id/editar" element={<EditarOrden />} />
          <Route path="/compra/:id" element={<ModoCompra />} />
          <Route path="/recepcion/:id" element={<Recepcion />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <Admin />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="bg-gray-800 text-white text-center p-4 text-sm">
        &copy; {new Date().getFullYear()} — MVP Verdulería
      </footer>
    </div>
  );
}

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="*"
        element={isAuthenticated ? <AppShell /> : <Navigate to="/login" replace />}
      />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
