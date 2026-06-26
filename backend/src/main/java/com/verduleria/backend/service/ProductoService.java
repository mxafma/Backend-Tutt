package com.verduleria.backend.service;

import com.verduleria.backend.model.Categoria;
import com.verduleria.backend.model.Producto;
import com.verduleria.backend.repository.DetalleOrdenRepository;
import com.verduleria.backend.repository.ProductoRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ProductoService {

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private DetalleOrdenRepository detalleOrdenRepository;

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

    /** Normaliza nombres para comparar duplicados: sin tildes, minúsculas y espacios colapsados. */
    public static String normalizar(String s) {
        if (s == null) return "";
        return Normalizer.normalize(s, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase()
                .trim()
                .replaceAll("\\s+", " ");
    }

    /**
     * Devuelve los grupos de productos activos cuyo nombre normalizado coincide
     * (p. ej. "Plátano" y "platano"). Solo se incluyen grupos con 2 o más productos.
     */
    @Transactional(readOnly = true)
    public List<List<Map<String, Object>>> encontrarDuplicados() {
        Map<String, List<Producto>> grupos = new LinkedHashMap<>();
        for (Producto p : productoRepository.findAll()) {
            if (Boolean.FALSE.equals(p.getActivo())) continue;
            grupos.computeIfAbsent(normalizar(p.getNombre()), k -> new ArrayList<>()).add(p);
        }
        return grupos.values().stream()
                .filter(g -> g.size() > 1)
                .map(g -> g.stream().map(p -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("id", p.getId());
                    item.put("nombre", p.getNombre());
                    item.put("descripcion", p.getDescripcion());
                    item.put("formatoHabitual", p.getFormatoHabitual());
                    item.put("usosEnOrdenes", detalleOrdenRepository.countByProducto_Id(p.getId()));
                    return item;
                }).collect(Collectors.toList()))
                .collect(Collectors.toList());
    }

    /**
     * Fusiona productos duplicados en uno principal: re-apunta los detalles de
     * orden de cada duplicado al principal y desactiva el duplicado (no se borra).
     */
    @Transactional
    public Producto fusionar(Long principalId, List<Long> duplicadoIds) {
        Producto principal = productoRepository.findById(principalId)
                .orElseThrow(() -> new RuntimeException("Producto principal no encontrado: " + principalId));
        for (Long dupId : duplicadoIds) {
            if (dupId == null || dupId.equals(principalId)) continue;
            Producto dup = productoRepository.findById(dupId)
                    .orElseThrow(() -> new RuntimeException("Duplicado no encontrado: " + dupId));
            detalleOrdenRepository.reasignarProducto(dup, principal);
            dup.setActivo(false);
            productoRepository.save(dup);
        }
        return principal;
    }

    private void resolverCategoria(Producto producto) {
        Categoria cat = producto.getCategoria();
        if (cat != null && cat.getId() != null) {
            Categoria found = em.find(Categoria.class, cat.getId());
            if (found == null) throw new RuntimeException("Categoria no encontrada: " + cat.getId());
            producto.setCategoria(found);
        } else if (cat != null && cat.getId() == null) {
            producto.setCategoria(null);
        }
    }
}
