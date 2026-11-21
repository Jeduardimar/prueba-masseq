const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const store = require('./store');
const { validateMachine } = require('./validation');
const { TYPES, STATUSES, defaultImage } = require('./catalog');
const { startHistory, transition } = require('./history');

const app = express();
const PORT = process.env.PORT || 3000;
const BASE = '/api/machines';
/** Tope de equipos para que la demo no llene el almacenamiento. */
const MAX_MACHINES = 200;
const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const BODY_METHODS = new Set(['POST', 'PUT', 'PATCH']);

// Orígenes permitidos (CORS). Variable ALLOWED_ORIGINS separada por comas.
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://prueba-masseq.vercel.app,http://localhost:4200')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

// Render está detrás de un proxy: así req.ip es la IP real del cliente (para el rate limit).
app.set('trust proxy', 1);

// Cabeceras de seguridad. cross-origin para que la web en Vercel pueda cargar las imágenes.
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

app.use(
  cors({
    // Sin cabecera Origin (curl, health checks de Render) se permite; los navegadores
    // de otros orígenes no reciben cabeceras CORS y el navegador bloquea la respuesta.
    origin: (origin, cb) => cb(null, !origin || ALLOWED_ORIGINS.includes(origin)),
  }),
);

const tooManyRequests = (message) => ({
  windowMs: 15 * 60 * 1000,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message },
});
// General: 300 peticiones / 15 min por IP en la API.
app.use('/api', rateLimit({ ...tooManyRequests('Demasiadas peticiones. Intenta de nuevo en unos minutos.'), limit: 300 }));
// Escrituras: 30 / 15 min por IP.
app.use(
  '/api',
  rateLimit({
    ...tooManyRequests('Demasiadas modificaciones. Intenta de nuevo en unos minutos.'),
    limit: 30,
    skip: (req) => !WRITE_METHODS.has(req.method),
  }),
);

// Las escrituras con cuerpo deben enviar JSON.
app.use('/api', (req, res, next) => {
  if (BODY_METHODS.has(req.method) && !req.is('application/json')) {
    return res.status(415).json({ message: 'El cuerpo debe enviarse como JSON (Content-Type: application/json).' });
  }
  next();
});
app.use(express.json({ limit: '10kb' }));
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
    fields: {
      statusHistory:
        'Solo lectura. Tramos [{ status, from, to }] con fechas ISO 8601; el último tramo es el estado actual ' +
        '(to = null). Se abre un tramo nuevo cuando cambia el estado (PUT/PATCH) y se conservan los 50 más recientes.',
    },
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
  if (store.count() >= MAX_MACHINES) {
    return res.status(409).json({ message: `Se alcanzó el máximo de ${MAX_MACHINES} equipos. Elimina alguno antes de agregar otro.` });
  }
  if (!data.image) data.image = defaultImage(data.type);
  data.statusHistory = startHistory(data.status);
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
  // Historial: solo cambia si cambia el estado (el cliente no puede enviarlo; la validación lo descarta).
  if (data.status && data.status !== current.status) {
    data.statusHistory = transition(current.statusHistory, data.status);
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

// Errores: respuestas en español y sin trazas internas.
app.use((err, _req, res, _next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'El cuerpo de la petición no es un JSON válido.' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'El cuerpo de la petición es demasiado grande (máximo 10 KB).' });
  }
  console.error(err.message);
  res.status(500).json({ message: 'Error interno del servidor.' });
});

app.listen(PORT, () => {
  console.log(`API Flota de Maquinaria escuchando en http://localhost:${PORT}`);
});
