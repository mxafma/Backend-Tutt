package com.verduleria.backend.mercado;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Dispara la ingesta semanal del histórico de precios. ODEPA actualiza ~1 vez por
 * semana, así que se corre los lunes a las 06:00 (zona de Santiago). Como la ingesta
 * es idempotente, correr de más no duplica.
 */
@Component
public class MercadoScheduler {

    private static final Logger log = LoggerFactory.getLogger(MercadoScheduler.class);

    private final OdepaIngestaService ingesta;

    public MercadoScheduler(OdepaIngestaService ingesta) {
        this.ingesta = ingesta;
    }

    @Scheduled(cron = "0 0 6 * * MON", zone = "America/Santiago")
    public void ingestaSemanal() {
        try {
            OdepaIngestaService.Resultado r = ingesta.ingestarAnioActual();
            log.info("Ingesta semanal OK: {}", r.toMap());
        } catch (Exception e) {
            // No relanzar: un fallo de ODEPA no debe tumbar el scheduler; reintenta la
            // próxima semana (o se dispara manualmente).
            log.error("Ingesta semanal falló: {}", e.getMessage(), e);
        }
    }
}
