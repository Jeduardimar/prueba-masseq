/**
 * Almacenamiento simple en archivo JSON.
 * - Los datos viven en memoria y se escriben en data/db.json tras cada cambio.
 * - Si db.json no existe, se crea a partir de data/seed.json (datos iniciales).
 */
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const SEED_FILE = path.join(DATA_DIR, 'seed.json');

let items = [];

const normalize = (s) =>
  String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

function load() {
  if (!fs.existsSync(DB_FILE)) {
    fs.copyFileSync(SEED_FILE, DB_FILE);
  }
  items = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function persist() {
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(items, null, 2), 'utf8');
  fs.renameSync(tmp, DB_FILE);
}

const nextId = () => items.reduce((max, m) => Math.max(max, m.id), 0) + 1;

/** Lista todos los equipos; si hay búsqueda, filtra por nombre, marca o modelo (sin tildes). */
function all(search) {
  const q = normalize(search).trim();
  if (!q) return items;
  return items.filter((m) => normalize(`${m.title} ${m.brand} ${m.model}`).includes(q));
}

const count = () => items.length;

const findById = (id) => items.find((m) => m.id === id) || null;

function create(data) {
  const item = { id: nextId(), ...data };
  items.push(item);
  persist();
  return item;
}

function update(id, data) {
  const index = items.findIndex((m) => m.id === id);
  if (index === -1) return null;
  items[index] = { ...items[index], ...data, id };
  persist();
  return items[index];
}

function remove(id) {
  const index = items.findIndex((m) => m.id === id);
  if (index === -1) return false;
  items.splice(index, 1);
  persist();
  return true;
}

module.exports = { load, all, count, findById, create, update, remove };
