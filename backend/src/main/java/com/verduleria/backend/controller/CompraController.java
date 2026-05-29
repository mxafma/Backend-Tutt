package com.verduleria.backend.controller;

import com.verduleria.backend.model.DetalleOrden;
import com.verduleria.backend.model.OrdenCompra;
import com.verduleria.backend.model.Producto;
import com.verduleria.backend.repository.DetalleOrdenRepository;
import com.verduleria.backend.repository.OrdenCompraRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

@RestController
@RequestMapping("/api/compras")
public class CompraController {

    @Autowired
    private OrdenCompraRepository ordenCompraRepository;

    @Autowired
    private DetalleOrdenRepository detalleOrdenRepository;

    @PatchMapping("/ordenes/{id}/iniciar")
    public ResponseEntity<OrdenCompra> iniciar(@PathVariable Long id) {
        return ordenCompraRepository.findById(id).map(orden -> {
            orden.setEstado("EN_COMPRA");
            return ResponseEntity.ok(ordenCompraRepository.save(orden));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/detalles/{detalleId}")
    public ResponseEntity<DetalleOrden> actualizarDetalle(
            @PathVariable Long detalleId,
            @RequestBody Map<String, Object> body) {
        return detalleOrdenRepository.findById(detalleId).map(detalle -> {
            if (body.containsKey("cantidadComprada"))  detalle.setCantidadComprada(toDouble(body.get("cantidadComprada")));
            if (body.containsKey("costoTotal"))        detalle.setCostoTotal(toDouble(body.get("costoTotal")));
            if (body.containsKey("factura"))           detalle.setFactura((Boolean) body.get("factura"));
            if (body.containsKey("comentario"))        detalle.setComentario((String) body.get("comentario"));
            if (body.containsKey("estadoProducto"))    detalle.setEstadoProducto((String) body.get("estadoProducto"));
            if (body.containsKey("cantidadInterna"))   detalle.setCantidadInterna(toDouble(body.get("cantidadInterna")));
            if (body.containsKey("formato"))           detalle.setFormato((String) body.get("formato"));
            return ResponseEntity.ok(detalleOrdenRepository.save(detalle));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/ordenes/{id}/agregar-producto")
    public ResponseEntity<DetalleOrden> agregarProducto(
            @PathVariable Long id,
            @RequestBody DetalleOrden detalle) {
        return ordenCompraRepository.findById(id).map(orden -> {
            detalle.setId(null);
            detalle.setOrden(orden);
            if (detalle.getEstadoProducto() == null) detalle.setEstadoProducto("AGREGADO_EN_MERCADO");
            if (detalle.getAgregadoEnMercado() == null) detalle.setAgregadoEnMercado(true);
            // Si el producto no tiene ID (ej: agregado en mercado), no guardar la relación
            if (detalle.getProducto() != null && detalle.getProducto().getId() != null) {
                Producto ref = new Producto();
                ref.setId(detalle.getProducto().getId());
                detalle.setProducto(ref);
            } else {
                detalle.setProducto(null);
            }
            return ResponseEntity.status(HttpStatus.CREATED).body(detalleOrdenRepository.save(detalle));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/ordenes/{id}/finalizar")
    public ResponseEntity<OrdenCompra> finalizar(@PathVariable Long id) {
        return ordenCompraRepository.findById(id).map(orden -> {
            orden.setEstado("COMPRADA");
            orden.setFechaCompraReal(
                LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
            );
            return ResponseEntity.ok(ordenCompraRepository.save(orden));
        }).orElse(ResponseEntity.notFound().build());
    }

    private Double toDouble(Object value) {
        if (value instanceof Number) return ((Number) value).doubleValue();
        if (value instanceof String) {
            try { return Double.parseDouble((String) value); } catch (NumberFormatException e) { return 0.0; }
        }
        return 0.0;
    }
}
