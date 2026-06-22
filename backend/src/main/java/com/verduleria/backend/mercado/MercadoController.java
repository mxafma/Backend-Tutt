package com.verduleria.backend.mercado;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Endpoints del histórico de precios de mercado.
 *
 * - GET /api/mercado/unidad-conversion  → público; lo lee el frontend de consultas
 *   para mostrar $/kg en vivo desde la única fuente de verdad (no factores hardcodeados).
 * - POST /api/mercado/ingesta/run       → TRIGGER MANUAL TEMPORAL para probar el job
 *   sin esperar al cron. Protegido por X-API-Key (INGESTA_API_KEY). BORRAR junto con
 *   este bloque una vez confirmado que la ingesta no duplica en una segunda corrida.
 */
@RestController
@RequestMapping("/api/mercado")
public class MercadoController {

    private final UnidadConversionService conversiones;
    private final OdepaIngestaService ingesta;

    public MercadoController(UnidadConversionService conversiones, OdepaIngestaService ingesta) {
        this.conversiones = conversiones;
        this.ingesta = ingesta;
    }

    @GetMapping("/unidad-conversion")
    public List<Map<String, Object>> unidadConversion() {
        return conversiones.listarParaApi();
    }

    // ───────────────── TRIGGER MANUAL TEMPORAL (borrar tras confirmar) ─────────────────
    @PostMapping("/ingesta/run")
    public ResponseEntity<?> runIngesta(
            @RequestHeader(value = "X-API-Key", required = false) String apiKey,
            @RequestParam(value = "resourceId", required = false) String resourceId) {

        String expected = System.getenv("INGESTA_API_KEY");
        if (expected == null || expected.isBlank() || !expected.equals(apiKey)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "API Key inválida"));
        }

        OdepaIngestaService.Resultado r = (resourceId == null || resourceId.isBlank())
                ? ingesta.ingestarAnioActual()
                : ingesta.ingestar(resourceId.trim());
        return ResponseEntity.ok(r.toMap());
    }
    // ────────────────────────────── fin trigger temporal ──────────────────────────────
}
