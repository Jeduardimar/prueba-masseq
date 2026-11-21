import { Injectable, OnDestroy, signal } from '@angular/core';

/** Hora actual como signal; se actualiza cada 30 s para recalcular el tramo abierto sin recargar. */
@Injectable({ providedIn: 'root' })
export class Clock implements OnDestroy {
  private readonly _now = signal(Date.now());
  readonly now = this._now.asReadonly();

  private readonly timer = setInterval(() => this._now.set(Date.now()), 30_000);

  /** Fuerza la actualización, por ejemplo justo después de un cambio de estado. */
  tick(): void {
    this._now.set(Date.now());
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }
}
