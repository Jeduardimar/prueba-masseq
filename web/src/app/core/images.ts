import { API_BASE } from './api.config';
import { MACHINE_TYPES } from './machine.model';

/** Ilustración propia del tipo de equipo (servida por el backend). */
export function typeImage(type: string | null | undefined): string {
  const known = MACHINE_TYPES.some((t) => t.value === type);
  return `${API_BASE}/images/${known ? type : 'default'}.svg`;
}

/**
 * Resuelve la URL final de la imagen:
 * - vacía → ilustración del tipo
 * - empieza por "/" → relativa al backend (API_BASE)
 * - otra → URL externa tal cual
 */
export function resolveImage(image: string | null | undefined, type: string | null | undefined): string {
  const img = (image ?? '').trim();
  if (!img) return typeImage(type);
  if (img.startsWith('/')) return `${API_BASE}${img}`;
  return img;
}
