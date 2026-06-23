package com.verduleria.backend.mercado;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Dispara la ingesta del histórico de precios dos veces al día. Verificado contra los
 * datos reales: ODEPA publica Lo Valledor todos los días hábiles (lun-vie, nada los
 * fines de semana) y con un rezago de uno o varios días, a hora impredecible. Por eso
 * se corre a las 07:00 y 14:00 (zona de Santiago): así se captura el dato el mismo día
 * que sale aunque la hora varíe. Las corridas sin dato nuevo insertan 0 (la ingesta es
 * idempotente), por lo que correr de más no duplica ni molesta.
 */
@Component
public class MercadoScheduler {

    private static final Logger log = LoggerFactory.getLogger(MercadoScheduler.class);

    private final OdepaIngestaService ingesta;

    public MercadoScheduler(OdepaIngestaService ingesta) {
        this.ingesta = ingesta;
    }

    @Scheduled(cron = "0 0 7,14 * * *", zone = "America/Santiago")
    public void ingestaProgramada() {
        try {
            OdepaIngestaService.Resultado r = ingesta.ingestarAnioActual();
            log.info("Ingesta programada OK: {}", r.toMap());
        } catch (Exception e) {
            // No relanzar: un fallo de ODEPA no debe tumbar el scheduler; reintenta en
            // la próxima corrida (o se dispara manualmente).
            log.error("Ingesta programada falló: {}", e.getMessage(), e);
        }
    }
}
