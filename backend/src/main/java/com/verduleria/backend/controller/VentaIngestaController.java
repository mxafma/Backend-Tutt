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
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Recibe los datos del agente de sincronización de Eleventa.
 * Endpoints públicos (sin JWT) protegidos por API Key vía header X-API-Key,
 * validado contra la variable de entorno INGESTA_API_KEY.
 *
 * Usa JdbcTemplate con SQL nativo (NO JPA): las tablas eleventa.ventatickets
 * (cabecera) y eleventa.ventatickets_articulos (detalle) ya existen con datos.
 * Cada POST trae filas del JOIN cabecera+detalle; el controlador las agrupa por
 * ticketId, inserta primero la cabecera y luego cada línea. La deduplicación es a
 * nivel de BD con ON CONFLICT (id) en la cabecera y ON CONFLICT
 * (ticket_id, producto_codigo) en el detalle, de modo que reenviar es idempotente.
 */
@RestController
@RequestMapping("/api/ventas")
public class VentaIngestaController {

    private final JdbcTemplate jdbc;

    public VentaIngestaController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private static final String INSERT_CABECERA_SQL = """
            INSERT INTO eleventa.ventatickets
            (id, folio, cajero_id, nombre, vendido_en, pagado_en, subtotal, impuestos,
             total, ganancia, forma_pago, turno_id, cliente_id, numero_articulos)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            ON CONFLICT (id) DO NOTHING
            """;

    private static final String INSERT_LINEA_SQL = """
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
            return ResponseEntity.ok(Map.of("tickets", 0, "lineas", 0, "saltados", 0));
        }

        // 1) Agrupar las filas del batch por ticketId, preservando el orden de llegada.
        //    La primera fila de cada ticket aporta los datos de cabecera (todas las
        //    filas de un mismo ticket repiten esos campos por venir del JOIN).
        Map<Long, List<Map<String, Object>>> porTicket = new LinkedHashMap<>();
        for (Map<String, Object> fila : filas) {
            Long ticketId = asLong(get(fila, "ticketId", "ticket_id", "TICKET_ID"));
            if (ticketId == null) continue; // fila sin ticket: no se puede ubicar, se ignora
            porTicket.computeIfAbsent(ticketId, k -> new java.util.ArrayList<>()).add(fila);
        }

        int ticketsInsertados = 0;
        int lineasInsertadas = 0;

        // 2) Por cada ticket: insertar primero la cabecera y luego sus líneas.
        for (Map.Entry<Long, List<Map<String, Object>>> entry : porTicket.entrySet()) {
            Long ticketId = entry.getKey();
            List<Map<String, Object>> lineas = entry.getValue();
            Map<String, Object> cab = lineas.get(0);

            Object[] cabParams = new Object[]{
                    ticketId,
                    asInteger(get(cab, "folio", "FOLIO")),
                    asInteger(get(cab, "cajeroId", "cajero_id", "CAJERO_ID")),
                    asString(get(cab, "cajeroNombre", "cajero_nombre", "NOMBRE", "nombre")),
                    asTimestamp(get(cab, "vendidoEn", "vendido_en", "VENDIDO_EN")),
                    asTimestamp(get(cab, "pagadoEn", "pagado_en", "PAGADO_EN")),
                    asLong(get(cab, "subtotal", "SUBTOTAL")),
                    asLong(get(cab, "impuestos", "IMPUESTOS")),
                    asLong(get(cab, "total", "TOTAL")),
                    asLong(get(cab, "ganancia", "GANANCIA")),
                    asString(get(cab, "formaPago", "forma_pago", "FORMA_PAGO")),
                    asInteger(get(cab, "turnoId", "turno_id", "TURNO_ID")),
                    asInteger(get(cab, "clienteId", "cliente_id", "CLIENTE_ID")),
                    asInteger(get(cab, "numeroArticulos", "numero_articulos", "NUMERO_ARTICULOS"))
            };
            ticketsInsertados += jdbc.update(INSERT_CABECERA_SQL, cabParams);

            // 3) Insertar cada línea del ticket.
            for (Map<String, Object> fila : lineas) {
                Double cantidadDevuelta = asDouble(get(fila, "cantidadDevuelta", "cantidad_devuelta", "CANTIDAD_DEVUELTA"));

                Object[] lineaParams = new Object[]{
                        ticketId,
                        asInteger(get(fila, "folio", "FOLIO")),
                        asInteger(get(fila, "cajeroId", "cajero_id", "CAJERO_ID")),
                        asString(get(fila, "cajeroNombre", "cajero_nombre", "CAJERO_NOMBRE")),
                        asTimestamp(get(fila, "vendidoEn", "vendido_en", "VENDIDO_EN")),
                        asTimestamp(get(fila, "pagadoEn", "pagado_en", "PAGADO_EN")),
                        // La columna `ganancia` de la línea proviene de lineaGanancia, NO de ganancia.
                        asLong(get(fila, "lineaGanancia", "linea_ganancia", "LINEA_GANANCIA")),
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
                lineasInsertadas += jdbc.update(INSERT_LINEA_SQL, lineaParams);
            }
        }

        // saltados = líneas del batch que ya existían (ON CONFLICT DO NOTHING).
        int saltados = filas.size() - lineasInsertadas;
        return ResponseEntity.ok(Map.of(
                "tickets", ticketsInsertados,
                "lineas", lineasInsertadas,
                "saltados", saltados));
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
