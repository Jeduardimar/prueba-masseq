import { FormControl } from '@angular/forms';
import { imageUrlError, imageUrlValidator } from './image-url';

describe('image-url', () => {
  it('acepta vacío, imágenes propias y URL https públicas', () => {
    expect(imageUrlError('')).toBeNull();
    expect(imageUrlError('/images/volqueta.jpg')).toBeNull();
    expect(imageUrlError('https://cdn.example.com/equipo.png')).toBeNull();
  });

  it('rechaza http, credenciales y URL demasiado largas', () => {
    expect(imageUrlError('http://example.com/a.jpg')).toContain('https://');
    expect(imageUrlError('https://u:p@example.com/a.jpg')).toContain('usuario');
    expect(imageUrlError(`https://example.com/${'a'.repeat(500)}`)).toContain('500');
    expect(imageUrlError('no es una url')).toContain('URL válida');
  });

  it('rechaza hosts locales y privados', () => {
    for (const bad of [
      'https://localhost/a.jpg',
      'https://nas.local/a.jpg',
      'https://127.0.0.1/a.jpg',
      'https://10.0.0.5/a.jpg',
      'https://172.20.1.1/a.jpg',
      'https://192.168.0.1/a.jpg',
      'https://169.254.169.254/',
      'https://[::1]/a.jpg',
    ]) {
      expect(imageUrlError(bad), bad).toContain('red privada');
    }
  });

  it('expone el mensaje como error del control', () => {
    const control = new FormControl('http://example.com/a.jpg', imageUrlValidator);
    expect(control.errors?.['imageUrl']).toContain('https://');
    control.setValue('https://example.com/a.jpg');
    expect(control.valid).toBe(true);
  });
});
