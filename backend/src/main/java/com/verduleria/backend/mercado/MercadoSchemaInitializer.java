package com.verduleria.backend.mercado;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Crea (idempotentemente) el schema dedicado `mercado` con la tabla de snapshots de
 * precios y la tabla de conversión de unidades, más sus índices, y siembra
 * unidad_conversion con las unidades conocidas hoy.
 *
 * Se usa SQL nativo vía JdbcTemplate (no JPA) a propósito: así Hibernate
 * (ddl-auto=update) nunca toca el schema `mercado` y queda totalmente aislado de
 * `public` (compras) y `eleventa` (POS). Mismo patrón que VentaIngestaController.
 *
 * Todo es IF NOT EXISTS / ON CONFLICT DO NOTHING, por lo que arrancar la app N veces
 * no rompe ni pisa datos editados a mano.
 */
@Component
@Order(1)
public class MercadoSchemaInitializer implements ApplicationRunner {

    private final JdbcTemplate jdbc;

    public MercadoSchemaInitializer(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(ApplicationArguments args) {
        jdbc.execute("CREATE SCHEMA IF NOT EXISTS mercado");

        // ── Tabla de conversión de unidades (fuente de verdad de la conversión) ──
        jdbc.execute("""
                CREATE TABLE IF NOT EXISTS mercado.unidad_conversion (
                    unidad_texto       text PRIMARY KEY,
                    kg_por_unidad      numeric,
                    unidades_por_pack  numeric,
                    base_comparacion   text CHECK (base_comparacion IN ('kg','u')),
                    revisado           boolean NOT NULL DEFAULT false,
                    notas              text,
                    creado_en          timestamptz NOT NULL DEFAULT now(),
                    actualizado_en     timestamptz NOT NULL DEFAULT now()
                )
                """);

        // ── Tabla de snapshots de precios (crudo inmutable + derivadas) ──
        jdbc.execute("""
                CREATE TABLE IF NOT EXISTS mercado.precio_snapshot (
                    id                  bigserial PRIMARY KEY,
                    resource_id         text NOT NULL,
                    odepa_id            bigint NOT NULL,
                    fecha               date,
                    producto            text,
                    variedad            text,
                    calidad             text,
                    mercado             text,
                    subsector           text,
                    region              text,
                    id_region           text,
                    origen              text,
                    volumen             text,
                    unidad_texto        text,
                    -- Crudo (inmutable): precios tal como vienen, ya normalizados a número.
                    precio_min          numeric,
                    precio_max          numeric,
                    precio_promedio     numeric,
                    -- Derivadas (recalculables vía backfill al mejorar la conversión).
                    precio_por_kg       numeric,
                    precio_por_unidad   numeric,
                    base_comparacion    text CHECK (base_comparacion IN ('kg','u')),
                    conversion_version  integer NOT NULL DEFAULT 1,
                    -- Record original completo por si ODEPA agrega un campo nuevo.
                    record_raw          jsonb,
                    capturado_en        timestamptz NOT NULL DEFAULT now(),
                    CONSTRAINT uq_precio_snapshot_origen UNIQUE (resource_id, odepa_id)
                )
                """);

        jdbc.execute("""
                CREATE INDEX IF NOT EXISTS ix_precio_snapshot_producto_fecha
                ON mercado.precio_snapshot (producto, fecha)
                """);
        jdbc.execute("""
                CREATE INDEX IF NOT EXISTS ix_precio_snapshot_precio_kg
                ON mercado.precio_snapshot (precio_por_kg)
                """);

        seedConversiones();
    }

    /**
     * Siembra las unidades conocidas hoy (tomadas de odepa.ts y confirmadas contra los
     * datos reales de Lo Valledor). Marcadas revisado=true porque su factor está
     * confirmado a mano. El resto de unidades se auto-siembran (revisado=false) cuando
     * el job de ingesta las encuentra por primera vez.
     */
    private void seedConversiones() {
        // base kg
        seed("$/kilo", "1", null, "kg");
        seed("$/saco 25 kilos", "25", null, "kg");
        seed("$/caja 10 kilos", "10", null, "kg");
        seed("$/caja 18 kilos", "18", null, "kg");
        seed("$/caja 20 kilos", "20", null, "kg");
        seed("$/malla 20 kilos", "20", null, "kg");
        seed("$/bolsa 800 grs", "0.8", null, "kg");
        // base unidad (por conteo)
        seed("$/unidad", null, "1", "u");
        seed("$/docena de atados", null, "12", "u");
        seed("$/docena de matas", null, "12", "u");
    }

    private void seed(String unidad, String kg, String pack, String base) {
        jdbc.update("""
                INSERT INTO mercado.unidad_conversion
                    (unidad_texto, kg_por_unidad, unidades_por_pack, base_comparacion, revisado, notas)
                VALUES (?, ?::numeric, ?::numeric, ?, true, 'seed inicial')
                ON CONFLICT (unidad_texto) DO NOTHING
                """, unidad, kg, pack, base);
    }
}
