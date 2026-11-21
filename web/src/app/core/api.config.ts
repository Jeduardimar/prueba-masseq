/**
 * URL base de la API.
 * - En local (localhost / 127.0.0.1) apunta al backend de desarrollo.
 * - En cualquier otro host apunta al backend desplegado en Render.
 *   (La URL definitiva se ajusta al desplegar).
 */
const LOCAL_HOSTS = ['localhost', '127.0.0.1'];

export const API_BASE: string =
  typeof window !== 'undefined' && LOCAL_HOSTS.includes(window.location.hostname)
    ? 'http://localhost:3000'
    : 'https://masseq-flota-api.onrender.com';

export const MACHINES_URL = `${API_BASE}/api/machines`;
