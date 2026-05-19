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
            orden.getDetalles().forEach(detalle -> detalle.setOrden(orden));
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
