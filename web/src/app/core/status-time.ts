import { MachineStatus, StatusSegment } from './machine.model';

/** Funciones puras para calcular el tiempo en cada estado a partir de statusHistory. */

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export const STATUS_ORDER: MachineStatus[] = ['disponible', 'en_obra', 'mantenimiento'];

/** Duración legible y compacta: "3 d 4 h", "5 h 12 min", "8 min", "menos de 1 min". */
export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < MINUTE) return 'menos de 1 min';
  const days = Math.floor(ms / DAY);
  const hours = Math.floor((ms % DAY) / HOUR);
  const minutes = Math.floor((ms % HOUR) / MINUTE);
  if (days > 0) return hours > 0 ? `${days} d ${hours} h` : `${days} d`;
  if (hours > 0) return minutes > 0 ? `${hours} h ${minutes} min` : `${hours} h`;
  return `${minutes} min`;
}

/** Duración de un tramo; el tramo abierto (to = null) se mide contra `now`. */
export function segmentDuration(segment: StatusSegment, now: number): number {
  const from = Date.parse(segment.from);
  const to = segment.to === null ? now : Date.parse(segment.to);
  return Number.isFinite(from) && Number.isFinite(to) ? Math.max(0, to - from) : 0;
}

/** Tramo actual (el último) o null si no hay historial. */
export function currentSegment(history: StatusSegment[] | undefined): StatusSegment | null {
  return history?.length ? history[history.length - 1] : null;
}

/** Tiempo transcurrido en el estado actual, en ms (null si no hay historial). */
export function timeInCurrentStatus(history: StatusSegment[] | undefined, now: number): number | null {
  const current = currentSegment(history);
  return current ? segmentDuration(current, now) : null;
}

export interface StatusTotal {
  status: MachineStatus;
  ms: number;
  /** Porcentaje entero sobre el tiempo total del historial (0–100). */
  percent: number;
}

/** Tiempo acumulado por estado, siempre en el orden de STATUS_ORDER. */
export function totalsByStatus(history: StatusSegment[] | undefined, now: number): StatusTotal[] {
  const sums = new Map<MachineStatus, number>(STATUS_ORDER.map((s) => [s, 0]));
  for (const seg of history ?? []) {
    sums.set(seg.status, (sums.get(seg.status) ?? 0) + segmentDuration(seg, now));
  }
  const total = [...sums.values()].reduce((a, b) => a + b, 0);
  return STATUS_ORDER.map((status) => {
    const ms = sums.get(status) ?? 0;
    return { status, ms, percent: total > 0 ? Math.round((ms / total) * 100) : 0 };
  });
}

export interface TimelineEntry extends StatusSegment {
  ms: number;
  current: boolean;
}

/** Tramos del más reciente al más antiguo, con su duración. */
export function timeline(history: StatusSegment[] | undefined, now: number): TimelineEntry[] {
  return (history ?? [])
    .map((seg) => ({ ...seg, ms: segmentDuration(seg, now), current: seg.to === null }))
    .reverse();
}

const dateTimeFormat = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'America/Bogota',
});

/** Fecha y hora en formato es-CO (hora de Colombia). */
export function formatDateTime(iso: string): string {
  const t = Date.parse(iso);
  return Number.isFinite(t) ? dateTimeFormat.format(t) : '—';
}
