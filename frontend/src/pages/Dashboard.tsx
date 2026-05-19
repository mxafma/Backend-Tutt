import React from 'react';
import { Link } from 'react-router-dom';
import { Package, ShoppingCart } from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Panel de Control</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        <Link to="/productos" className="bg-white border rounded shadow p-6 hover:shadow-lg transition">
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
        
        <Link to="/ordenes" className="bg-white border rounded shadow p-6 hover:shadow-lg transition">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-green-100 text-green-600 rounded-full">
              <ShoppingCart size={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-700">Órdenes de Compra</h2>
              <p className="text-gray-500">Genera y revisa órdenes a proveedores.</p>
            </div>
          </div>
        </Link>

      </div>
    </div>
  );
}
