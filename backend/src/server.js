const path = require('path');
const express = require('express');
const cors = require('cors');
const store = require('./store');
const { validateMachine } = require('./validation');
const { TYPES, STATUSES, defaultImage } = require('./catalog');

const app = express();
const PORT = process.env.PORT || 3000;
const BASE = '/api/machines';

app.use(cors());
app.use(express.json({ limit: '1mb' }));
// Ilustraciones propias de cada tipo de equipo
app.use('/images', express.static(path.join(__dirname, '..', 'public', 'images'), { maxAge: '7d' }));

store.load();

const parseId = (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ message: 'El id debe ser un número entero positivo.' });
    return null;
  }
  return id;
};

app.get('/', (_req, res) => {
  res.json({
    name: 'API Flota de Maquinaria – Prueba técnica MASSEQ',
    endpoints: [
      `GET    ${BASE}?search=texto`,
      `GET    ${BASE}/:id`,
      `POST   ${BASE}`,
      `PUT    ${BASE}/:id`,
      `PATCH  ${BASE}/:id`,
      `DELETE ${BASE}/:id`,
      'GET    /api/catalog',
      'GET    /api/health',
    ],
  });
});

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Tipos de equipo y estados válidos (para los formularios del frontend)
app.get('/api/catalog', (_req, res) => {
  const toList = (obj) => Object.entries(obj).map(([value, label]) => ({ value, label }));
  res.json({ types: toList(TYPES), statuses: toList(STATUSES) });
});

// Listar (con búsqueda opcional)
app.get(BASE, (req, res) => {
  const search = typeof req.query.search === 'string' ? req.query.search : '';
  res.json(store.all(search));
});

// Detalle
app.get(`${BASE}/:id`, (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;
  const item = store.findById(id);
  if (!item) return res.status(404).json({ message: 'Equipo no encontrado.' });
  res.json(item);
});

// Crear
app.post(BASE, (req, res) => {
  const { errors, data } = validateMachine(req.body, false);
  if (errors.length) return res.status(400).json({ message: 'Datos inválidos.', errors });
  if (!data.image) data.image = defaultImage(data.type);
  res.status(201).json(store.create(data));
});

// Actualizar: PUT (completo) y PATCH (parcial)
const updateHandler = (partial) => (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;
  const current = store.findById(id);
  if (!current) return res.status(404).json({ message: 'Equipo no encontrado.' });

  const { errors, data } = validateMachine(req.body, partial);
  if (errors.length) return res.status(400).json({ message: 'Datos inválidos.', errors });

  // Imagen cuando no se envía:
  // - PUT (reemplazo completo): siempre la ilustración del tipo (si se borró la URL propia, no se conserva).
  // - PATCH que cambia el tipo: solo si la imagen actual era una ilustración propia (/images/...).
  if (!data.image) {
    const type = data.type || current.type;
    const currentIsDefault = !current.image || current.image.startsWith('/images/');
    if (!partial || (data.type && currentIsDefault)) {
      data.image = defaultImage(type);
    }
  }
  res.json(store.update(id, data));
};
app.put(`${BASE}/:id`, updateHandler(false));
app.patch(`${BASE}/:id`, updateHandler(true));

// Eliminar
app.delete(`${BASE}/:id`, (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;
  if (!store.remove(id)) return res.status(404).json({ message: 'Equipo no encontrado.' });
  res.status(204).send();
});

// 404 genérico
app.use((_req, res) => res.status(404).json({ message: 'Ruta no encontrada.' }));

// Errores (p. ej. JSON mal formado)
app.use((err, _req, res, _next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'El cuerpo de la petición no es un JSON válido.' });
  }
  console.error(err);
  res.status(500).json({ message: 'Error interno del servidor.' });
});

app.listen(PORT, () => {
  console.log(`API Flota de Maquinaria escuchando en http://localhost:${PORT}`);
});
