const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/CrearOrden.tsx', 'utf8');

code = code.replace(/const eliminarDetalle = \([^)]*\) => \{[\s\S]*?total: nuevoTotal,\s*\}\)\);\s*\};/, \const eliminarDetalle = (index: number) => {
    const nuevosDetalles = [...(orden.detalles || [])];
    nuevosDetalles.splice(index, 1);
    const nuevoTotal = nuevosDetalles.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    setOrden(prev => ({ ...prev, detalles: nuevosDetalles, total: nuevoTotal }));
  };

  const crearProductoRapido = async () => {
    if (!nuevoProducto.nombre.trim()) return alert('Debes ingresar un nombre para el producto nuevo.');
    try {
      const res = await api.post('/productos', { nombre: nuevoProducto.nombre, categoria: nuevoProducto.categoria, precioSugerido: 0, descripcion: '' });
      const prodCreado = res.data;
      setProductos([...productos, prodCreado]);
      setDetalleActual({ ...detalleActual, productoId: prodCreado.id, precioUnitario: 0 });
      setMostrarNuevoProducto(false);
      setNuevoProducto({ nombre: '', categoria: 'General' });
      alert('Producto creado rápido con éxito.');
    } catch (error) {
      alert('Error al crear producto rápido.');
    }
  };\);

code = code.replace('<div className=\"md:col-span-2 lg:col-span-3\">', \<div><label className=\"block text-sm font-medium text-gray-600 mb-1\">Encargado de Compra</label><input type=\"text\" name=\"encargadoCompra\" value={orden.encargadoCompra || ''} onChange={handleOrdenChange} className=\"w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500\" /></div><div className=\"md:col-span-2 lg:col-span-3\">\);

let addProductHTML = \</button></div><div className=\"mb-6\"><button type=\"button\" onClick={() => setMostrarNuevoProducto(!mostrarNuevoProducto)} className=\"text-blue-500 hover:text-blue-700 text-sm font-semibold\">{mostrarNuevoProducto ? 'Cancelar' : '+ Crear producto nuevo rápidamente'}</button>{mostrarNuevoProducto && (<div className=\"mt-4 flex gap-4 p-4 bg-blue-50 border items-end\"><div className=\"flex-1\"><label>Nombre</label><input className=\"w-full p-2 border rounded-md\" value={nuevoProducto.nombre} onChange={e => setNuevoProducto({...nuevoProducto, nombre: e.target.value})} /></div><div><label>Categoría</label><input className=\"w-full p-2 border rounded-md\" value={nuevoProducto.categoria} onChange={e => setNuevoProducto({...nuevoProducto, categoria: e.target.value})} /></div><button type=\"button\" onClick={crearProductoRapido} className=\"bg-green-500 text-white px-4 py-2 rounded-md h-10\">Guardar</button></div>)}</div>{/* Tabla de productos agregados\;

code = code.replace(/<\/button>\s*<\/div>\s*{\/\* Tabla de productos agregados/, addProductHTML);

fs.writeFileSync('frontend/src/pages/CrearOrden.tsx', code);