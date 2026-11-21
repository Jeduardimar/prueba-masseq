/**
 * Imágenes subidas desde el dispositivo.
 * - Se verifica la firma real de los bytes (JPEG, PNG o WebP); nunca la extensión ni el mimetype.
 * - Se vuelven a codificar con sharp a WebP (máx. 1200 px), lo que elimina EXIF/GPS y contenido oculto.
 * - Se guardan como uploads/<uuid v4>.webp; el nombre original nunca se usa.
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads');
const MAX_FILE_BYTES = 2 * 1024 * 1024;
const MAX_FILES = 200;
const MAX_TOTAL_BYTES = 50 * 1024 * 1024;

/** Ruta pública de una subida: /uploads/<uuid v4>.webp (en minúsculas, como randomUUID). */
const UPLOAD_PATH = /^\/uploads\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.webp$/;
const UPLOAD_FILE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.webp$/;

const isUploadPath = (image) => typeof image === 'string' && UPLOAD_PATH.test(image);

/** Tipo real según los primeros bytes: 'jpeg' | 'png' | 'webp' | null. */
function detectImageType(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpeg';
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buf.toString('latin1', 0, 4) === 'RIFF' && buf.toString('latin1', 8, 12) === 'WEBP') return 'webp';
  return null;
}

/** Error con código HTTP y mensaje en español para el cliente. */
class UploadError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function ensureUploadDir() {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/** Archivos de subida válidos que hay en disco. */
function listUploads() {
  return fs.readdirSync(UPLOAD_DIR).filter((f) => UPLOAD_FILE.test(f));
}

function usage() {
  const files = listUploads();
  const bytes = files.reduce((sum, f) => sum + fs.statSync(path.join(UPLOAD_DIR, f)).size, 0);
  return { files: files.length, bytes };
}

/** Verifica, vuelve a codificar y guarda la imagen. Devuelve la ruta pública. */
async function saveUpload(buffer) {
  if (!detectImageType(buffer)) {
    throw new UploadError(415, 'Tipo de archivo no permitido. Sube una imagen JPG, PNG o WebP.');
  }
  const before = usage();
  if (before.files >= MAX_FILES || before.bytes >= MAX_TOTAL_BYTES) {
    throw new UploadError(507, 'Se alcanzó el espacio máximo para imágenes. Elimina algún equipo con foto subida.');
  }

  let output;
  try {
    output = await sharp(buffer, { limitInputPixels: 40_000_000, failOn: 'error' })
      .rotate()
      .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
  } catch {
    throw new UploadError(415, 'La imagen está dañada o no se puede procesar.');
  }
  if (before.bytes + output.length > MAX_TOTAL_BYTES) {
    throw new UploadError(507, 'Se alcanzó el espacio máximo para imágenes. Elimina algún equipo con foto subida.');
  }

  const name = `${crypto.randomUUID()}.webp`;
  fs.writeFileSync(path.join(UPLOAD_DIR, name), output, { flag: 'wx' });
  return `/uploads/${name}`;
}

/** Borra el archivo de una subida (solo rutas /uploads/<uuid>.webp; nunca otras rutas). */
function deleteUpload(image) {
  if (!isUploadPath(image)) return;
  fs.rmSync(path.join(UPLOAD_DIR, path.basename(image)), { force: true });
}

/** Borra las subidas que ningún equipo usa (se llama al arrancar). */
function removeOrphans(usedImages) {
  const used = new Set(usedImages.filter(isUploadPath).map((p) => path.basename(p)));
  let removed = 0;
  for (const f of listUploads()) {
    if (!used.has(f)) {
      fs.rmSync(path.join(UPLOAD_DIR, f), { force: true });
      removed++;
    }
  }
  return removed;
}

module.exports = {
  UPLOAD_DIR,
  MAX_FILE_BYTES,
  UPLOAD_PATH,
  UploadError,
  isUploadPath,
  detectImageType,
  ensureUploadDir,
  saveUpload,
  deleteUpload,
  removeOrphans,
};
