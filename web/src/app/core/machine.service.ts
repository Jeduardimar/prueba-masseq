import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, defer, finalize, tap } from 'rxjs';
import { MACHINES_URL } from './api.config';
import { Machine, MachineInput, MachineStatus } from './machine.model';

/** Tiempo tras el cual se avisa que el servidor puede estar "despertando" (Render gratuito). */
const SLOW_MS = 3000;

@Injectable({ providedIn: 'root' })
export class MachineService {
  private readonly http = inject(HttpClient);

  /** Listado de equipos; se actualiza tras crear, editar o eliminar. */
  private readonly _machines = signal<Machine[]>([]);
  readonly machines = this._machines.asReadonly();

  readonly loading = signal(false);
  readonly loaded = signal(false);
  readonly error = signal<string | null>(null);

  /** Ids de los equipos cuyo estado se está guardando (cambio rápido). */
  private readonly _savingStatus = signal<ReadonlySet<number>>(new Set());
  readonly savingStatus = this._savingStatus.asReadonly();

  /** Peticiones en curso que ya superaron SLOW_MS. */
  private readonly slowCount = signal(0);
  readonly slow = computed(() => this.slowCount() > 0);

  /** Carga (o recarga) el listado completo. */
  load(force = false): void {
    if (this.loading() || (this.loaded() && !force)) return;
    this.loading.set(true);
    this.error.set(null);
    this.track(this.http.get<Machine[]>(MACHINES_URL))
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (list) => {
          this._machines.set(list);
          this.loaded.set(true);
        },
        error: (err) => this.error.set(errorMessage(err)),
      });
  }

  /** Equipo en memoria (para pintar el detalle al instante mientras llega la respuesta de la API). */
  cached(id: number): Machine | undefined {
    return this._machines().find((m) => m.id === id);
  }

  getById(id: number): Observable<Machine> {
    return this.track(this.http.get<Machine>(`${MACHINES_URL}/${id}`)).pipe(tap((m) => this.upsert(m)));
  }

  create(data: MachineInput): Observable<Machine> {
    return this.track(this.http.post<Machine>(MACHINES_URL, data)).pipe(
      tap((m) => this._machines.update((list) => [...list, m])),
    );
  }

  update(id: number, data: MachineInput): Observable<Machine> {
    return this.track(this.http.put<Machine>(`${MACHINES_URL}/${id}`, data)).pipe(tap((m) => this.upsert(m)));
  }

  /** Cambio rápido de estado: PATCH /api/machines/:id con { status }. */
  updateStatus(id: number, status: MachineStatus): Observable<Machine> {
    return defer(() => {
      this._savingStatus.update((set) => new Set(set).add(id));
      return this.track(this.http.patch<Machine>(`${MACHINES_URL}/${id}`, { status }));
    }).pipe(
      tap((m) => this.upsert(m)),
      finalize(() =>
        this._savingStatus.update((set) => {
          const next = new Set(set);
          next.delete(id);
          return next;
        }),
      ),
    );
  }

  remove(id: number): Observable<void> {
    return this.track(this.http.delete<void>(`${MACHINES_URL}/${id}`)).pipe(
      tap(() => this._machines.update((list) => list.filter((m) => m.id !== id))),
    );
  }

  private upsert(m: Machine): void {
    this._machines.update((list) =>
      list.some((x) => x.id === m.id) ? list.map((x) => (x.id === m.id ? m : x)) : list,
    );
  }

  /** Marca la petición como "lenta" si supera SLOW_MS, para mostrar el aviso global. */
  private track<T>(source: Observable<T>): Observable<T> {
    return new Observable<T>((subscriber) => {
      let isSlow = false;
      const timer = setTimeout(() => {
        isSlow = true;
        this.slowCount.update((n) => n + 1);
      }, SLOW_MS);
      const sub = source.subscribe(subscriber);
      return () => {
        clearTimeout(timer);
        if (isSlow) this.slowCount.update((n) => n - 1);
        sub.unsubscribe();
      };
    });
  }
}

/** Mensaje legible en español a partir de un error HTTP. */
export function errorMessage(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0)
      return 'No se pudo conectar con el servidor. Verifica tu conexión e inténtalo de nuevo.';
    if (err.status === 404) return 'El equipo no existe o fue eliminado.';
    if (err.status === 429)
      return 'Demasiadas solicitudes seguidas. Espera un momento e inténtalo de nuevo.';
    const body = err.error as { message?: string; errors?: string[] } | null;
    if (body?.errors?.length) return `${body.message ?? 'Datos inválidos.'} ${body.errors.join(' ')}`;
    if (body?.message) return body.message;
    return `Error del servidor (${err.status}).`;
  }
  return 'Ocurrió un error inesperado.';
}
