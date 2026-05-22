import React from 'react';
import { Link } from 'react-router-dom';
import { Package, ShoppingCart, PlusCircle } from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Panel de Control</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        <Link to="/productos" className="bg-white border rounded-lg shadow p-6 hover:shadow-lg transition-transform transform hover:-translate-y-1">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-blue-100 text-blue-600 rounded-full">
              <Package size={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-700">Productos</h2>
              <p className="text-gray-500">Gestiona el inventario y artículos.</p>
            </div>
          </div>
        </Link>
        
        <Link to="/ordenes" className="bg-white border rounded-lg shadow p-6 hover:shadow-lg transition-transform transform hover:-translate-y-1">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-green-100 text-green-600 rounded-full">
              <ShoppingCart size={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-700">Ver Órdenes</h2>
              <p className="text-gray-500">Revisa órdenes de compra existentes.</p>
            </div>
          </div>
        </Link>

        <Link to="/ordenes/nueva" className="bg-white border rounded-lg shadow p-6 hover:shadow-lg transition-transform transform hover:-translate-y-1">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-yellow-100 text-yellow-600 rounded-full">
              <PlusCircle size={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-700">Crear Orden</h2>
              <p className="text-gray-500">Genera una nueva orden de compra.</p>
            </div>
          </div>
        </Link>

      </div>
    </div>
  );
}
