import re

with open('frontend/src/pages/CrearOrden.tsx', 'r', encoding='utf8') as f:
    code = f.read()

# 1. Update initial state
code = code.replace(
    \"observaciones: ''\",
    \"observaciones: '',\\n    encargadoCompra: ''\"
)

# 2. Add form field for encargadoCompra
form_field = \"\"\"<div>
              <label htmlFor=\"encargadoCompra\" className=\"block text-sm font-medium text-gray-600 mb-1\">Encargado de Compra</label>
              <input
                type=\"text\"
                id=\"encargadoCompra\"
                name=\"encargadoCompra\"
                placeholder=\"Nombre o Creador\"
                value={orden.encargadoCompra || ''}
                onChange={handleOrdenChange}
                className=\"w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500\"
              />
            </div>
            <div className=\"md:col-span-2 lg:col-span-3\">\"\"\"
code = code.replace('<div className=\"md:col-span-2 lg:col-span-3\">', form_field)

# 3. Add crearProductoRapido functionality
func_code = \"\"\"  const eliminarDetalle = (index: number) => {
    const nuevosDetalles = [...(orden.detalles || [])];
    nuevosDetalles.splice(index, 1);
    const nuevoTotal = nuevosDetalles.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    setOrden(prev => ({
      ...prev,
      detalles: nuevosDetalles,
      total: nuevoTotal,
    }));
  };

  const crearProductoRapido = async () => {
    if (!nuevoProducto.nombre.trim()) {
      alert('Debes ingresar un nombre para el producto nuevo.');
      return;
    }
    try {
      const res = await api.post('/productos', {
        nombre: nuevoProducto.nombre,
        categoria: nuevoProducto.categoria,
        precioSugerido: 0,
        descripcion: ''
      });
      const prodCreado = res.data;
      setProductos([...productos, prodCreado]);
      setDetalleActual({ ...detalleActual, productoId: prodCreado.id, precioUnitario: 0 });
      setMostrarNuevoProducto(false);
      setNuevoProducto({ nombre: '', categoria: 'General' });
      alert('Producto creado y agregado con éxito.');
    } catch (error) {
      console.error('Error al crear producto rápido:', error);
      alert('Error al crear producto rápido.');
    }
  };\"\"\"

code = re.sub(r'  const eliminarDetalle = \(index: number\) => \{\s*const nuevosDetalles = \[\.\.\.\(orden\.detalles \|\| \[\]\)\];\s*nuevosDetalles\.splice\(index, 1\);\s*const nuevoTotal = nuevosDetalles\.reduce\(\(sum, item\) => sum \+ \(item\.subtotal \|\| 0\), 0\);\s*setOrden\(prev => \(\{\s*\.\.\.prev,\s*detalles: nuevosDetalles,\s*total: nuevoTotal,\s*\}\)\);\s*\};', func_code, code, flags=re.MULTILINE)

# 4. Add UI for quick product creation
ui_code = \"\"\"</button>
          </div>

          <div className=\"mb-6\">
            <button
              type=\"button\"
              onClick={() => setMostrarNuevoProducto(!mostrarNuevoProducto)}
              className=\"text-blue-500 hover:text-blue-700 text-sm font-semibold\"
            >
              {mostrarNuevoProducto ? 'Cancelar creación rápida' : '+ Crear producto nuevo rápidamente'}
            </button>
            {mostrarNuevoProducto && (
              <div className=\"mt-4 p-4 bg-blue-50 rounded-md border border-blue-200\">
                <div className=\"flex flex-wrap gap-4 items-end\">
                  <div className=\"flex-1\">
                    <label className=\"block text-sm font-medium text-gray-600 mb-1\">Nombre del nuevo producto</label>
                    <input
                      type=\"text\"
                      className=\"w-full p-2 border border-gray-300 rounded-md\"
                      value={nuevoProducto.nombre}
                      onChange={e => setNuevoProducto({...nuevoProducto, nombre: e.target.value})}
                      placeholder=\"Ej: Manzanas (1kg)\"
                    />
                  </div>
                  <div>
                    <label className=\"block text-sm font-medium text-gray-600 mb-1\">Categoría (Formato)</label>
                    <input
                      type=\"text\"
                      className=\"w-full p-2 border border-gray-300 rounded-md\"
                      value={nuevoProducto.categoria}
                      onChange={e => setNuevoProducto({...nuevoProducto, categoria: e.target.value})}
                      placeholder=\"General\"
                    />
                  </div>
                  <button
                    type=\"button\"
                    onClick={crearProductoRapido}
                    className=\"bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 h-10\"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Tabla de productos agregados\"\"\"

code = re.sub(r'</button>\s*</div>\s*\{\/\* Tabla de productos agregados', ui_code, code)

with open('frontend/src/pages/CrearOrden.tsx', 'w', encoding='utf8') as f:
    f.write(code)

print('Done!')
