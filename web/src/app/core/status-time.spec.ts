import { StatusSegment } from './machine.model';
import {
  currentSegment,
  formatDateTime,
  formatDuration,
  segmentDuration,
  timeInCurrentStatus,
  timeline,
  totalsByStatus,
} from './status-time';

const H = 3_600_000;
const D = 24 * H;
const t0 = Date.parse('2026-11-01T12:00:00Z');
const iso = (t: number) => new Date(t).toISOString();

const history: StatusSegment[] = [
  { status: 'disponible', from: iso(t0), to: iso(t0 + 2 * D) },
  { status: 'en_obra', from: iso(t0 + 2 * D), to: iso(t0 + 5 * D) },
  { status: 'disponible', from: iso(t0 + 5 * D), to: null },
];
const now = t0 + 8 * D + 4 * H;

describe('status-time', () => {
  it('formatea duraciones de forma compacta', () => {
    expect(formatDuration(0)).toBe('menos de 1 min');
    expect(formatDuration(8 * 60_000)).toBe('8 min');
    expect(formatDuration(5 * H + 12 * 60_000)).toBe('5 h 12 min');
    expect(formatDuration(2 * H)).toBe('2 h');
    expect(formatDuration(3 * D + 4 * H + 59 * 60_000)).toBe('3 d 4 h');
    expect(formatDuration(6 * D)).toBe('6 d');
    expect(formatDuration(Number.NaN)).toBe('menos de 1 min');
  });

  it('mide el tramo abierto contra la hora actual', () => {
    expect(segmentDuration(history[2], now)).toBe(3 * D + 4 * H);
    expect(segmentDuration(history[0], now)).toBe(2 * D);
    expect(currentSegment(history)?.status).toBe('disponible');
    expect(timeInCurrentStatus(history, now)).toBe(3 * D + 4 * H);
    expect(timeInCurrentStatus([], now)).toBeNull();
    expect(timeInCurrentStatus(undefined, now)).toBeNull();
  });

  it('acumula el tiempo por estado con porcentajes', () => {
    const totals = totalsByStatus(history, now);
    expect(totals.map((t) => t.status)).toEqual(['disponible', 'en_obra', 'mantenimiento']);
    expect(totals[0].ms).toBe(5 * D + 4 * H);
    expect(totals[1].ms).toBe(3 * D);
    expect(totals[2]).toEqual({ status: 'mantenimiento', ms: 0, percent: 0 });
    expect(totals[0].percent).toBe(63);
    expect(totals[1].percent).toBe(37);
  });

  it('devuelve ceros sin historial', () => {
    expect(totalsByStatus(undefined, now).every((t) => t.ms === 0 && t.percent === 0)).toBe(true);
  });

  it('ordena la línea de tiempo del más reciente al más antiguo', () => {
    const entries = timeline(history, now);
    expect(entries.map((e) => e.status)).toEqual(['disponible', 'en_obra', 'disponible']);
    expect(entries[0].current).toBe(true);
    expect(entries[0].ms).toBe(3 * D + 4 * H);
    expect(entries[2].current).toBe(false);
    expect(history[2].to).toBeNull();
  });

  it('formatea fechas en es-CO con la hora de Colombia', () => {
    const text = formatDateTime('2026-11-01T17:30:00Z');
    expect(text).toContain('2026');
    expect(text).toMatch(/12:30/);
    expect(formatDateTime('no-es-fecha')).toBe('—');
  });
});
