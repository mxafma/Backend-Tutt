package com.verduleria.backend.controller;

import com.verduleria.backend.model.DetalleOrden;
import com.verduleria.backend.model.OrdenCompra;
import com.verduleria.backend.service.CompraService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/compras")
public class CompraController {

    @Autowired
    private CompraService compraService;

    @PatchMapping("/ordenes/{id}/iniciar")
    @PreAuthorize("hasAnyRole('ADMIN', 'COMPRADOR')")
    public ResponseEntity<OrdenCompra> iniciar(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(compraService.iniciar(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PatchMapping("/detalles/{detalleId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'COMPRADOR')")
    public ResponseEntity<DetalleOrden> actualizarDetalle(
            @PathVariable Long detalleId,
            @RequestBody Map<String, Object> body) {
        try {
            return ResponseEntity.ok(compraService.actualizarDetalle(detalleId, body));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/ordenes/{id}/agregar-producto")
    @PreAuthorize("hasAnyRole('ADMIN', 'COMPRADOR')")
    public ResponseEntity<DetalleOrden> agregarProducto(
            @PathVariable Long id,
            @RequestBody DetalleOrden detalle) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(compraService.agregarProducto(id, detalle));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PatchMapping("/ordenes/{id}/finalizar")
    @PreAuthorize("hasAnyRole('ADMIN', 'COMPRADOR')")
    public ResponseEntity<OrdenCompra> finalizar(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(compraService.finalizar(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
