import { Component, computed, inject, input, linkedSignal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MachineService } from '../../core/machine.service';
import {
  MACHINE_STATUSES,
  MACHINE_TYPES,
  MachineStatus,
  normalize,
  statusLabel,
  typeLabel,
} from '../../core/machine.model';
import { MachineImage } from '../../shared/machine-image';

@Component({
  selector: 'app-machine-list',
  imports: [
    RouterLink,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MachineImage,
  ],
  templateUrl: './machine-list.html',
  styleUrl: './machine-list.scss',
})
export class MachineList {
  private readonly router = inject(Router);
  protected readonly service = inject(MachineService);

  protected readonly types = MACHINE_TYPES;
  protected readonly statuses = MACHINE_STATUSES;
  protected readonly typeLabel = typeLabel;
  protected readonly statusLabel = statusLabel;

  // Filtros en la URL (?q=&tipo=&estado=) para conservarlos al volver del detalle.
  readonly q = input<string>();
  readonly tipo = input<string>();
  readonly estado = input<string>();

  protected readonly search = linkedSignal(() => this.q() ?? '');
  protected readonly typeFilter = linkedSignal(() => this.tipo() ?? '');
  protected readonly statusFilter = linkedSignal(() => this.estado() ?? '');

  /** Contadores por estado (sobre toda la flota). */
  protected readonly counts = computed(() => {
    const result: Record<MachineStatus, number> = { disponible: 0, en_obra: 0, mantenimiento: 0 };
    for (const m of this.service.machines()) result[m.status] = (result[m.status] ?? 0) + 1;
    return result;
  });

  /** Equipos filtrados por texto (nombre, marca, modelo, sin tildes), tipo y estado. */
  protected readonly filtered = computed(() => {
    const words = normalize(this.search()).split(/\s+/).filter(Boolean);
    const type = this.typeFilter();
    const status = this.statusFilter();
    return this.service.machines().filter((m) => {
      if (type && m.type !== type) return false;
      if (status && m.status !== status) return false;
      if (!words.length) return true;
      const haystack = normalize(`${m.title} ${m.brand} ${m.model}`);
      return words.every((w) => haystack.includes(w));
    });
  });

  protected readonly hasFilters = computed(
    () => !!(this.search().trim() || this.typeFilter() || this.statusFilter()),
  );

  constructor() {
    this.service.load();
  }

  protected setSearch(value: string): void {
    this.search.set(value);
    this.syncUrl();
  }

  protected setType(value: string): void {
    this.typeFilter.set(value);
    this.syncUrl();
  }

  protected setStatus(value: string): void {
    this.statusFilter.set(value);
    this.syncUrl();
  }

  /** Clic en un contador: activa ese estado o lo quita si ya estaba activo. */
  protected toggleStatus(value: string): void {
    this.setStatus(this.statusFilter() === value ? '' : value);
  }

  protected clearFilters(): void {
    this.search.set('');
    this.typeFilter.set('');
    this.statusFilter.set('');
    this.syncUrl();
  }

  protected retry(): void {
    this.service.load(true);
  }

  private syncUrl(): void {
    this.router.navigate([], {
      queryParams: {
        q: this.search().trim() || null,
        tipo: this.typeFilter() || null,
        estado: this.statusFilter() || null,
      },
      replaceUrl: true,
    });
  }
}
