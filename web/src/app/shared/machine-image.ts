import { Directive, computed, input, linkedSignal } from '@angular/core';
import { resolveImage, typeImage } from '../core/images';

/**
 * <img appMachineImage [image]="m.image" [type]="m.type">
 * Resuelve la URL de la imagen y, si falla al cargar, muestra la ilustración del tipo.
 */
@Directive({
  selector: 'img[appMachineImage]',
  host: {
    '[src]': 'src()',
    '(error)': 'onError()',
    loading: 'lazy',
    decoding: 'async',
  },
})
export class MachineImage {
  readonly image = input<string | null | undefined>();
  readonly type = input<string | null | undefined>();

  /**
   * 0 = imagen original, 1 = ilustración del tipo, 2 = ilustración genérica.
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
        return typeImage(this.type());
      default:
        return typeImage(null);
    }
  });

  protected onError(): void {
    if (this.fallbackLevel() < 2) this.fallbackLevel.update((l) => l + 1);
  }
}
