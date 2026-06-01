package com.verduleria.backend.service;

import com.verduleria.backend.model.Categoria;
import com.verduleria.backend.model.Producto;
import com.verduleria.backend.repository.ProductoRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class ProductoService {

    @Autowired
    private ProductoRepository productoRepository;

    @PersistenceContext
    private EntityManager em;

    @Transactional(readOnly = true)
    public List<Producto> obtenerTodos() {
        return productoRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<Producto> obtenerPorId(Long id) {
        return productoRepository.findById(id);
    }

    @Transactional
    public Producto guardarProducto(Producto producto) {
        if (producto.getActivo() == null) producto.setActivo(true);
        resolverCategoria(producto);
        return productoRepository.save(producto);
    }

    @Transactional
    public Optional<Producto> actualizar(Long id, Producto datos) {
        return productoRepository.findById(id).map(p -> {
            p.setNombre(datos.getNombre());
            p.setDescripcion(datos.getDescripcion());
            p.setFormatoHabitual(datos.getFormatoHabitual());
            p.setMargenRecomendado(datos.getMargenRecomendado());
            if (datos.getActivo() != null) p.setActivo(datos.getActivo());
            // Copia el objeto categoria del DTO y resuelve la referencia JPA
            p.setCategoria(datos.getCategoria());
            resolverCategoria(p);
            return productoRepository.save(p);
        });
    }

    @Transactional
    public Optional<Producto> desactivar(Long id) {
        return productoRepository.findById(id).map(p -> {
            p.setActivo(false);
            return productoRepository.save(p);
        });
    }

    private void resolverCategoria(Producto producto) {
        Categoria cat = producto.getCategoria();
        if (cat != null && cat.getId() != null) {
            producto.setCategoria(em.getReference(Categoria.class, cat.getId()));
        } else if (cat != null && cat.getId() == null) {
            producto.setCategoria(null);
        }
    }
}
