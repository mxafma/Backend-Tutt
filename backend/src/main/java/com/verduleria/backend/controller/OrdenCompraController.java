package com.verduleria.backend.controller;

import com.verduleria.backend.model.OrdenCompra;
import com.verduleria.backend.service.OrdenCompraService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ordenes")
public class OrdenCompraController {

    @Autowired
    private OrdenCompraService ordenCompraService;

    @GetMapping
    public List<OrdenCompra> listar() {
        return ordenCompraService.obtenerTodas();
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrdenCompra> obtenerPorId(@PathVariable Long id) {
        return ordenCompraService.obtenerPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public OrdenCompra crear(@RequestBody OrdenCompra orden) {
        if (orden.getEstado() == null) orden.setEstado("BORRADOR");
        return ordenCompraService.guardar(orden);
    }

    @PatchMapping("/{id}/estado")
    public ResponseEntity<OrdenCompra> actualizarEstado(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String nuevoEstado = body.get("estado");
        if (nuevoEstado == null) return ResponseEntity.badRequest().build();
        return ResponseEntity.ok(ordenCompraService.actualizarEstado(id, nuevoEstado));
    }
}
