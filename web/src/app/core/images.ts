import { API_BASE } from './api.config';
import { MACHINE_TYPES } from './machine.model';

const knownType = (type: string | null | undefined): string =>
  MACHINE_TYPES.some((t) => t.value === type) ? (type as string) : 'volqueta';

/** Foto por defecto del tipo de equipo (servida por el backend). */
export function typePhoto(type: string | null | undefined): string {
  return `${API_BASE}/images/${knownType(type)}.jpg`;
}

/** Ilustración SVG del tipo (respaldo si la foto no carga). */
export function typeIllustration(type: string | null | undefined): string {
  return `${API_BASE}/images/${knownType(type)}.svg`;
}

/**
 * Resuelve la URL final de la imagen:
 * - vacía → foto del tipo
 * - empieza por "/" → relativa al backend (API_BASE)
 * - otra → URL externa tal cual
 */
export function resolveImage(image: string | null | undefined, type: string | null | undefined): string {
  const img = (image ?? '').trim();
  if (!img) return typePhoto(type);
  if (img.startsWith('/')) return `${API_BASE}${img}`;
  return img;
}
