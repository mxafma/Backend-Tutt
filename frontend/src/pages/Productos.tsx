import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Producto } from '../types';

export default function Productos() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<Producto>({
    nombre: '', descripcion: '', precio: 0, stock: 0
  });

  useEffect(() => {
    fetchProductos();
  }, []);

  const fetchProductos = async () => {
    try {
      setLoading(true);
      const res = await api.get('/productos');
      setProductos(res.data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los productos');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: name === 'precio' || name === 'stock' ? Number(value) : value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/productos', form);
      fetchProductos();
      setForm({ nombre: '', descripcion: '', precio: 0, stock: 0 });
    } catch (err) {
      alert('Error al guardar el producto');
    }
  };

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Gestión de Productos</h1>

      {/* Formulario de creación */}
      <div className="bg-gray-50 p-4 border rounded shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Añadir Nuevo Producto</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input required name="nombre" value={form.nombre} onChange={handleChange} placeholder="Nombre" className="border p-2 rounded" />
          <input required name="descripcion" value={form.descripcion} onChange={handleChange} placeholder="Descripción" className="border p-2 rounded" />
          <input required type="number" name="precio" value={form.precio} onChange={handleChange} placeholder="Precio" className="border p-2 rounded" />
          <input required type="number" name="stock" value={form.stock} onChange={handleChange} placeholder="Stock (Kg/Unid)" className="border p-2 rounded" />
          <button type="submit" className="md:col-span-2 bg-blue-600 text-white p-2 rounded hover:bg-blue-700">Guardar Producto</button>
        </form>
      </div>

      {/* Listado de Productos */}
      <div className="bg-white border rounded shadow-sm overflow-hidden">
        {loading ? <p className="p-4">Cargando...</p> : error ? <p className="p-4 text-red-500">{error}</p> : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 border-b">ID</th>
                <th className="p-3 border-b">Nombre</th>
                <th className="p-3 border-b">Stock</th>
                <th className="p-3 border-b">Precio U.</th>
              </tr>
            </thead>
            <tbody>
              {productos.length === 0 ? <tr><td colSpan={4} className="p-3 text-center">No hay productos.</td></tr> : null}
              {productos.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 border-b last:border-0 border-gray-200">
                  <td className="p-3">#{p.id}</td>
                  <td className="p-3 font-medium">{p.nombre}</td>
                  <td className="p-3">{p.stock}</td>
                  <td className="p-3">${p.precio}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
