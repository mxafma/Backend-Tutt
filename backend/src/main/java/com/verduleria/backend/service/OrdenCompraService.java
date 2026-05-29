package com.verduleria.backend.service;

import com.verduleria.backend.model.OrdenCompra;
import com.verduleria.backend.repository.OrdenCompraRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class OrdenCompraService {
    @Autowired
    private OrdenCompraRepository ordenCompraRepository;

    public List<OrdenCompra> obtenerTodas() {
        return ordenCompraRepository.findAll();
    }

    public Optional<OrdenCompra> obtenerPorId(Long id) {
        return ordenCompraRepository.findById(id);
    }

    public OrdenCompra guardar(OrdenCompra orden) {
        if (orden.getDetalles() != null) {
            orden.getDetalles().forEach(detalle -> {
                detalle.setId(null);   // limpia IDs temporales del frontend
                detalle.setOrden(orden);
                if (detalle.getEstadoProducto() == null) detalle.setEstadoProducto("PENDIENTE");
                if (detalle.getAgregadoEnMercado() == null) detalle.setAgregadoEnMercado(false);
                // Desacoplar el producto a solo la referencia por ID para evitar cascade no deseado
                if (detalle.getProducto() != null && detalle.getProducto().getId() != null) {
                    com.verduleria.backend.model.Producto ref = new com.verduleria.backend.model.Producto();
                    ref.setId(detalle.getProducto().getId());
                    detalle.setProducto(ref);
                }
            });
        }
        return ordenCompraRepository.save(orden);
    }

    public OrdenCompra actualizarEstado(Long id, String nuevoEstado) {
        OrdenCompra orden = ordenCompraRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Orden no encontrada"));
        orden.setEstado(nuevoEstado);
        return ordenCompraRepository.save(orden);
    }
}
