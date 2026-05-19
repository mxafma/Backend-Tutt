import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { OrdenCompra } from '../types';

export default function Ordenes() {
  const [ordenes, setOrdenes] = useState<OrdenCompra[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrdenes();
  }, []);

  const fetchOrdenes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/ordenes');
      setOrdenes(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Órdenes de Compra</h1>

      <div className="bg-white border rounded shadow-sm overflow-hidden">
        {loading ? <p className="p-4">Cargando...</p> : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 border-b">ID Orden</th>
                <th className="p-3 border-b">Fecha y Hora</th>
                <th className="p-3 border-b">Total</th>
              </tr>
            </thead>
            <tbody>
              {ordenes.length === 0 ? <tr><td colSpan={3} className="p-3 text-center">No hay órdenes registradas.</td></tr> : null}
              {ordenes.map(orden => (
                <tr key={orden.id} className="hover:bg-gray-50 border-b last:border-0 border-gray-200">
                  <td className="p-3">#{orden.id}</td>
                  <td className="p-3">{orden.fechaHora || 'N/A'}</td>
                  <td className="p-3 font-bold">${orden.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
