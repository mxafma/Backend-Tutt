package com.verduleria.backend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

/**
 * Recibe los datos del agente de sincronización de Eleventa.
 * Endpoints públicos (sin JWT) protegidos por API Key vía header X-API-Key,
 * validado contra la variable de entorno INGESTA_API_KEY.
 *
 * Usa JdbcTemplate con SQL nativo (NO JPA): la tabla eleventa.ventatickets_articulos
 * ya existe con datos y la deduplicación se hace con ON CONFLICT sobre el índice
 * único ux_ventatickets_articulos_ticket_producto (ticket_id, producto_codigo).
 */
@RestController
@RequestMapping("/api/ventas")
public class VentaIngestaController {

    private final JdbcTemplate jdbc;

    public VentaIngestaController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private static final String INSERT_SQL = """
            INSERT INTO eleventa.ventatickets_articulos
            (ticket_id, folio, cajero_id, cajero_nombre, vendido_en, pagado_en,
             ganancia, forma_pago, turno_id, cliente_id, producto_codigo,
             producto_nombre, cantidad, precio_usado, precio_final, total_articulo,
             linea_ganancia, fue_devuelto, cantidad_devuelta)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            ON CONFLICT (ticket_id, producto_codigo) DO NOTHING
            """;

    @PostMapping("/ingesta")
    public ResponseEntity<?> ingesta(
            @RequestHeader(value = "X-API-Key", required = false) String apiKey,
            @RequestBody List<Map<String, Object>> filas) {

        ResponseEntity<?> authError = checkApiKey(apiKey);
        if (authError != null) return authError;

        if (filas == null || filas.isEmpty()) {
            return ResponseEntity.ok(Map.of("insertadas", 0, "saltadas", 0));
        }

        int insertadas = 0;
        for (Map<String, Object> fila : filas) {
            Double cantidadDevuelta = asDouble(get(fila, "cantidadDevuelta", "cantidad_devuelta", "CANTIDAD_DEVUELTA"));

            Object[] params = new Object[]{
                    asLong(get(fila, "ticketId", "ticket_id", "TICKET_ID")),
                    asInteger(get(fila, "folio", "FOLIO")),
                    asInteger(get(fila, "cajeroId", "cajero_id", "CAJERO_ID")),
                    asString(get(fila, "cajeroNombre", "cajero_nombre", "CAJERO_NOMBRE")),
                    asTimestamp(get(fila, "vendidoEn", "vendido_en", "VENDIDO_EN")),
                    asTimestamp(get(fila, "pagadoEn", "pagado_en", "PAGADO_EN")),
                    asBigDecimal(get(fila, "ganancia", "GANANCIA")),
                    asString(get(fila, "formaPago", "forma_pago", "FORMA_PAGO")),
                    asInteger(get(fila, "turnoId", "turno_id", "TURNO_ID")),
                    asInteger(get(fila, "clienteId", "cliente_id", "CLIENTE_ID")),
                    asString(get(fila, "productoCodigo", "producto_codigo", "PRODUCTO_CODIGO")),
                    asString(get(fila, "productoNombre", "producto_nombre", "PRODUCTO_NOMBRE")),
                    asDouble(get(fila, "cantidad", "CANTIDAD")),
                    asLong(get(fila, "precioUsado", "precio_usado", "PRECIO_USADO")),
                    asLong(get(fila, "precioFinal", "precio_final", "PRECIO_FINAL")),
                    asLong(get(fila, "totalArticulo", "total_articulo", "TOTAL_ARTICULO")),
                    asLong(get(fila, "lineaGanancia", "linea_ganancia", "LINEA_GANANCIA")),
                    asString(get(fila, "fueDevuelto", "fue_devuelto", "FUE_DEVUELTO")),
                    // cantidad_devuelta es NOT NULL: default 0.0 si el agente no la envía.
                    cantidadDevuelta != null ? cantidadDevuelta : 0.0
            };

            insertadas += jdbc.update(INSERT_SQL, params);
        }

        int saltadas = filas.size() - insertadas;
        return ResponseEntity.ok(Map.of("insertadas", insertadas, "saltadas", saltadas));
    }

    /**
     * Repara el histórico: rellena vendido_en en los artículos que lo tienen NULL,
     * copiándolo del ticket padre en eleventa.ventatickets. Se corre una sola vez.
     */
    @PostMapping("/fix-fechas")
    public ResponseEntity<?> fixFechas(
            @RequestHeader(value = "X-API-Key", required = false) String apiKey) {

        ResponseEntity<?> authError = checkApiKey(apiKey);
        if (authError != null) return authError;

        int actualizadas = jdbc.update("""
                UPDATE eleventa.ventatickets_articulos va
                SET vendido_en = vt.vendido_en
                FROM eleventa.ventatickets vt
                WHERE va.ticket_id = vt.id
                  AND va.vendido_en IS NULL
                """);

        return ResponseEntity.ok(Map.of("actualizadas", actualizadas));
    }

    // --- Seguridad ---

    private ResponseEntity<?> checkApiKey(String apiKey) {
        String expectedKey = System.getenv("INGESTA_API_KEY");
        if (expectedKey == null || expectedKey.isBlank() || !expectedKey.equals(apiKey)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "API Key inválida"));
        }
        return null;
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

    private static BigDecimal asBigDecimal(Object o) {
        if (o == null) return null;
        if (o instanceof BigDecimal bd) return bd;
        if (o instanceof Number n) return BigDecimal.valueOf(n.doubleValue());
        try {
            return new BigDecimal(o.toString().trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static Timestamp asTimestamp(Object o) {
        LocalDateTime ldt = asDateTime(o);
        return ldt == null ? null : Timestamp.valueOf(ldt);
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
