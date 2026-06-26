import { Routes, Route, Link, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  ShoppingCart, PackageOpen, LayoutDashboard,
  PlusCircle, ClipboardList, ShieldCheck, LogOut, User, Truck,
  Sun, Moon, ExternalLink, Receipt, BarChart3,
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
import CompraDirecta from './pages/CompraDirecta';
import Recepcion from './pages/Recepcion';
import Admin from './pages/Admin';
import FusionProductos from './pages/FusionProductos';
import Reportes from './pages/Reportes';
import Proveedores from './pages/Proveedores';
import HistorialProducto from './pages/HistorialProducto';

const ROL_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  CREADOR_OC: 'Creador OC',
  COMPRADOR: 'Comprador',
  RECEPCION: 'Recepción',
};

function Navbar() {
  const { user, logout } = useAuth();
  const [dark, setDark] = useState<boolean>(
    () => localStorage.getItem('gestionoc_theme') === 'dark'
  );

  useEffect(() => {
    document.documentElement.setAttribute(
      'data-theme',
      dark ? 'gestionoc-dark' : 'gestionoc'
    );
    localStorage.setItem('gestionoc_theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <div className="navbar bg-primary text-primary-content shadow-md px-4 min-h-[56px]">
      {/* Logo */}
      <div className="navbar-start">
        <Link to="/" className="btn btn-ghost normal-case text-lg font-bold gap-2 px-2">
          <ShoppingCart size={20} /> GestionOC
        </Link>
      </div>

      {/* Links centrales */}
      <div className="navbar-center hidden md:flex">
        <ul className="menu menu-horizontal gap-0.5 px-1 text-sm">
          <li>
            <Link to="/" className="gap-1.5 rounded-lg">
              <LayoutDashboard size={15} /> Dashboard
            </Link>
          </li>
          <li>
            <Link to="/productos" className="gap-1.5 rounded-lg">
              <PackageOpen size={15} /> Productos
            </Link>
          </li>
          <li>
            <Link to="/ordenes" className="gap-1.5 rounded-lg">
              <ClipboardList size={15} /> Órdenes
            </Link>
          </li>
          {(user?.rol === 'ADMIN' || user?.rol === 'CREADOR_OC') && (
            <li>
              <Link to="/ordenes/nueva" className="gap-1.5 rounded-lg">
                <PlusCircle size={15} /> Nueva Orden
              </Link>
            </li>
          )}
          {(user?.rol === 'ADMIN' || user?.rol === 'CREADOR_OC' || user?.rol === 'RECEPCION') && (
            <li>
              <Link to="/compra-directa" className="gap-1.5 rounded-lg">
                <Receipt size={15} /> Compra Directa
              </Link>
            </li>
          )}
          {(user?.rol === 'ADMIN' || user?.rol === 'CREADOR_OC') && (
            <li>
              <Link to="/proveedores" className="gap-1.5 rounded-lg">
                <Truck size={15} /> Proveedores
              </Link>
            </li>
          )}
          {user?.rol === 'ADMIN' && (
            <li>
              <Link to="/reportes" className="gap-1.5 rounded-lg">
                <BarChart3 size={15} /> Reportes
              </Link>
            </li>
          )}
          {user?.rol === 'ADMIN' && (
            <li>
              <Link to="/admin" className="gap-1.5 rounded-lg">
                <ShieldCheck size={15} /> Admin
              </Link>
            </li>
          )}
          <li>
            <a
              href="https://consultas-odepa-cfdu.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="gap-1.5 rounded-lg"
            >
              <ExternalLink size={15} /> Consultas
            </a>
          </li>
        </ul>
      </div>

      {/* Usuario, toggle tema y logout */}
      <div className="navbar-end gap-1">
        {/* Toggle oscuro/claro */}
        <button
          onClick={() => setDark((d: boolean) => !d)}
          title={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          className="btn btn-ghost btn-sm btn-circle"
        >
          {dark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {user && (
          <>
            <div className="text-right hidden sm:block ml-1">
              <p className="text-sm font-semibold leading-tight">{user.nombre}</p>
              <p className="text-xs opacity-70">{ROL_LABELS[user.rol] ?? user.rol}</p>
            </div>
            <div className="avatar placeholder">
              <div className="bg-primary-content/20 text-primary-content rounded-full w-8">
                <User size={16} />
              </div>
            </div>
            <button
              onClick={logout}
              title="Cerrar sesión"
              className="btn btn-ghost btn-sm gap-1.5"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </>
        )}
      </div>
    </div>
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
          <Route
            path="/compra-directa"
            element={
              <ProtectedRoute roles={['ADMIN', 'CREADOR_OC', 'RECEPCION']}>
                <CompraDirecta />
              </ProtectedRoute>
            }
          />
          <Route path="/recepcion/:id" element={<Recepcion />} />
          <Route path="/proveedores" element={<Proveedores />} />
          <Route path="/productos/:id/historial" element={<HistorialProducto />} />
          <Route
            path="/reportes"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <Reportes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <Admin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/productos/duplicados"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <FusionProductos />
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
  // Evita que la rueda del mouse modifique los inputs numéricos enfocados
  // (cantidades, costos, precios en compra/recepción). Mientras el campo
  // numérico tiene el foco, se bloquea el evento de scroll sobre él para que
  // el valor no cambie y el campo conserve el foco.
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const el = document.activeElement as HTMLInputElement | null;
      if (el && el.tagName === 'INPUT' && el.type === 'number' && el === e.target) {
        e.preventDefault();
      }
    };
    document.addEventListener('wheel', handleWheel, { passive: false });
    return () => document.removeEventListener('wheel', handleWheel);
  }, []);

  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
