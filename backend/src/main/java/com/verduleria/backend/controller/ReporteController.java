package com.verduleria.backend.controller;

import com.verduleria.backend.service.ReporteService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

/**
 * Reportes administrativos que cruzan compras (public) y ventas (eleventa).
 * Solo ADMIN, según la regla del proyecto (reportes visibles solo para admin).
 */
@RestController
@RequestMapping("/api/reportes")
public class ReporteController {

    private final ReporteService reporteService;

    public ReporteController(ReporteService reporteService) {
        this.reporteService = reporteService;
    }

    @GetMapping("/rentabilidad")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> rentabilidad(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        if (hasta.isBefore(desde)) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(reporteService.rentabilidad(desde, hasta));
    }
}
