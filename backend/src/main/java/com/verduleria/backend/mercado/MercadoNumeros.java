package com.verduleria.backend.mercado;

import java.math.BigDecimal;

/** Parseo de los precios de ODEPA, que vienen como string. */
public final class MercadoNumeros {

    private MercadoNumeros() {}

    /**
     * Normaliza un precio de ODEPA a número. Formatos observados/posibles:
     *   "17000,0000"  → coma decimal (lo que entrega hoy ODEPA)
     *   "10.500,5"    → punto de miles + coma decimal (formato chileno)
     *   "3,5"         → coma decimal
     *   "10500"       → entero
     * Devuelve null si no se puede parsear (precio_por_kg quedará NULL, no se inventa).
     */
    public static BigDecimal parsePrecio(String raw) {
        if (raw == null) return null;
        String s = raw.trim();
        if (s.isEmpty()) return null;

        boolean tienePunto = s.indexOf('.') >= 0;
        boolean tieneComa = s.indexOf(',') >= 0;

        if (tienePunto && tieneComa) {
            // Chileno "10.500,5": el punto es separador de miles, la coma decimal.
            s = s.replace(".", "").replace(",", ".");
        } else if (tieneComa) {
            // Solo coma → decimal.
            s = s.replace(",", ".");
        }
        // Solo punto o solo dígitos: ODEPA no usa punto de miles sin coma, así que se
        // interpreta como punto decimal tal cual.
        try {
            return new BigDecimal(s);
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
