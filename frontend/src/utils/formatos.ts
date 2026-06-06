const KEY = 'gestion_oc_formatos';
const DEFAULT: string[] = ['Bins', 'Caja', 'Malla', 'Saco', 'Bandeja', 'Unidad', 'Kilo', 'Paquete'];

export function getFormatos(): string[] {
  try {
    const stored = localStorage.getItem(KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [...DEFAULT];
}

export function saveFormatos(list: string[]): void {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export const DEFAULT_FORMATOS = DEFAULT;
