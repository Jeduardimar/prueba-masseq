const { TYPES, STATUSES } = require('./catalog');

const MAX_YEAR = new Date().getFullYear() + 1;

/**
 * Valida los datos de un equipo de la flota.
 * @param {object} body     datos recibidos
 * @param {boolean} partial true para PATCH (todos los campos opcionales)
 * @returns {{ errors: string[], data: object }}
 */
function validateMachine(body, partial = false) {
  const errors = [];
  const data = {};
  const b = body || {};
  const has = (k) => b[k] !== undefined && b[k] !== null && String(b[k]).trim() !== '';

  const text = (key, label, { min = 1, max = 120, required = true } = {}) => {
    if (has(key)) {
      const v = String(b[key]).trim();
      if (v.length < min || v.length > max) {
        errors.push(`El campo "${label}" debe tener entre ${min} y ${max} caracteres.`);
      } else data[key] = v;
    } else if (!partial && required) {
      errors.push(`El campo "${label}" es obligatorio.`);
    } else if (!partial && !required) {
      data[key] = '';
    }
  };

  text('title', 'nombre', { min: 3, max: 120 });
  text('brand', 'marca', { min: 2, max: 60 });
  text('model', 'modelo', { min: 1, max: 60 });
  text('capacity', 'capacidad', { max: 60, required: false });
  text('location', 'ubicación', { min: 2, max: 120 });
  text('description', 'descripción', { max: 2000, required: false });

  // type
  if (has('type')) {
    if (!TYPES[b.type]) errors.push(`El tipo debe ser uno de: ${Object.keys(TYPES).join(', ')}.`);
    else data.type = b.type;
  } else if (!partial) errors.push('El tipo de equipo es obligatorio.');

  // status
  if (has('status')) {
    if (!STATUSES[b.status]) errors.push(`El estado debe ser uno de: ${Object.keys(STATUSES).join(', ')}.`);
    else data.status = b.status;
  } else if (!partial) errors.push('El estado es obligatorio.');

  // year
  if (has('year')) {
    const year = Number(b.year);
    if (!Number.isInteger(year) || year < 1980 || year > MAX_YEAR) {
      errors.push(`El año debe ser un número entre 1980 y ${MAX_YEAR}.`);
    } else data.year = year;
  } else if (!partial) errors.push('El año es obligatorio.');

  // image (opcional): URL http/https o ilustración propia /images/*.svg
  if (has('image')) {
    const img = String(b.image).trim();
    let ok = /^\/images\/[a-z_-]+\.svg$/.test(img);
    if (!ok) {
      try {
        const url = new URL(img);
        ok = url.protocol === 'http:' || url.protocol === 'https:';
      } catch {
        ok = false;
      }
    }
    if (!ok) errors.push('La imagen debe ser una URL válida (http/https).');
    else data.image = img;
  }

  return { errors, data };
}

module.exports = { validateMachine };
