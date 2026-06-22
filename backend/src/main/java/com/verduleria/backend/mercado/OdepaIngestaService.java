package com.verduleria.backend.mercado;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Date;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Job de ingesta del histórico de precios mayoristas de Lo Valledor.
 * Lee ODEPA (server-to-server), calcula derivadas leyendo mercado.unidad_conversion,
 * e inserta de forma idempotente en mercado.precio_snapshot.
 */
@Service
public class OdepaIngestaService {

    private static final Logger log = LoggerFactory.getLogger(OdepaIngestaService.class);

    /** Versión del parser/tabla de conversión que generó las derivadas. Subir al mejorar. */
    public static final int CONVERSION_VERSION = 1;

    private static final int PAGE = 10_000;
    private static final int MAX_PAGES = 30;   // tope de seguridad (~300k filas)
    private static final int BATCH = 1_000;    // filas por batchUpdate (round-trips a la BD)

    private final OdepaClient odepa;
    private final UnidadConversionService conversiones;
    private final JdbcTemplate jdbc;
    private final ObjectMapper mapper;

    public OdepaIngestaService(OdepaClient odepa, UnidadConversionService conversiones,
                               JdbcTemplate jdbc, ObjectMapper mapper) {
        this.odepa = odepa;
        this.conversiones = conversiones;
        this.jdbc = jdbc;
        this.mapper = mapper;
    }

    private static final String INSERT_SNAPSHOT_SQL = """
            INSERT INTO mercado.precio_snapshot
                (resource_id, odepa_id, fecha, producto, variedad, calidad, mercado,
                 subsector, region, id_region, origen, volumen, unidad_texto,
                 precio_min, precio_max, precio_promedio,
                 precio_por_kg, precio_por_unidad, base_comparacion,
                 conversion_version, record_raw)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?::jsonb)
            ON CONFLICT (resource_id, odepa_id) DO NOTHING
            """;

    public record Resultado(String resourceId, int leidos, int insertados, int saltados) {
        public Map<String, Object> toMap() {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("resourceId", resourceId);
            m.put("leidos", leidos);
            m.put("insertados", insertados);
            m.put("saltados", saltados);
            return m;
        }
    }

    /** Ingesta del resource mayorista del año en curso. */
    public Resultado ingestarAnioActual() {
        String resourceId = odepa.resourceMayoristaAnioActual();
        if (resourceId == null) {
            throw new IllegalStateException(
                    "No hay resource_id mayorista configurado para el año " + java.time.Year.now());
        }
        return ingestar(resourceId);
    }

    /**
     * Ingesta de un resource concreto, paginando todas las filas de Lo Valledor.
     * Inserta por lotes (batchUpdate) para no hacer un round-trip por fila contra la
     * BD remota. insertados/saltados se calculan con count(*) antes/después, robusto
     * frente a lo que devuelva el driver en modo batch.
     */
    public Resultado ingestar(String resourceId) {
        Map<String, UnidadConversionService.Conversion> conv = conversiones.cargarMapa();

        long antes = contar(resourceId);
        int leidos = 0;
        for (int pagina = 0; pagina < MAX_PAGES; pagina++) {
            int offset = pagina * PAGE;
            OdepaClient.Pagina p = odepa.buscar(
                    resourceId, OdepaClient.MERCADO_LO_VALLEDOR, PAGE, offset);

            if (p.records().isEmpty()) break;

            List<Object[]> batch = new ArrayList<>(p.records().size());
            for (JsonNode rec : p.records()) {
                leidos++;
                Object[] params = construirParams(resourceId, rec, conv);
                if (params != null) batch.add(params);
            }
            insertarLote(batch);

            if (offset + p.records().size() >= p.total()) break;
        }

        long despues = contar(resourceId);
        int insertados = (int) (despues - antes);
        int saltados = leidos - insertados;
        log.info("Ingesta ODEPA resource={} leidos={} insertados={} saltados={}",
                resourceId, leidos, insertados, saltados);
        return new Resultado(resourceId, leidos, insertados, saltados);
    }

    private long contar(String resourceId) {
        Long n = jdbc.queryForObject(
                "SELECT count(*) FROM mercado.precio_snapshot WHERE resource_id = ?",
                Long.class, resourceId);
        return n == null ? 0 : n;
    }

    private void insertarLote(List<Object[]> batch) {
        for (int i = 0; i < batch.size(); i += BATCH) {
            List<Object[]> chunk = batch.subList(i, Math.min(i + BATCH, batch.size()));
            jdbc.batchUpdate(INSERT_SNAPSHOT_SQL, chunk);
        }
    }

    /** Construye los parámetros del INSERT para un record, o null si no tiene _id. */
    private Object[] construirParams(String resourceId, JsonNode rec,
                                     Map<String, UnidadConversionService.Conversion> conv) {
        Long odepaId = asLong(rec.get("_id"));
        if (odepaId == null) return null; // sin llave estable no se puede deduplicar

        String unidad = text(rec, "Unidad de comercializacion");
        UnidadConversionService.Conversion c = conversiones.asegurarUnidad(unidad, conv);

        BigDecimal promedio = MercadoNumeros.parsePrecio(text(rec, "Precio promedio"));
        BigDecimal porKg = derivar(promedio, c.kgPorUnidad());
        BigDecimal porUnidad = derivar(promedio, c.unidadesPorPack());

        String recordRaw;
        try {
            recordRaw = mapper.writeValueAsString(rec);
        } catch (Exception e) {
            recordRaw = "{}";
        }

        return new Object[]{
                resourceId,
                odepaId,
                fecha(text(rec, "Fecha")),
                text(rec, "Producto"),
                text(rec, "Variedad / Tipo"),
                text(rec, "Calidad"),
                text(rec, "Mercado"),
                text(rec, "Subsector"),
                text(rec, "Region"),
                text(rec, "ID region"),
                text(rec, "Origen"),
                text(rec, "Volumen"),
                unidad,
                MercadoNumeros.parsePrecio(text(rec, "Precio minimo")),
                MercadoNumeros.parsePrecio(text(rec, "Precio maximo")),
                promedio,
                porKg,
                porUnidad,
                c.baseComparacion(),
                CONVERSION_VERSION,
                recordRaw
        };
    }

    /** precio / factor, o null si no hay precio o el factor falta/≤0 (no se inventa). */
    private static BigDecimal derivar(BigDecimal precio, BigDecimal factor) {
        if (precio == null || factor == null || factor.signum() <= 0) return null;
        return precio.divide(factor, 4, RoundingMode.HALF_UP);
    }

    // ── Lectura tolerante del JSON de ODEPA ──
    private static String text(JsonNode rec, String campo) {
        JsonNode n = rec.get(campo);
        if (n == null || n.isNull()) return null;
        String s = n.asText();
        return (s == null || s.isBlank()) ? null : s;
    }

    private static Long asLong(JsonNode n) {
        if (n == null || n.isNull()) return null;
        if (n.isNumber()) return n.asLong();
        try {
            return Long.parseLong(n.asText().trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static Date fecha(String s) {
        if (s == null) return null;
        try {
            return Date.valueOf(LocalDate.parse(s.substring(0, 10)));
        } catch (Exception e) {
            return null;
        }
    }
}
