const test = require('node:test');
const assert = require('node:assert/strict');
const { MAX_SEGMENTS, startHistory, transition, ensureHistory } = require('../src/history');

const t0 = new Date('2026-11-01T12:00:00Z');
const t1 = new Date('2026-11-05T15:30:00Z');

test('startHistory abre un único tramo', () => {
  assert.deepEqual(startHistory('disponible', t0), [
    { status: 'disponible', from: t0.toISOString(), to: null },
  ]);
});

test('transition cierra el tramo actual y abre uno nuevo', () => {
  const h = transition(startHistory('disponible', t0), 'en_obra', t1);
  assert.deepEqual(h, [
    { status: 'disponible', from: t0.toISOString(), to: t1.toISOString() },
    { status: 'en_obra', from: t1.toISOString(), to: null },
  ]);
});

test('transition no toca el historial si el estado no cambia', () => {
  const h = startHistory('en_obra', t0);
  assert.deepEqual(transition(h, 'en_obra', t1), h);
});

test('transition conserva solo los 50 tramos más recientes', () => {
  let h = startHistory('disponible', t0);
  for (let i = 1; i <= 60; i++) {
    h = transition(h, i % 2 ? 'en_obra' : 'disponible', new Date(t0.getTime() + i * 3600000));
  }
  assert.equal(h.length, MAX_SEGMENTS);
  assert.equal(h.at(-1).to, null);
  assert.equal(h.filter((s) => s.to === null).length, 1);
});

test('ensureHistory migra equipos sin historial', () => {
  const m = ensureHistory({ id: 1, status: 'mantenimiento' }, t0);
  assert.deepEqual(m.statusHistory, startHistory('mantenimiento', t0));
  assert.equal(ensureHistory(m, t1), m);
});

test('el seed tiene un historial coherente con el estado actual', () => {
  const seed = require('../data/seed.json');
  for (const m of seed) {
    const h = m.statusHistory;
    assert.ok(h.length >= 2 && h.length <= 5, `tramos de ${m.id}`);
    assert.equal(h.at(-1).status, m.status);
    assert.equal(h.at(-1).to, null);
    for (let i = 0; i < h.length - 1; i++) {
      assert.equal(h[i].to, h[i + 1].from);
      assert.notEqual(h[i].status, h[i + 1].status);
      assert.ok(Date.parse(h[i].from) < Date.parse(h[i].to));
    }
  }
});
