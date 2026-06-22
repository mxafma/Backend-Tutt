package com.verduleria.backend.mercado;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Year;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Cliente server-to-server de la API CKAN de ODEPA (datastore_search). Sin CORS y con
 * reintentos: ODEPA devuelve 5xx intermitentes. Mismo enfoque de reintentos que el
 * proxy del frontend (api/search.js).
 */
@Component
public class OdepaClient {

    private static final Logger log = LoggerFactory.getLogger(OdepaClient.class);

    private static final String BASE =
            "https://datos.odepa.gob.cl/es/api/action/datastore_search";

    /** Único mercado de interés (string exacto confirmado contra los datos de ODEPA). */
    public static final String MERCADO_LO_VALLEDOR = "Mercado Mayorista Lo Valledor de Santiago";

    /** RESOURCE_IDS mayoristas por año (espejo de odepa.ts). */
    private static final Map<Integer, String> RESOURCE_MAYORISTA = Map.of(
            2024, "11b8b84f-f409-4fa8-9764-2c874e703cc3",
            2025, "92353fad-463e-4e85-a3ff-accb0286d0c5",
            2026, "580beca0-e87e-4dd4-9e8a-0bd92773f4a6");

    private static final int TRIES = 4;

    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            // ODEPA puede bloquear fetches no-navegador; un User-Agent normal lo evita.
            .build();
    private final ObjectMapper mapper;

    public OdepaClient(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    /** resource_id mayorista del año en curso, o null si no se conoce ese año. */
    public String resourceMayoristaAnioActual() {
        return RESOURCE_MAYORISTA.get(Year.now().getValue());
    }

    /** Una página de resultados de datastore_search. */
    public record Pagina(int total, List<JsonNode> records) {}

    /**
     * Consulta una página filtrando en origen por Mercado. Reintenta ante 5xx o fallos
     * de red con backoff lineal. Lanza RuntimeException si agota los reintentos.
     */
    public Pagina buscar(String resourceId, String mercado, int limit, int offset) {
        String filters = "{\"Mercado\":\"" + mercado + "\"}";
        String url = BASE
                + "?resource_id=" + enc(resourceId)
                + "&limit=" + limit
                + "&offset=" + offset
                + "&filters=" + enc(filters);

        HttpRequest req = HttpRequest.newBuilder(URI.create(url))
                .timeout(Duration.ofSeconds(60))
                .header("User-Agent", "verduleria-backend/1.0 (+ingesta odepa)")
                .header("Accept", "application/json")
                .GET()
                .build();

        RuntimeException last = null;
        for (int intento = 0; intento < TRIES; intento++) {
            try {
                HttpResponse<String> res = http.send(req, HttpResponse.BodyHandlers.ofString());
                if (res.statusCode() >= 500) {
                    throw new RuntimeException("ODEPA HTTP " + res.statusCode());
                }
                if (res.statusCode() != 200) {
                    throw new RuntimeException("ODEPA HTTP " + res.statusCode() + ": "
                            + abreviar(res.body()));
                }
                JsonNode root = mapper.readTree(res.body());
                JsonNode result = root.path("result");
                int total = result.path("total").asInt(0);
                List<JsonNode> records = new ArrayList<>();
                result.path("records").forEach(records::add);
                return new Pagina(total, records);
            } catch (Exception e) {
                last = (e instanceof RuntimeException re) ? re : new RuntimeException(e);
                log.warn("ODEPA intento {}/{} falló: {}", intento + 1, TRIES, e.getMessage());
                if (intento < TRIES - 1) {
                    dormir(400L * (intento + 1));
                }
            }
        }
        throw last != null ? last : new RuntimeException("ODEPA: fallo desconocido");
    }

    private static String enc(String s) {
        return URLEncoder.encode(s, StandardCharsets.UTF_8);
    }

    private static String abreviar(String s) {
        if (s == null) return "";
        return s.length() > 200 ? s.substring(0, 200) : s;
    }

    private static void dormir(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
        }
    }
}
