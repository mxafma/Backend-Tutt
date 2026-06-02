package com.verduleria.backend.service;

import com.verduleria.backend.model.DetalleOrden;
import com.verduleria.backend.model.EstadoOrden;
import com.verduleria.backend.model.OrdenCompra;
import com.verduleria.backend.model.Producto;
import com.verduleria.backend.repository.DetalleOrdenRepository;
import com.verduleria.backend.repository.OrdenCompraRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;

@Service
public class CompraService {

    private static final Logger log = LoggerFactory.getLogger(CompraService.class);

    @Autowired
    private OrdenCompraRepository ordenCompraRepository;

    @Autowired
    private DetalleOrdenRepository detalleOrdenRepository;

    @PersistenceContext
    private EntityManager em;

    @Transactional
    public OrdenCompra iniciar(Long id) {
        OrdenCompra orden = ordenCompraRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Orden no encontrada: " + id));
        orden.setEstado(EstadoOrden.EN_COMPRA);
        return ordenCompraRepository.save(orden);
    }

    @Transactional
    public DetalleOrden actualizarDetalle(Long detalleId, Map<String, Object> body) {
        DetalleOrden detalle = detalleOrdenRepository.findById(detalleId)
                .orElseThrow(() -> new RuntimeException("Detalle no encontrado: " + detalleId));
        if (body.containsKey("cantidadComprada"))  detalle.setCantidadComprada(toDouble(body.get("cantidadComprada")));
        if (body.containsKey("costoTotal"))        detalle.setCostoTotal(toDouble(body.get("costoTotal")));
        if (body.containsKey("factura"))           detalle.setFactura((Boolean) body.get("factura"));
        if (body.containsKey("comentario"))        detalle.setComentario((String) body.get("comentario"));
        if (body.containsKey("estadoProducto"))    detalle.setEstadoProducto((String) body.get("estadoProducto"));
        if (body.containsKey("cantidadInterna"))   detalle.setCantidadInterna(toDouble(body.get("cantidadInterna")));
        if (body.containsKey("formato"))           detalle.setFormato((String) body.get("formato"));
        return detalleOrdenRepository.save(detalle);
    }

    @Transactional
    public DetalleOrden agregarProducto(Long ordenId, DetalleOrden detalle) {
        OrdenCompra orden = ordenCompraRepository.findById(ordenId)
                .orElseThrow(() -> new RuntimeException("Orden no encontrada: " + ordenId));
        detalle.setId(null);
        detalle.setOrden(orden);
        if (detalle.getEstadoProducto() == null) detalle.setEstadoProducto("AGREGADO_EN_MERCADO");
        if (detalle.getAgregadoEnMercado() == null) detalle.setAgregadoEnMercado(true);
        if (detalle.getProducto() != null && detalle.getProducto().getId() != null) {
            Producto p = em.find(Producto.class, detalle.getProducto().getId());
            detalle.setProducto(p);
        } else {
            detalle.setProducto(null);
        }
        return detalleOrdenRepository.save(detalle);
    }

    @Transactional
    public OrdenCompra finalizar(Long id) {
        OrdenCompra orden = ordenCompraRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Orden no encontrada: " + id));
        orden.setEstado(EstadoOrden.COMPRADA);
        orden.setFechaCompraReal(LocalDateTime.now());
        return ordenCompraRepository.save(orden);
    }

    private Double toDouble(Object value) {
        if (value instanceof Number) return ((Number) value).doubleValue();
        if (value instanceof String) {
            try { return Double.parseDouble((String) value); }
            catch (NumberFormatException e) {
                log.warn("No se pudo convertir a Double: '{}'", value);
                return 0.0;
            }
        }
        return 0.0;
    }
}
