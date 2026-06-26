/**
 * Normaliza texto para búsquedas y comparación de nombres:
 * quita tildes/diacríticos, pasa a minúsculas y colapsa espacios.
 * Así "Plátano" y "platano" se consideran iguales y se evita duplicar productos.
 */
export function normalizar(texto: string): string {
  return (texto ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

/** Devuelve true si `texto` contiene `termino` ignorando tildes y mayúsculas. */
export function coincide(texto: string, termino: string): boolean {
  return normalizar(texto).includes(normalizar(termino));
}
