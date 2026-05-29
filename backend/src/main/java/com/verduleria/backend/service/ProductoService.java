package com.verduleria.backend.service;

import com.verduleria.backend.model.Producto;
import com.verduleria.backend.repository.ProductoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class ProductoService {
    @Autowired
    private ProductoRepository productoRepository;

    public List<Producto> obtenerTodos() {
        return productoRepository.findAll();
    }

    public Optional<Producto> obtenerPorId(Long id) {
        return productoRepository.findById(id);
    }

    public Producto guardarProducto(Producto producto) {
        if (producto.getActivo() == null) producto.setActivo(true);
        if (producto.getCategoria() == null) producto.setCategoria("");
        if (producto.getDescripcion() == null) producto.setDescripcion("");
        return productoRepository.save(producto);
    }

    public Optional<Producto> actualizar(Long id, Producto datos) {
        return productoRepository.findById(id).map(p -> {
            p.setNombre(datos.getNombre());
            p.setDescripcion(datos.getDescripcion() != null ? datos.getDescripcion() : "");
            p.setCategoria(datos.getCategoria() != null ? datos.getCategoria() : "");
            p.setFormatoHabitual(datos.getFormatoHabitual());
            p.setMargenRecomendado(datos.getMargenRecomendado());
            if (datos.getActivo() != null) p.setActivo(datos.getActivo());
            return productoRepository.save(p);
        });
    }

    public Optional<Producto> desactivar(Long id) {
        return productoRepository.findById(id).map(p -> {
            p.setActivo(false);
            return productoRepository.save(p);
        });
    }
}
