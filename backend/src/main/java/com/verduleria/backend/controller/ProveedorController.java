package com.verduleria.backend.controller;

import com.verduleria.backend.model.Proveedor;
import com.verduleria.backend.repository.ProveedorRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/proveedores")
public class ProveedorController {

    @Autowired
    private ProveedorRepository proveedorRepository;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public List<Proveedor> listar() {
        return proveedorRepository.findByActivoTrue();
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Proveedor> obtener(@PathVariable Long id) {
        return proveedorRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'CREADOR_OC')")
    public ResponseEntity<Proveedor> crear(@Valid @RequestBody Proveedor proveedor) {
        proveedor.setActivo(true);
        return ResponseEntity.status(HttpStatus.CREATED).body(proveedorRepository.save(proveedor));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'CREADOR_OC')")
    @Transactional
    public ResponseEntity<Proveedor> actualizar(
            @PathVariable Long id,
            @Valid @RequestBody Proveedor datos) {
        return proveedorRepository.findById(id).map(p -> {
            p.setNombre(datos.getNombre());
            p.setRut(datos.getRut());
            p.setTelefono(datos.getTelefono());
            p.setDireccion(datos.getDireccion());
            p.setFormaPagoHabitual(datos.getFormaPagoHabitual());
            return ResponseEntity.ok(proveedorRepository.save(p));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/desactivar")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<Proveedor> desactivar(@PathVariable Long id) {
        return proveedorRepository.findById(id).map(p -> {
            p.setActivo(false);
            return ResponseEntity.ok(proveedorRepository.save(p));
        }).orElse(ResponseEntity.notFound().build());
    }
}
