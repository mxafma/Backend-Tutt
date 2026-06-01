package com.verduleria.backend.controller;

import com.verduleria.backend.model.EstadoOrden;
import com.verduleria.backend.model.OrdenCompra;
import com.verduleria.backend.service.OrdenCompraService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ordenes")
public class OrdenCompraController {

    @Autowired
    private OrdenCompraService ordenCompraService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public List<OrdenCompra> listar() {
        return ordenCompraService.obtenerTodas();
    }

    @GetMapping("/activa")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<OrdenCompra> obtenerActiva() {
        return ordenCompraService.obtenerActiva()
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<OrdenCompra> obtenerPorId(@PathVariable Long id) {
        return ordenCompraService.obtenerPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'CREADOR_OC')")
    public ResponseEntity<OrdenCompra> crear(@RequestBody OrdenCompra orden) {
        return ResponseEntity.status(201).body(ordenCompraService.guardar(orden));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'CREADOR_OC')")
    public ResponseEntity<OrdenCompra> actualizar(
            @PathVariable Long id,
            @RequestBody OrdenCompra orden) {
        try {
            return ResponseEntity.ok(ordenCompraService.actualizar(id, orden));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PatchMapping("/{id}/estado")
    @PreAuthorize("hasAnyRole('ADMIN', 'CREADOR_OC')")
    public ResponseEntity<OrdenCompra> actualizarEstado(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String estadoStr = body.get("estado");
        if (estadoStr == null || estadoStr.isBlank()) return ResponseEntity.badRequest().build();
        try {
            EstadoOrden nuevoEstado = EstadoOrden.valueOf(estadoStr);
            return ResponseEntity.ok(ordenCompraService.actualizarEstado(id, nuevoEstado));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
