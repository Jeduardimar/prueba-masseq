import { Directive, computed, input, linkedSignal } from '@angular/core';
import { resolveImage, typeIllustration, typePhoto } from '../core/images';

/**
 * <img appMachineImage [image]="m.image" [type]="m.type">
 * Resuelve la URL de la imagen; si falla al cargar, usa la foto del tipo (.jpg) y,
 * si también falla, la ilustración del tipo (.svg).
 */
@Directive({
  selector: 'img[appMachineImage]',
  host: {
    '[src]': 'src()',
    '(error)': 'onError()',
    loading: 'lazy',
    decoding: 'async',
    referrerpolicy: 'no-referrer',
  },
})
export class MachineImage {
  readonly image = input<string | null | undefined>();
  readonly type = input<string | null | undefined>();

  /**
   * 0 = imagen original, 1 = foto del tipo (.jpg), 2 = ilustración del tipo (.svg).
   * Se reinicia a 0 cuando cambia la imagen o el tipo (p. ej. en la vista previa del formulario).
   */
  private readonly fallbackLevel = linkedSignal({
    source: () => [this.image(), this.type()],
    computation: () => 0,
  });

  protected readonly src = computed(() => {
    switch (this.fallbackLevel()) {
      case 0:
        return resolveImage(this.image(), this.type());
      case 1:
        return typePhoto(this.type());
      default:
        return typeIllustration(this.type());
    }
  });

  protected onError(): void {
    if (this.fallbackLevel() < 2) this.fallbackLevel.update((l) => l + 1);
  }
}
