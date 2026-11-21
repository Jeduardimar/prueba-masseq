import { Component, computed, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { filter, switchMap } from 'rxjs';
import { MachineService, errorMessage } from '../../core/machine.service';
import { MACHINE_STATUSES, MachineStatus, statusLabel, typeLabel } from '../../core/machine.model';
import { StatusChanger } from '../../core/status-changer';
import { MachineImage } from '../../shared/machine-image';
import { ConfirmDialog, ConfirmDialogData } from '../../shared/confirm-dialog';

@Component({
  selector: 'app-machine-detail',
  imports: [
    RouterLink,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MachineImage,
  ],
  templateUrl: './machine-detail.html',
  styleUrl: './machine-detail.scss',
})
export class MachineDetail {
  private readonly service = inject(MachineService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly statusChanger = inject(StatusChanger);

  /** Parámetro :id de la ruta (withComponentInputBinding). */
  readonly id = input.required<string>();

  protected readonly machineId = computed(() => Number(this.id()));
  protected readonly validId = computed(() => Number.isInteger(this.machineId()) && this.machineId() > 0);

  private readonly resource = rxResource({
    params: () => (this.validId() ? this.machineId() : undefined),
    stream: ({ params }) => this.service.getById(params),
  });

  /** Se muestra el dato en memoria mientras llega la respuesta de la API. */
  protected readonly machine = computed(() =>
    this.resource.hasValue() ? this.resource.value() : this.service.cached(this.machineId()),
  );
  protected readonly loading = computed(() => this.resource.isLoading() && !this.machine());
  protected readonly error = computed(() => {
    if (!this.validId()) return 'El identificador del equipo no es válido.';
    const err = this.resource.error();
    return err ? errorMessage((err as { cause?: unknown }).cause ?? err) : null;
  });

  protected readonly deleting = signal(false);
  protected readonly statuses = MACHINE_STATUSES;
  protected readonly savingStatus = computed(() => this.service.savingStatus().has(this.machineId()));
  protected readonly typeLabel = typeLabel;
  protected readonly statusLabel = statusLabel;

  /** Cambio rápido de estado desde el grupo de botones. */
  protected changeStatus(status: MachineStatus): void {
    const m = this.machine();
    if (!m) return;
    this.statusChanger.change(m, status, (updated) => this.resource.set(updated));
  }

  protected retry(): void {
    this.resource.reload();
  }

  protected confirmDelete(): void {
    const m = this.machine();
    if (!m || this.deleting()) return;

    this.dialog
      .open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, {
        data: {
          title: 'Eliminar equipo',
          message: `¿Seguro que deseas eliminar "${m.title}"? Esta acción no se puede deshacer.`,
          confirmText: 'Eliminar',
        },
        width: '440px',
        maxWidth: 'calc(100vw - 32px)',
      })
      .afterClosed()
      .pipe(
        filter((ok) => ok === true),
        switchMap(() => {
          this.deleting.set(true);
          return this.service.remove(m.id);
        }),
      )
      .subscribe({
        next: () => {
          this.snackBar.open(`"${m.title}" fue eliminado.`, 'Cerrar', { duration: 4000 });
          this.router.navigate(['/']);
        },
        error: (err) => {
          this.deleting.set(false);
          this.snackBar.open(errorMessage(err), 'Cerrar', { duration: 6000 });
        },
      });
  }
}
