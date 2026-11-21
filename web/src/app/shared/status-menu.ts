import { Component, computed, inject, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MACHINE_STATUSES, Machine, statusLabel } from '../core/machine.model';
import { StatusChanger } from '../core/status-changer';

/** Etiqueta de estado que abre un menú para cambiarlo sin entrar a editar. */
@Component({
  selector: 'app-status-menu',
  imports: [MatIconModule, MatMenuModule, MatProgressSpinnerModule],
  template: `
    <button
      type="button"
      class="status-badge status-badge--{{ machine().status }} status-trigger"
      [matMenuTriggerFor]="menu"
      [disabled]="saving()"
      [attr.aria-busy]="saving()"
      [attr.aria-label]="'Estado: ' + label() + '. Cambiar estado de ' + machine().title"
      (click)="$event.stopPropagation(); $event.preventDefault()"
    >
      {{ label() }}
      @if (saving()) {
        <mat-spinner diameter="12" strokeWidth="2" />
      } @else {
        <mat-icon class="status-trigger__icon" aria-hidden="true">expand_more</mat-icon>
      }
    </button>
    <mat-menu #menu="matMenu" xPosition="after">
      @for (s of statuses; track s.value) {
        <button
          mat-menu-item
          type="button"
          [disabled]="s.value === machine().status"
          (click)="changer.change(machine(), s.value)"
        >
          <span class="status-dot status-dot--{{ s.value }}" aria-hidden="true"></span>
          {{ s.label }}
        </button>
      }
    </mat-menu>
  `,
  styles: `
    .status-trigger {
      border: 0;
      cursor: pointer;
      font: inherit;
      font-size: 0.8rem;
      font-weight: 600;
      box-shadow: 0 1px 3px rgb(0 0 0 / 0.15);

      &:focus-visible {
        outline: 3px solid var(--masseq-yellow);
        outline-offset: 2px;
      }
      &:disabled {
        cursor: progress;
      }
    }
    .status-trigger__icon {
      width: 16px;
      height: 16px;
      font-size: 16px;
      margin: 0 -4px 0 -2px;
    }
    mat-spinner {
      --mat-progress-spinner-active-indicator-color: currentColor;
    }
  `,
})
export class StatusMenu {
  protected readonly changer = inject(StatusChanger);

  readonly machine = input.required<Machine>();

  protected readonly statuses = MACHINE_STATUSES;
  protected readonly label = computed(() => statusLabel(this.machine().status));
  protected readonly saving = computed(() => this.changer.isSaving(this.machine().id));
}
