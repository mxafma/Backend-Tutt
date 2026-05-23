import { Routes, Route, Link } from 'react-router-dom';
import { ShoppingCart, PackageOpen, LayoutDashboard, PlusCircle, ClipboardList } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Productos from './pages/Productos';
import Ordenes from './pages/Ordenes';
import CrearOrden from './pages/CrearOrden';
import OrdenDetalle from './pages/OrdenDetalle';
import ModoCompra from './pages/ModoCompra';
import Recepcion from './pages/Recepcion';

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <nav className="bg-green-700 text-white p-4 shadow-md">
        <div className="container mx-auto flex items-center justify-between">
          <div className="font-bold text-xl flex items-center gap-2">
            <ShoppingCart /> Verdulería App
          </div>
          <ul className="flex gap-4 flex-wrap">
            <li>
              <Link to="/" className="hover:text-green-200 flex items-center gap-1">
                <LayoutDashboard size={18} /> Dashboard
              </Link>
            </li>
            <li>
              <Link to="/productos" className="hover:text-green-200 flex items-center gap-1">
                <PackageOpen size={18} /> Productos
              </Link>
            </li>
            <li>
              <Link to="/ordenes" className="hover:text-green-200 flex items-center gap-1">
                <ClipboardList size={18} /> Órdenes
              </Link>
            </li>
            <li>
              <Link
                to="/ordenes/nueva"
                className="bg-green-800 px-3 py-1 rounded-md hover:bg-green-900 flex items-center gap-1"
              >
                <PlusCircle size={18} /> Nueva Orden
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      <main className="flex-grow container mx-auto p-4 mt-4">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/productos" element={<Productos />} />
          <Route path="/ordenes" element={<Ordenes />} />
          <Route path="/ordenes/nueva" element={<CrearOrden />} />
          <Route path="/ordenes/:id" element={<OrdenDetalle />} />
          <Route path="/compra/:id" element={<ModoCompra />} />
          <Route path="/recepcion/:id" element={<Recepcion />} />
        </Routes>
      </main>

      <footer className="bg-gray-800 text-white text-center p-4">
        &copy; {new Date().getFullYear()} - MVP Verdulería
      </footer>
    </div>
  );
}

export default App;
