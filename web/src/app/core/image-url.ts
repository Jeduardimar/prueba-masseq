import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Misma validación de la imagen que hace la API (backend/src/image-url.js):
 * imagen propia /images/<nombre>.jpg|.svg o URL https:// pública de máx. 500 caracteres,
 * sin usuario/contraseña y sin hosts locales o privados.
 */

export const IMAGE_URL_MAX_LENGTH = 500;
const OWN_IMAGE = /^\/images\/[a-z_-]+\.(jpg|svg)$/;

function isPrivateIPv4(host: string): boolean {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (!m) return false;
  const a = Number(m[1]);
  const b = Number(m[2]);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

function isPrivateIPv6(host: string): boolean {
  if (!host.includes(':')) return false;
  return (
    host === '::' ||
    host === '::1' ||
    host.startsWith('::ffff:') ||
    /^f[cd][0-9a-f]{0,2}:/.test(host) ||
    /^fe[89ab][0-9a-f]?:/.test(host)
  );
}

export function isLocalHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '');
  return (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    isPrivateIPv4(host) ||
    isPrivateIPv6(host)
  );
}

/** Mensaje de error en español o null si la imagen es válida (o está vacía: es opcional). */
export function imageUrlError(value: string | null | undefined): string | null {
  const img = (value ?? '').trim();
  if (!img || OWN_IMAGE.test(img)) return null;
  if (img.length > IMAGE_URL_MAX_LENGTH)
    return `La URL no puede superar ${IMAGE_URL_MAX_LENGTH} caracteres.`;

  let url: URL;
  try {
    url = new URL(img);
  } catch {
    return 'Ingresa una URL válida que empiece por https://.';
  }
  if (url.protocol !== 'https:') return 'La URL debe empezar por https:// (no se acepta http://).';
  if (url.username || url.password) return 'La URL no puede incluir usuario ni contraseña.';
  if (isLocalHost(url.hostname)) return 'La URL no puede apuntar a un servidor local o de una red privada.';
  return null;
}

/** Validador de formulario: { imageUrl: '<mensaje>' }. */
export const imageUrlValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const message = imageUrlError(control.value);
  return message ? { imageUrl: message } : null;
};
