package com.verduleria.backend.mercado;

import java.math.BigDecimal;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Port en Java de la lógica de normalización de unidades del frontend
 * (odepa-consultas/src/lib/odepa.ts: unitToKilos / unitToPieces).
 *
 * IMPORTANTE: esto NO es la fuente de verdad de la conversión. La fuente de verdad
 * es la tabla mercado.unidad_conversion. Este parser solo se usa para SEMBRAR esa
 * tabla (auto-seed por regex) cuando aparece una unidad_texto nueva, dejando
 * revisado = false. La edición humana sobre la tabla siempre manda. Mantener esta
 * lógica alineada con odepa.ts mientras el frontend conserve el fallback por regex.
 */
public final class UnidadConversionParser {

    private UnidadConversionParser() {}

    /** Resultado del parseo: factores derivables de una unidad_texto. */
    public record Resultado(BigDecimal kgPorUnidad, BigDecimal unidadesPorPack, String baseComparacion) {}

    // Espejo de unitToKilos: cuántos kilos representa una unidad de comercialización.
    private static final Pattern PACK_CANASTILLOS =
            Pattern.compile("([\\d.,]+)\\s*canastillos?\\s*([\\d.,]+)\\s*(kilo|gramo)");
    private static final Pattern RANGO_PESO =
            Pattern.compile("([\\d.,]+)\\s*a\\s*([\\d.,]+)\\s*(kilo|gramo)");
    private static final Pattern KILOS = Pattern.compile("([\\d.,]+)\\s*kilo");
    private static final Pattern GRAMOS = Pattern.compile("([\\d.,]+)\\s*(?:gramo|grs?\\b)");

    // Espejo de unitToPieces.
    private static final Pattern INNER_PIEZAS =
            Pattern.compile("([\\d.,]+)\\s*(?:unidad|mata|atado|paquete|canastillo|trenza)");
    private static final Pattern SINGULAR_PIEZA =
            Pattern.compile("\\b(unidad|mata|atado|paquete|trenza)s?\\b");
    private static final Pattern CIEN = Pattern.compile("\\b(cien|ciento)\\b");

    /**
     * Parsea una unidad de comercialización de ODEPA. base = 'kg' si es convertible a
     * kilos (tiene prioridad), 'u' si es por conteo, null si no se puede derivar.
     */
    public static Resultado parse(String unidadTexto) {
        if (unidadTexto == null) return new Resultado(null, null, null);
        String s = unidadTexto.toLowerCase().trim();

        BigDecimal kg = kilos(s);
        BigDecimal piezas = piezas(s);

        String base = kg != null ? "kg" : (piezas != null ? "u" : null);
        return new Resultado(kg, piezas, base);
    }

    // ── $/kg ────────────────────────────────────────────────────────────────────
    private static BigDecimal kilos(String s) {
        if (s.isEmpty()) return null;
        if (s.startsWith("$/kilo")) return BigDecimal.ONE; // ya viene por kilo

        // Pack multiplicativo "12 canastillos 125 gramos" = 12 × 125 g. Debe ir antes
        // que las coincidencias de peso simple, que leerían solo "125 gramos".
        Matcher pack = PACK_CANASTILLOS.matcher(s);
        if (pack.find()) {
            Double count = num(pack.group(1));
            Double each = num(pack.group(2));
            if (count != null && each != null && count > 0 && each > 0) {
                double eachKg = pack.group(3).equals("gramo") ? each / 1000 : each;
                return bd(count * eachKg);
            }
        }

        // Rango de peso "0,5 a 1 kilo" / "300 a 500 gramos" → punto medio.
        Matcher range = RANGO_PESO.matcher(s);
        if (range.find()) {
            Double a = num(range.group(1));
            Double b = num(range.group(2));
            if (a != null && b != null && a > 0 && b > 0) {
                double mid = (a + b) / 2;
                return bd(range.group(3).equals("gramo") ? mid / 1000 : mid);
            }
        }

        Matcher kg = KILOS.matcher(s);
        if (kg.find()) {
            Double n = num(kg.group(1));
            if (n != null && n > 0) return bd(n);
        }

        Matcher g = GRAMOS.matcher(s);
        if (g.find()) {
            Double n = num(g.group(1));
            if (n != null && n > 0) return bd(n / 1000);
        }

        return null;
    }

    // ── $/unidad ──────────────────────────────────────────────────────────────────
    private static BigDecimal piezas(String s) {
        if (s.isEmpty()) return null;

        // Nota: NO usar ternario anidado con int + null aquí. Java aplica promoción
        // numérica binaria y auto-desempaqueta a int, lo que lanza NPE cuando la rama
        // resultante es null (unidad sin "docena"/"cien"). Con if/else queda boxed.
        Integer outer;
        if (s.contains("media docena")) outer = 6;
        else if (s.contains("docena")) outer = 12;
        else if (CIEN.matcher(s).find()) outer = 100;
        else outer = null;

        Matcher inner = INNER_PIEZAS.matcher(s);
        Double innerN = inner.find() ? num(inner.group(1)) : null;

        if (outer != null && innerN != null && innerN > 0) return bd(outer * innerN);
        if (innerN != null && innerN > 0) return bd(innerN);
        if (outer != null) return bd(outer);
        if (SINGULAR_PIEZA.matcher(s).find()) return BigDecimal.ONE;
        return null;
    }

    /** Espejo de num() en odepa.ts: coma decimal → punto. */
    private static Double num(String s) {
        if (s == null) return null;
        try {
            return Double.parseDouble(s.replace(",", "."));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static BigDecimal bd(double v) {
        // 4 decimales: suficiente para 0,75 kg, 0,125 kg, etc. sin ruido binario.
        return BigDecimal.valueOf(v).stripTrailingZeros();
    }
}
