import { UPLOAD_PATH, imageUrlError } from './image-url';
import { uploadFileError } from './upload.service';

describe('subida de imágenes', () => {
  it('valida tipo y tamaño en el cliente', () => {
    expect(uploadFileError({ type: 'image/jpeg', size: 500_000 })).toBeNull();
    expect(uploadFileError({ type: 'image/png', size: 2 * 1024 * 1024 })).toBeNull();
    expect(uploadFileError({ type: 'image/webp', size: 10 })).toBeNull();
    expect(uploadFileError({ type: 'image/svg+xml', size: 100 })).toContain('JPG, PNG o WebP');
    expect(uploadFileError({ type: 'image/gif', size: 100 })).toContain('JPG, PNG o WebP');
    expect(uploadFileError({ type: 'image/jpeg', size: 2 * 1024 * 1024 + 1 })).toContain('2 MB');
    expect(uploadFileError({ type: 'image/jpeg', size: 0 })).toContain('vacío');
  });

  it('acepta solo /uploads/<uuid v4>.webp', () => {
    const ok = '/uploads/3f2b8c1e-9a4d-4e7f-b123-0a1b2c3d4e5f.webp';
    expect(UPLOAD_PATH.test(ok)).toBe(true);
    expect(imageUrlError(ok)).toBeNull();
    for (const bad of [
      '/uploads/../server.js',
      '/uploads/foto.webp',
      '/uploads/3f2b8c1e-9a4d-4e7f-b123-0a1b2c3d4e5f.png',
      '/uploads/3f2b8c1e-9a4d-1e7f-b123-0a1b2c3d4e5f.webp',
    ]) {
      expect(UPLOAD_PATH.test(bad), bad).toBe(false);
      expect(imageUrlError(bad), bad).not.toBeNull();
    }
  });
});
