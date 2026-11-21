import { HttpClient, HttpEvent } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE } from './api.config';

export const UPLOAD_URL = `${API_BASE}/api/uploads`;
export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
export const ALLOWED_UPLOAD_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** Validación en el cliente (el servidor vuelve a verificar los bytes reales). */
export function uploadFileError(file: Pick<File, 'type' | 'size'>): string | null {
  if (!ALLOWED_UPLOAD_TYPES.includes(file.type)) return 'Formato no permitido. Usa una imagen JPG, PNG o WebP.';
  if (file.size > MAX_UPLOAD_BYTES) return 'La imagen supera el máximo de 2 MB.';
  if (file.size === 0) return 'El archivo está vacío.';
  return null;
}

@Injectable({ providedIn: 'root' })
export class UploadService {
  private readonly http = inject(HttpClient);

  /** Sube la imagen (campo "image") con eventos de progreso. */
  upload(file: File): Observable<HttpEvent<{ image: string }>> {
    const body = new FormData();
    body.append('image', file);
    return this.http.post<{ image: string }>(UPLOAD_URL, body, { reportProgress: true, observe: 'events' });
  }
}
