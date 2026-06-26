package com.verduleria.backend.controller;

import com.verduleria.backend.model.DetalleOrden;
import com.verduleria.backend.model.EstadoOrden;
import com.verduleria.backend.model.Producto;
import com.verduleria.backend.repository.DetalleOrdenRepository;
import com.verduleria.backend.service.ProductoService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/productos")
public class ProductoController {

    @Autowired
    private ProductoService productoService;

    @Autowired
    private DetalleOrdenRepository detalleOrdenRepository;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public List<Producto> listarProductos() {
        return productoService.obtenerTodos();
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Producto> obtenerProducto(@PathVariable Long id) {
        return productoService.obtenerPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'CREADOR_OC')")
    public ResponseEntity<Producto> crearProducto(@Valid @RequestBody Producto producto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productoService.guardarProducto(producto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'CREADOR_OC')")
    public ResponseEntity<Producto> actualizarProducto(
            @PathVariable Long id,
            @Valid @RequestBody Producto producto) {
        return productoService.actualizar(id, producto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/desactivar")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Producto> desactivarProducto(@PathVariable Long id) {
        return productoService.desactivar(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/duplicados")
    @PreAuthorize("hasRole('ADMIN')")
    public List<List<Map<String, Object>>> duplicados() {
        return productoService.encontrarDuplicados();
    }

    @PostMapping("/fusionar")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Producto> fusionar(@RequestBody FusionRequest req) {
        if (req.principalId == null || req.duplicadoIds == null || req.duplicadoIds.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(productoService.fusionar(req.principalId, req.duplicadoIds));
    }

    public static class FusionRequest {
        public Long principalId;
        public List<Long> duplicadoIds;
    }

    @GetMapping("/{id}/historial")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Map<String, Object>>> historial(@PathVariable Long id) {
        List<EstadoOrden> estados = List.of(EstadoOrden.COMPRADA, EstadoOrden.RECIBIDA, EstadoOrden.CERRADA);
        List<DetalleOrden> detalles = detalleOrdenRepository.findHistorialByProductoId(id, estados);
        List<Map<String, Object>> result = detalles.stream().map(d -> {
            Map<String, Object> item = new HashMap<>();
            item.put("detalleId", d.getId());
            item.put("ordenId", d.getOrden().getId());
            item.put("fecha", d.getOrden().getFechaCompraReal() != null
                    ? d.getOrden().getFechaCompraReal().toLocalDate()
                    : d.getOrden().getFechaCompraPlanificada());
            item.put("formato", d.getFormato());
            item.put("cantidadComprada", d.getCantidadComprada());
            item.put("cantidadInterna", d.getCantidadInterna());
            item.put("costoTotal", d.getCostoTotal());
            item.put("costoUnitario", d.getCostoUnitarioCalculado());
            item.put("precioFinal", d.getPrecioFinalEditado());
            item.put("factura", d.getFactura());
            item.put("estadoProducto", d.getEstadoProducto());
            item.put("proveedorNombre", d.getOrden().getProveedor() != null
                    ? d.getOrden().getProveedor().getNombre() : null);
            return item;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }
}
