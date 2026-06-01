package com.verduleria.backend.controller;

import com.verduleria.backend.model.DetalleOrden;
import com.verduleria.backend.model.EstadoOrden;
import com.verduleria.backend.model.OrdenCompra;
import com.verduleria.backend.repository.DetalleOrdenRepository;
import com.verduleria.backend.repository.OrdenCompraRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/recepcion")
public class RecepcionController {

    private static final Logger log = LoggerFactory.getLogger(RecepcionController.class);

    @Autowired
    private OrdenCompraRepository ordenCompraRepository;

    @Autowired
    private DetalleOrdenRepository detalleOrdenRepository;

    @Transactional
    @PatchMapping("/detalles/{detalleId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPCION')")
    public ResponseEntity<DetalleOrden> actualizarDetalle(
            @PathVariable Long detalleId,
            @RequestBody Map<String, Object> body) {
        return detalleOrdenRepository.findById(detalleId).map(detalle -> {
            if (body.containsKey("cantidadComprada"))       detalle.setCantidadComprada(toDouble(body.get("cantidadComprada")));
            if (body.containsKey("costoTotal"))             detalle.setCostoTotal(toDouble(body.get("costoTotal")));
            if (body.containsKey("factura"))                detalle.setFactura((Boolean) body.get("factura"));
            if (body.containsKey("cantidadInterna"))        detalle.setCantidadInterna(toDouble(body.get("cantidadInterna")));
            if (body.containsKey("margenSugerido"))         detalle.setMargenSugerido(toDouble(body.get("margenSugerido")));
            if (body.containsKey("precioFinalEditado"))     detalle.setPrecioFinalEditado(toDouble(body.get("precioFinalEditado")));
            if (body.containsKey("costoUnitarioCalculado")) detalle.setCostoUnitarioCalculado(toDouble(body.get("costoUnitarioCalculado")));
            if (body.containsKey("precioSugerido"))         detalle.setPrecioSugerido(toDouble(body.get("precioSugerido")));
            if (body.containsKey("margenResultante"))       detalle.setMargenResultante(toDouble(body.get("margenResultante")));
            return ResponseEntity.ok(detalleOrdenRepository.save(detalle));
        }).orElse(ResponseEntity.notFound().build());
    }

    @Transactional
    @PatchMapping("/ordenes/{id}/cerrar")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPCION')")
    public ResponseEntity<OrdenCompra> cerrarRecepcion(@PathVariable Long id) {
        return ordenCompraRepository.findById(id).map(orden -> {
            orden.setEstado(EstadoOrden.RECIBIDA);
            return ResponseEntity.ok(ordenCompraRepository.save(orden));
        }).orElse(ResponseEntity.notFound().build());
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
