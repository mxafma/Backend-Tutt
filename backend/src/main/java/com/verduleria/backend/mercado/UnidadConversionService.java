package com.verduleria.backend.mercado;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Acceso a mercado.unidad_conversion, la única fuente de verdad de la conversión de
 * unidades. El backend (al guardar snapshots) y el frontend (para mostrar $/kg en
 * vivo) leen de aquí; ninguno calcula con factores hardcodeados.
 */
@Service
public class UnidadConversionService {

    /** Factores de conversión de una unidad de comercialización. */
    public record Conversion(BigDecimal kgPorUnidad, BigDecimal unidadesPorPack, String baseComparacion) {}

    private final JdbcTemplate jdbc;

    public UnidadConversionService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /** Carga toda la tabla en memoria (key = unidad_texto) para una corrida de ingesta. */
    public Map<String, Conversion> cargarMapa() {
        Map<String, Conversion> mapa = new HashMap<>();
        jdbc.query("""
                SELECT unidad_texto, kg_por_unidad, unidades_por_pack, base_comparacion
                FROM mercado.unidad_conversion
                """, rs -> {
            mapa.put(rs.getString("unidad_texto"), new Conversion(
                    rs.getBigDecimal("kg_por_unidad"),
                    rs.getBigDecimal("unidades_por_pack"),
                    rs.getString("base_comparacion")));
        });
        return mapa;
    }

    /**
     * Garantiza que una unidad_texto exista en la tabla. Si es nueva, la auto-siembra
     * por regex (revisado=false) para dejarla en cola de revisión humana, y la agrega
     * al mapa en memoria. No inventa: si el regex no deriva factor, queda en NULL.
     * Devuelve la conversión vigente para esa unidad.
     */
    public Conversion asegurarUnidad(String unidadTexto, Map<String, Conversion> cache) {
        if (unidadTexto == null) return new Conversion(null, null, null);
        Conversion existente = cache.get(unidadTexto);
        if (existente != null) return existente;

        UnidadConversionParser.Resultado r = UnidadConversionParser.parse(unidadTexto);
        jdbc.update("""
                INSERT INTO mercado.unidad_conversion
                    (unidad_texto, kg_por_unidad, unidades_por_pack, base_comparacion, revisado, notas)
                VALUES (?, ?, ?, ?, false, 'auto-seed por regex; pendiente de revisión')
                ON CONFLICT (unidad_texto) DO NOTHING
                """, unidadTexto, r.kgPorUnidad(), r.unidadesPorPack(), r.baseComparacion());

        Conversion conv = new Conversion(r.kgPorUnidad(), r.unidadesPorPack(), r.baseComparacion());
        cache.put(unidadTexto, conv);
        return conv;
    }

    /** Tabla completa para el frontend (GET público). */
    public List<Map<String, Object>> listarParaApi() {
        return jdbc.queryForList("""
                SELECT unidad_texto, kg_por_unidad, unidades_por_pack,
                       base_comparacion, revisado
                FROM mercado.unidad_conversion
                ORDER BY unidad_texto
                """);
    }
}
