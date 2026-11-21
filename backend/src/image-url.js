/**
 * Validación de la imagen de un equipo (campo `image`).
 * Se acepta:
 *   - una imagen propia del backend: /images/<nombre>.jpg|.svg
 *   - una URL https:// pública (máx. 500 caracteres, sin usuario/contraseña y sin hosts
 *     locales o privados, para no usar la app como puente hacia la red interna).
 */

const MAX_LENGTH = 500;
const OWN_IMAGE = /^\/images\/[a-z_-]+\.(jpg|svg)$/;

/** IPv4 en rangos locales o privados: 0/8, 10/8, 127/8, 169.254/16, 172.16/12, 192.168/16. */
function isPrivateIPv4(host) {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (!m) return false;
  const [a, b] = [Number(m[1]), Number(m[2])];
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

/** IPv6 local o privada: ::, ::1, IPv4 mapeada (::ffff:…), fc00::/7 y fe80::/10. */
function isPrivateIPv6(host) {
  if (!host.includes(':')) return false;
  const h = host.toLowerCase();
  return (
    h === '::' ||
    h === '::1' ||
    h.startsWith('::ffff:') ||
    /^f[cd][0-9a-f]{0,2}:/.test(h) ||
    /^fe[89ab][0-9a-f]?:/.test(h)
  );
}

function isLocalHost(hostname) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '');
  return (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    isPrivateIPv4(host) ||
    isPrivateIPv6(host)
  );
}

/** Devuelve el mensaje de error (en español) o null si la imagen es válida. */
function imageUrlError(value) {
  const img = String(value).trim();
  if (OWN_IMAGE.test(img)) return null;
  if (img.length > MAX_LENGTH) return `La URL de la imagen no puede superar ${MAX_LENGTH} caracteres.`;

  let url;
  try {
    url = new URL(img);
  } catch {
    return 'La imagen debe ser una URL https:// válida o una imagen propia /images/<nombre>.jpg|.svg.';
  }
  if (url.protocol !== 'https:') return 'La URL de la imagen debe empezar por https:// (no se acepta http://).';
  if (url.username || url.password) return 'La URL de la imagen no puede incluir usuario ni contraseña.';
  if (isLocalHost(url.hostname)) return 'La URL de la imagen no puede apuntar a un servidor local o de una red privada.';
  return null;
}

module.exports = { MAX_LENGTH, imageUrlError, isLocalHost };
