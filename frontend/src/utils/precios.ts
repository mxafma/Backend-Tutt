// Cálculo de costos y precios sugeridos.
// Fuente única de verdad usada por Recepción y Compra Directa.

export interface DatosCalculoPrecio {
  cantidadComprada: number;
  costoTotal: number;
  factura: boolean;
  cantidadInterna: number;
  margenSugerido: number;
  precioFinalEditado: number;
}

export interface CalculosPrecio {
  costoConsiderado: number;
  totalInterno: number;
  costoUnitario: number;
  precioSugerido: number;
  margenResultante: number;
  unidadLabel: string;
}

// Redondeo hacia abajo a la decena más cercana (ej: 1.875 -> 1.870).
export const redondearDecena = (valor: number): number => Math.floor(valor / 10) * 10;

export function calcularPrecios(edit: DatosCalculoPrecio): CalculosPrecio {
  // Compra sin factura: el costo se considera con IVA (×1,19).
  const costoConsiderado = edit.factura
    ? edit.costoTotal
    : Math.round(edit.costoTotal * 1.19);

  const totalInterno =
    edit.cantidadComprada > 0 && edit.cantidadInterna > 0
      ? edit.cantidadComprada * edit.cantidadInterna
      : 0;

  const costoUnitario =
    totalInterno > 0
      ? costoConsiderado / totalInterno
      : edit.cantidadComprada > 0
      ? costoConsiderado / edit.cantidadComprada
      : 0;

  // Margen sobre el precio de venta: precio = costo / (1 - margen).
  const precioSugerido =
    costoUnitario > 0 && edit.margenSugerido < 100
      ? redondearDecena(costoUnitario / (1 - edit.margenSugerido / 100))
      : 0;

  const margenResultante =
    edit.precioFinalEditado > 0 && costoUnitario > 0
      ? ((edit.precioFinalEditado - costoUnitario) / edit.precioFinalEditado) * 100
      : 0;

  const unidadLabel = totalInterno > 0 ? 'unidad' : 'formato';

  return { costoConsiderado, totalInterno, costoUnitario, precioSugerido, margenResultante, unidadLabel };
}
