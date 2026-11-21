import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MachineService, errorMessage } from '../../core/machine.service';
import {
  MACHINE_STATUSES,
  MACHINE_TYPES,
  Machine,
  MachineInput,
  MachineStatus,
  MachineType,
  statusLabel,
  typeLabel,
} from '../../core/machine.model';
import { MachineImage } from '../../shared/machine-image';
import { UPLOAD_PATH, imageUrlValidator } from '../../core/image-url';
import { UploadService, uploadFileError } from '../../core/upload.service';
import { HttpEventType } from '@angular/common/http';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { DestroyRef } from '@angular/core';
import { Subscription } from 'rxjs';

const MIN_YEAR = 1980;
const MAX_YEAR = new Date().getFullYear() + 1;

/** Nombres de los campos en español para los mensajes de error. */
const LABELS: Record<string, string> = {
  title: 'El nombre',
  type: 'El tipo de equipo',
  brand: 'La marca',
  model: 'El modelo',
  year: 'El año',
  capacity: 'La capacidad',
  status: 'El estado',
  location: 'La ubicación',
  description: 'La descripción',
  image: 'La imagen',
};

@Component({
  selector: 'app-machine-form',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatSelectModule,
    MachineImage,
  ],
  templateUrl: './machine-form.html',
  styleUrl: './machine-form.scss',
})
export class MachineForm {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly service = inject(MachineService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly uploader = inject(UploadService);

  /** Subida desde el dispositivo: vista previa local (blob:), progreso (0–100) y error. */
  protected readonly localPreview = signal<string | null>(null);
  protected readonly uploadProgress = signal<number | null>(null);
  protected readonly uploadError = signal<string | null>(null);
  protected readonly dragging = signal(false);
  private uploadSub?: Subscription;

  /** :id de la ruta; si no viene, el formulario es de creación. */
  readonly id = input<string>();

  protected readonly isEdit = computed(() => this.id() !== undefined);
  protected readonly machineId = computed(() => Number(this.id()));

  protected readonly types = MACHINE_TYPES;
  protected readonly statuses = MACHINE_STATUSES;
  protected readonly maxYear = MAX_YEAR;
  protected readonly minYear = MIN_YEAR;

  protected readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
    type: this.fb.control<MachineType | ''>('', Validators.required),
    brand: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
    model: ['', [Validators.required, Validators.maxLength(60)]],
    year: this.fb.control<number | null>(null, [
      Validators.required,
      Validators.min(MIN_YEAR),
      Validators.max(MAX_YEAR),
      Validators.pattern(/^\d{4}$/),
    ]),
    capacity: ['', Validators.maxLength(60)],
    status: this.fb.control<MachineStatus>('disponible', Validators.required),
    location: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    description: ['', Validators.maxLength(2000)],
    image: ['', imageUrlValidator],
  });

  /** Valores del formulario como signal (para la vista previa). */
  private readonly value = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });
  protected readonly preview = computed(() => {
    const v = this.value();
    const imageCtrl = this.form.controls.image;
    return {
      title: v.title?.trim() || 'Nombre del equipo',
      type: v.type || null,
      typeLabel: v.type ? typeLabel(v.type) : 'Tipo de equipo',
      status: v.status ?? 'disponible',
      statusLabel: statusLabel(v.status ?? 'disponible'),
      // Vista previa local mientras se sube; si la URL está vacía o no es válida, la foto del tipo.
      image: this.localPreview() ?? (imageCtrl.valid ? v.image : ''),
      brandModel: [v.brand, v.model].filter(Boolean).join(' ') || 'Marca y modelo',
    };
  });

  protected readonly loadingMachine = signal(false);
  protected readonly loadError = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly serverError = signal<string | null>(null);

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.uploadSub?.unsubscribe();
      this.setLocalPreview(null);
    });
    // En modo edición, carga el equipo (de memoria al instante y luego desde la API).
    effect(() => {
      if (!this.isEdit()) return;
      const id = this.machineId();
      // Solo depende del id: lo demás se ejecuta sin rastrear signals (evita recargas en bucle).
      untracked(() => this.loadMachine(id));
    });
  }

  private loadMachine(id: number): void {
    if (!Number.isInteger(id) || id <= 0) {
      this.loadError.set('El identificador del equipo no es válido.');
      return;
    }
    const cached = this.service.cached(id);
    if (cached) this.fill(cached);
    else this.loadingMachine.set(true);

    this.service.getById(id).subscribe({
      next: (m) => {
        if (!this.form.dirty) this.fill(m);
        this.loadingMachine.set(false);
      },
      error: (err) => {
        this.loadingMachine.set(false);
        if (!cached) this.loadError.set(errorMessage(err));
      },
    });
  }

  private fill(m: Machine): void {
    this.form.reset({
      title: m.title,
      type: m.type,
      brand: m.brand,
      model: m.model,
      year: m.year,
      capacity: m.capacity ?? '',
      status: m.status,
      location: m.location,
      description: m.description ?? '',
      // Las imágenes por defecto (/images/...) no se muestran como URL: el campo queda vacío.
      image: m.image && !m.image.startsWith('/images/') ? m.image : '',
    });
  }

  /** Mensaje de error en español para un campo. */
  protected errorFor(name: keyof typeof this.form.controls): string {
    const control: AbstractControl = this.form.controls[name];
    const e = control.errors;
    if (!e) return '';
    const label = LABELS[name] ?? 'El campo';
    if (e['required']) return `${label} es obligatori${label.startsWith('La') ? 'a' : 'o'}.`;
    if (e['minlength']) return `${label} debe tener al menos ${e['minlength'].requiredLength} caracteres.`;
    if (e['maxlength']) return `${label} no puede superar ${e['maxlength'].requiredLength} caracteres.`;
    if (e['min'] || e['max'] || (name === 'year' && e['pattern']))
      return `El año debe estar entre ${MIN_YEAR} y ${MAX_YEAR}.`;
    if (e['imageUrl']) return e['imageUrl'];
    return `${label} no es válido.`;
  }

  /** true si la imagen actual es una subida (/uploads/<uuid>.webp). */
  protected isUploaded(value: string): boolean {
    return UPLOAD_PATH.test(value);
  }

  /** Quitar imagen: vuelve a la foto del tipo (y cancela una subida en curso). */
  protected clearImage(): void {
    this.uploadSub?.unsubscribe();
    this.uploadProgress.set(null);
    this.uploadError.set(null);
    this.setLocalPreview(null);
    this.form.controls.image.setValue('');
    this.form.controls.image.markAsDirty();
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // permite volver a elegir el mismo archivo
    if (file) this.uploadFile(file);
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
    this.dragging.set(true);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) this.uploadFile(file);
  }

  private uploadFile(file: File): void {
    const error = uploadFileError(file);
    if (error) {
      this.uploadError.set(error);
      return;
    }
    this.uploadSub?.unsubscribe();
    this.uploadError.set(null);
    this.setLocalPreview(URL.createObjectURL(file));
    this.uploadProgress.set(0);

    this.uploadSub = this.uploader.upload(file).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.uploadProgress.set(Math.round((event.loaded / event.total) * 100));
        } else if (event.type === HttpEventType.Response && event.body) {
          this.uploadProgress.set(null);
          this.form.controls.image.setValue(event.body.image);
          this.form.controls.image.markAsDirty();
          this.snackBar.open('Imagen subida. Guarda el equipo para conservarla.', 'Cerrar', { duration: 4000 });
        }
      },
      error: (err) => {
        this.uploadProgress.set(null);
        this.setLocalPreview(null);
        this.uploadError.set(errorMessage(err));
      },
    });
  }

  /** Cambia la vista previa local y revoca la URL blob: anterior. */
  private setLocalPreview(url: string | null): void {
    const previous = this.localPreview();
    if (previous) URL.revokeObjectURL(previous);
    this.localPreview.set(url);
  }

  protected submit(): void {
    this.serverError.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snackBar.open('Revisa los campos marcados en rojo.', 'Cerrar', { duration: 4000 });
      return;
    }

    const v = this.form.getRawValue();
    const data: MachineInput = {
      title: v.title.trim(),
      type: v.type as MachineType,
      brand: v.brand.trim(),
      model: v.model.trim(),
      year: Number(v.year),
      capacity: v.capacity.trim(),
      status: v.status,
      location: v.location.trim(),
      description: v.description.trim(),
      // Vacía → el backend asigna la foto del tipo.
      image: v.image.trim(),
    };

    this.saving.set(true);
    const request = this.isEdit() ? this.service.update(this.machineId(), data) : this.service.create(data);

    request.subscribe({
      next: (m) => {
        this.saving.set(false);
        this.form.markAsPristine();
        this.snackBar.open(this.isEdit() ? 'Cambios guardados.' : 'Equipo agregado a la flota.', 'Cerrar', {
          duration: 4000,
        });
        this.router.navigate(['/maquinaria', m.id]);
      },
      error: (err) => {
        this.saving.set(false);
        this.serverError.set(errorMessage(err));
      },
    });
  }
}
