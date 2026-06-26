package com.verduleria.backend.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Reportes que cruzan los tres schemas de la misma base PostgreSQL:
 *   public   → compras (ordenes_compra, detalle_ordenes, productos)
 *   eleventa → ventas POS (ventatickets_articulos)
 *
 * Se usa SQL nativo vía JdbcTemplate (mismo patrón que la ingesta de eleventa/mercado),
 * a propósito: son consultas de solo lectura que agregan a través de schemas y no
 * encajan en el modelo JPA de `public`.
 *
 * El cruce producto-de-compra ↔ producto-vendido se hace por NOMBRE NORMALIZADO
 * (sin tildes/mayúsculas, vía ProductoService.normalizar), porque hoy no existe un
 * mapeo explícito entre el id de producto de la OC y el código de Eleventa. Es la
 * misma normalización que evita duplicados en el catálogo. Un mapeo manual
 * (producto_link) mejoraría la precisión más adelante.
 */
@Service
public class ReporteService {

    private final JdbcTemplate jdbc;

    public ReporteService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private static final String SQL_COMPRAS = """
            SELECT p.nombre AS nombre,
                   COALESCE(SUM(d.costo_total), 0)       AS comprado,
                   COALESCE(SUM(d.cantidad_comprada), 0) AS cant_comprada
            FROM detalle_ordenes d
            JOIN ordenes_compra o ON o.id = d.orden_id
            JOIN productos p       ON p.id = d.producto_id
            WHERE o.estado IN ('COMPRADA', 'RECIBIDA', 'CERRADA')
              AND COALESCE(
                    NULLIF(o.fecha_compra_real::text, '')::date,
                    NULLIF(o.fecha_compra_planificada::text, '')::date
                  ) BETWEEN ? AND ?
            GROUP BY p.nombre
            """;

    private static final String SQL_VENTAS = """
            SELECT producto_nombre AS nombre,
                   COALESCE(SUM(total_articulo), 0) AS vendido,
                   COALESCE(SUM(linea_ganancia), 0) AS ganancia,
                   COALESCE(SUM(cantidad), 0)       AS cant_vendida
            FROM eleventa.ventatickets_articulos
            WHERE NULLIF(vendido_en::text, '')::date BETWEEN ? AND ?
            GROUP BY producto_nombre
            """;

    /**
     * Rentabilidad por producto en el rango [desde, hasta]: cuánto se compró ($),
     * cuánto se vendió ($), ganancia reportada por Eleventa y margen real.
     */
    public Map<String, Object> rentabilidad(LocalDate desde, LocalDate hasta) {
        Map<String, Fila> porProducto = new LinkedHashMap<>();

        // 1) Compras (public)
        for (Map<String, Object> r : jdbc.queryForList(SQL_COMPRAS, desde, hasta)) {
            String nombre = (String) r.get("nombre");
            Fila f = porProducto.computeIfAbsent(ProductoService.normalizar(nombre), k -> new Fila(nombre));
            f.comprado += num(r.get("comprado"));
            f.cantComprada += num(r.get("cant_comprada"));
        }

        // 2) Ventas (eleventa) — se mergean por nombre normalizado
        for (Map<String, Object> r : jdbc.queryForList(SQL_VENTAS, desde, hasta)) {
            String nombre = (String) r.get("nombre");
            if (nombre == null || nombre.isBlank()) continue;
            Fila f = porProducto.computeIfAbsent(ProductoService.normalizar(nombre), k -> new Fila(nombre));
            f.vendido += num(r.get("vendido"));
            f.ganancia += num(r.get("ganancia"));
            f.cantVendida += num(r.get("cant_vendida"));
        }

        List<Map<String, Object>> items = new ArrayList<>();
        double totComprado = 0, totVendido = 0, totGanancia = 0;
        for (Fila f : porProducto.values()) {
            totComprado += f.comprado;
            totVendido += f.vendido;
            totGanancia += f.ganancia;
            items.add(f.toMap());
        }
        // Orden: lo más vendido primero (más relevante para el negocio).
        items.sort((a, b) -> Double.compare(num(b.get("vendido")), num(a.get("vendido"))));

        Map<String, Object> totales = new LinkedHashMap<>();
        totales.put("comprado", totComprado);
        totales.put("vendido", totVendido);
        totales.put("ganancia", totGanancia);
        totales.put("margenReal", totVendido > 0 ? (totVendido - totComprado) / totVendido * 100 : null);

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("desde", desde.toString());
        resp.put("hasta", hasta.toString());
        resp.put("items", items);
        resp.put("totales", totales);
        return resp;
    }

    private static double num(Object o) {
        return o instanceof Number n ? n.doubleValue() : 0d;
    }

    /** Acumulador por producto antes de pasarlo a Map de respuesta. */
    private static class Fila {
        final String nombre;
        double comprado, vendido, ganancia, cantComprada, cantVendida;

        Fila(String nombre) { this.nombre = nombre; }

        Map<String, Object> toMap() {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("producto", nombre);
            m.put("comprado", comprado);
            m.put("vendido", vendido);
            m.put("ganancia", ganancia);
            m.put("cantComprada", cantComprada);
            m.put("cantVendida", cantVendida);
            m.put("margenReal", vendido > 0 ? (vendido - comprado) / vendido * 100 : null);
            // Pista para el frontend: producto sin contraparte en el período.
            String cobertura = comprado > 0 && vendido > 0 ? "ok"
                    : comprado > 0 ? "solo_compra" : "solo_venta";
            m.put("cobertura", cobertura);
            return m;
        }
    }
}
