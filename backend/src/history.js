/**
 * Historial de estados de cada equipo.
 * statusHistory: [{ status, from (ISO), to (ISO | null) }], en orden cronológico;
 * el último tramo es el estado actual y tiene to = null.
 */

/** Máximo de tramos que se conservan por equipo (los más recientes). */
const MAX_SEGMENTS = 50;

/** Historial nuevo con un único tramo abierto desde `now`. */
const startHistory = (status, now = new Date()) => [{ status, from: now.toISOString(), to: null }];

/**
 * Registra un cambio de estado: cierra el tramo actual (to = now) y abre uno nuevo.
 * Si el estado no cambia, devuelve el historial tal cual.
 */
function transition(history, status, now = new Date()) {
  const list = Array.isArray(history) ? history.map((s) => ({ ...s })) : [];
  const last = list[list.length - 1];
  if (last && last.to === null && last.status === status) return list;

  const ts = now.toISOString();
  if (last && last.to === null) last.to = ts;
  list.push({ status, from: ts, to: null });
  return list.slice(-MAX_SEGMENTS);
}

/** Migración: si un equipo no tiene historial válido, se crea desde `now`. */
function ensureHistory(item, now = new Date()) {
  const h = item.statusHistory;
  if (Array.isArray(h) && h.length && h[h.length - 1].to === null) return item;
  return { ...item, statusHistory: startHistory(item.status, now) };
}

module.exports = { MAX_SEGMENTS, startHistory, transition, ensureHistory };
