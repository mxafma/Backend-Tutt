import React, { useState, useRef, useEffect } from 'react';
import { Producto } from '../types';
import api from '../services/api';
import { PlusCircle, X } from 'lucide-react';

interface Props {
  productos: Producto[];
  seleccionado: Producto | undefined;
  onSelect: (p: Producto) => void;
  onClear: () => void;
  onCreado: (p: Producto) => void;
}

export default function ProductoPicker({ productos, seleccionado, onSelect, onClear, onCreado }: Props) {
  const [busqueda, setBusqueda] = useState('');
  const [abierto, setAbierto] = useState(false);
  const [creando, setCreando] = useState(false);
  const [nombreNuevo, setNombreNuevo] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [indiceFocused, setIndiceFocused] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAbierto(false);
        setIndiceFocused(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const activos = productos.filter(p => p.activo !== false);

  useEffect(() => {
    setIndiceFocused(-1);
  }, [busqueda]);

  useEffect(() => {
    if (listRef.current && indiceFocused >= 0) {
      const items = listRef.current.querySelectorAll('button');
      items[indiceFocused]?.scrollIntoView({ block: 'nearest' });
    }
  }, [indiceFocused]);

  const filtrados = busqueda.length > 0
    ? activos.filter(p => p.nombre.toLowerCase().includes(busqueda.toLowerCase())).slice(0, 10)
    : activos.slice(0, 10);

  const coincideExacto = activos.some(p => p.nombre.toLowerCase() === busqueda.toLowerCase());

  const seleccionar = (p: Producto) => {
    onSelect(p);
    setBusqueda('');
    setAbierto(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBusqueda(e.target.value);
    setAbierto(true);
    setIndiceFocused(-1);
    if (seleccionado) onClear();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!abierto) return;
    const totalItems = filtrados.length + (busqueda && !coincideExacto ? 1 : 0);
    if (totalItems === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIndiceFocused(prev => (prev + 1) % totalItems);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIndiceFocused(prev => (prev - 1 + totalItems) % totalItems);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (indiceFocused >= 0 && indiceFocused < filtrados.length) {
        seleccionar(filtrados[indiceFocused]);
      } else if (indiceFocused === filtrados.length && busqueda && !coincideExacto) {
        abrirFormNuevo();
      }
    } else if (e.key === 'Escape') {
      setAbierto(false);
      setIndiceFocused(-1);
    }
  };

  const abrirFormNuevo = () => {
    setNombreNuevo(busqueda);
    setCreando(true);
    setAbierto(false);
  };

  const crearProducto = async () => {
    const nombre = nombreNuevo.trim();
    if (!nombre) return;
    setGuardando(true);
    try {
      const res = await api.post('/productos', { nombre, activo: true });
      const nuevo: Producto = res.data;
      onCreado(nuevo);
      seleccionar(nuevo);
      setCreando(false);
      setNombreNuevo('');
    } catch {
      alert('Error al crear el producto.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div ref={ref} className="relative">
      {seleccionado ? (
        <div className="flex items-center gap-1 w-full p-2 border border-green-400 bg-green-50 rounded-md">
          <span className="flex-1 text-sm font-medium text-green-800 truncate">
            {seleccionado.nombre}
          </span>
          <button
            type="button"
            onClick={() => { onClear(); setBusqueda(''); }}
            className="text-green-600 hover:text-red-500 shrink-0"
          >
            <X size={15} />
          </button>
        </div>
      ) : (
        <input
          type="text"
          value={busqueda}
          onChange={handleChange}
          onFocus={() => setAbierto(true)}
          onKeyDown={handleKeyDown}
          placeholder="Buscar producto..."
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 outline-none"
          autoComplete="off"
        />
      )}

      {abierto && !seleccionado && (
        <div ref={listRef} className="absolute z-30 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-52 overflow-y-auto">
          {filtrados.length > 0 ? (
            filtrados.map((p, idx) => (
              <button
                key={p.id}
                type="button"
                onMouseDown={() => seleccionar(p)}
                onMouseEnter={() => setIndiceFocused(idx)}
                className={`w-full text-left px-3 py-2 text-sm border-b border-gray-100 last:border-0 ${
                  indiceFocused === idx ? 'bg-green-100 text-green-800' : 'hover:bg-green-50 hover:text-green-700'
                }`}
              >
                {p.nombre}
              </button>
            ))
          ) : (
            <p className="px-3 py-2 text-sm text-gray-400 italic">Sin resultados</p>
          )}
          {busqueda && !coincideExacto && (
            <button
              type="button"
              onMouseDown={abrirFormNuevo}
              onMouseEnter={() => setIndiceFocused(filtrados.length)}
              className={`w-full text-left px-3 py-2 text-sm text-blue-600 font-semibold border-t border-gray-200 flex items-center gap-1.5 ${
                indiceFocused === filtrados.length ? 'bg-blue-100' : 'hover:bg-blue-50'
              }`}
            >
              <PlusCircle size={14} /> Crear "{busqueda}"
            </button>
          )}
          {filtrados.length === 0 && !busqueda && (
            <p className="px-3 py-2 text-xs text-gray-400">Escribe para filtrar ({productos.length} productos)</p>
          )}
        </div>
      )}

      {creando && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700 font-semibold mb-2">Crear nuevo producto</p>
          <input
            type="text"
            value={nombreNuevo}
            onChange={e => setNombreNuevo(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && crearProducto()}
            placeholder="Nombre del producto"
            className="w-full p-2 border border-blue-300 rounded-md text-sm focus:ring-blue-400 outline-none mb-2"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={crearProducto}
              disabled={guardando || !nombreNuevo.trim()}
              className="flex-1 py-1.5 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {guardando ? 'Creando...' : 'Crear y seleccionar'}
            </button>
            <button
              type="button"
              onClick={() => setCreando(false)}
              className="px-3 py-1.5 bg-white text-gray-600 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
