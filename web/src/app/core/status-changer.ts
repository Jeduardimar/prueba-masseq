import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Machine, MachineStatus, statusLabel } from './machine.model';
import { MachineService, errorMessage } from './machine.service';

/**
 * Cambio rápido de estado con confirmación en un snackbar y opción "Deshacer".
 * La lista (signal del servicio) se actualiza sola; `onSaved` permite que el
 * detalle refresque su propio recurso.
 */
@Injectable({ providedIn: 'root' })
export class StatusChanger {
  private readonly service = inject(MachineService);
  private readonly snackBar = inject(MatSnackBar);

  isSaving(id: number): boolean {
    return this.service.savingStatus().has(id);
  }

  change(machine: Machine, status: MachineStatus, onSaved?: (m: Machine) => void): void {
    if (machine.status === status || this.isSaving(machine.id)) return;
    const previous = machine.status;

    this.service.updateStatus(machine.id, status).subscribe({
      next: (updated) => {
        onSaved?.(updated);
        this.snackBar
          .open(`Estado actualizado a ${statusLabel(status)}`, 'Deshacer', { duration: 6000 })
          .onAction()
          .subscribe(() => this.undo(updated, previous, onSaved));
      },
      error: (err) => this.showError(err),
    });
  }

  private undo(machine: Machine, previous: MachineStatus, onSaved?: (m: Machine) => void): void {
    this.service.updateStatus(machine.id, previous).subscribe({
      next: (restored) => {
        onSaved?.(restored);
        this.snackBar.open(`Estado restaurado a ${statusLabel(previous)}`, 'Cerrar', { duration: 4000 });
      },
      error: (err) => this.showError(err),
    });
  }

  private showError(err: unknown): void {
    this.snackBar.open(`No se pudo cambiar el estado. ${errorMessage(err)}`, 'Cerrar', { duration: 7000 });
  }
}
