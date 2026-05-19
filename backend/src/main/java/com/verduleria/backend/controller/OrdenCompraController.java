package com.verduleria.backend.controller;

import com.verduleria.backend.model.OrdenCompra;
import com.verduleria.backend.service.OrdenCompraService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

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
    public OrdenCompra obtenerPorId(@PathVariable Long id) {
        return ordenCompraService.obtenerPorId(id)
                .orElseThrow(() -> new RuntimeException("Orden no encontrada"));
    }

    @PostMapping
    public OrdenCompra crear(@RequestBody OrdenCompra orden) {
        if (orden.getEstado() == null) {
            orden.setEstado("borrador");
        }
        return ordenCompraService.guardar(orden);
    }

    @PutMapping("/{id}/estado")
    public OrdenCompra actualizarEstado(@PathVariable Long id, @RequestParam String estado) {
        return ordenCompraService.actualizarEstado(id, estado);
    }
}
