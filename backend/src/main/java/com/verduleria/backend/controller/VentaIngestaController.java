package com.verduleria.backend.controller;

import com.verduleria.backend.model.VentaArticulo;
import com.verduleria.backend.repository.VentaArticuloRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

/**
 * Recibe los datos del agente de sincronización de Eleventa.
 * Endpoint público (sin JWT) protegido por API Key vía header X-API-Key,
 * validado contra la variable de entorno INGESTA_API_KEY.
 */
@RestController
@RequestMapping("/api/ventas")
public class VentaIngestaController {

    private final VentaArticuloRepository repository;

    public VentaIngestaController(VentaArticuloRepository repository) {
        this.repository = repository;
    }

    @PostMapping("/ingesta")
    public ResponseEntity<?> ingesta(
            @RequestHeader(value = "X-API-Key", required = false) String apiKey,
            @RequestBody List<Map<String, Object>> filas) {

        String expectedKey = System.getenv("INGESTA_API_KEY");
        if (expectedKey == null || expectedKey.isBlank() || !expectedKey.equals(apiKey)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "API Key inválida"));
        }

        if (filas == null || filas.isEmpty()) {
            return ResponseEntity.ok(Map.of("insertados", 0, "recibidos", 0));
        }

        int insertados = 0;
        for (Map<String, Object> fila : filas) {
            Long ticketId = asLong(get(fila, "ticketId", "ticket_id", "TICKET_ID"));
            String productoCodigo = asString(get(fila, "productoCodigo", "producto_codigo",
                    "productoCoigo", "PRODUCTO_CODIGO"));

            // UPSERT: si ya existe (TICKET_ID, PRODUCTO_CODIGO) se salta.
            if (ticketId != null && productoCodigo != null
                    && repository.existsByTicketIdAndProductoCodigo(ticketId, productoCodigo)) {
                continue;
            }

            VentaArticulo v = new VentaArticulo();
            v.setTicketId(ticketId);
            v.setFolio(asInteger(get(fila, "folio", "FOLIO")));
            v.setCajeroId(asInteger(get(fila, "cajeroId", "cajero_id", "CAJERO_ID")));
            v.setCajeroNombre(asString(get(fila, "cajeroNombre", "cajero_nombre", "CAJERO_NOMBRE")));
            v.setVendidoEn(asDateTime(get(fila, "vendidoEn", "vendido_en", "VENDIDO_EN")));
            v.setFormaPago(asString(get(fila, "formaPago", "forma_pago", "FORMA_PAGO")));
            v.setTurnoId(asInteger(get(fila, "turnoId", "turno_id", "TURNO_ID")));
            v.setClienteId(asInteger(get(fila, "clienteId", "cliente_id", "CLIENTE_ID")));
            v.setProductoCodigo(productoCodigo);
            v.setProductoNombre(asString(get(fila, "productoNombre", "producto_nombre", "PRODUCTO_NOMBRE")));
            v.setCantidad(asDouble(get(fila, "cantidad", "CANTIDAD")));
            v.setPrecioUsado(asLong(get(fila, "precioUsado", "precio_usado", "PRECIO_USADO")));
            v.setPrecioFinal(asLong(get(fila, "precioFinal", "precio_final", "PRECIO_FINAL")));
            v.setTotalArticulo(asLong(get(fila, "totalArticulo", "total_articulo", "TOTAL_ARTICULO")));
            v.setLineaGanancia(asLong(get(fila, "lineaGanancia", "linea_ganancia", "LINEA_GANANCIA")));
            v.setFueDevuelto(asString(get(fila, "fueDevuelto", "fue_devuelto", "FUE_DEVUELTO")));

            repository.save(v);
            insertados++;
        }

        return ResponseEntity.ok(Map.of(
                "insertados", insertados,
                "recibidos", filas.size()));
    }

    // --- Helpers de lectura tolerante de claves y conversión de tipos ---

    private static Object get(Map<String, Object> fila, String... claves) {
        for (String clave : claves) {
            if (fila.containsKey(clave) && fila.get(clave) != null) {
                return fila.get(clave);
            }
        }
        return null;
    }

    private static String asString(Object o) {
        return o == null ? null : o.toString();
    }

    private static Long asLong(Object o) {
        if (o == null) return null;
        if (o instanceof Number n) return n.longValue();
        try {
            return Long.parseLong(o.toString().trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static Integer asInteger(Object o) {
        if (o == null) return null;
        if (o instanceof Number n) return n.intValue();
        try {
            return Integer.parseInt(o.toString().trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static Double asDouble(Object o) {
        if (o == null) return null;
        if (o instanceof Number n) return n.doubleValue();
        try {
            return Double.parseDouble(o.toString().trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static LocalDateTime asDateTime(Object o) {
        if (o == null) return null;
        String s = o.toString().trim();
        if (s.isEmpty()) return null;
        // ISO-8601 con offset (ej. 2026-06-17T10:30:00-04:00)
        try {
            return OffsetDateTime.parse(s).toLocalDateTime();
        } catch (Exception ignored) {
        }
        // ISO-8601 sin offset (ej. 2026-06-17T10:30:00)
        try {
            return LocalDateTime.parse(s);
        } catch (Exception ignored) {
        }
        // Formato SQL tradicional (ej. 2026-06-17 10:30:00)
        try {
            return LocalDateTime.parse(s, DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        } catch (Exception ignored) {
        }
        return null;
    }
}
