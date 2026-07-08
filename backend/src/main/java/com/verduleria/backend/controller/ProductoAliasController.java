package com.verduleria.backend.controller;

import com.verduleria.backend.model.ProductoAlias;
import com.verduleria.backend.service.ProductoAliasService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Alias nombre-de-venta (Eleventa) → producto-de-compra para el reporte de
 * rentabilidad. Solo ADMIN, igual que los reportes que consumen estos alias.
 */
@RestController
@RequestMapping("/api/reportes/alias")
@PreAuthorize("hasRole('ADMIN')")
public class ProductoAliasController {

    private final ProductoAliasService aliasService;

    public ProductoAliasController(ProductoAliasService aliasService) {
        this.aliasService = aliasService;
    }

    public record CrearAliasRequest(String nombreVenta, Long productoId) {}

    @GetMapping
    public List<ProductoAlias> listar() {
        return aliasService.listar();
    }

    @PostMapping
    public ResponseEntity<ProductoAlias> crear(@RequestBody CrearAliasRequest req) {
        if (req == null || req.productoId() == null) {
            return ResponseEntity.badRequest().build();
        }
        try {
            return ResponseEntity.ok(aliasService.crear(req.nombreVenta(), req.productoId()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        aliasService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
