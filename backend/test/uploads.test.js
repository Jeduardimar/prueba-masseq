const test = require('node:test');
const assert = require('node:assert/strict');
const { detectImageType, isUploadPath } = require('../src/uploads');
const { imageUrlError } = require('../src/image-url');

const pad = (bytes) => Buffer.concat([Buffer.from(bytes), Buffer.alloc(16)]);

test('detecta JPEG, PNG y WebP por sus bytes reales', () => {
  assert.equal(detectImageType(pad([0xff, 0xd8, 0xff, 0xe0])), 'jpeg');
  assert.equal(detectImageType(pad([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), 'png');
  const webp = Buffer.concat([Buffer.from('RIFF'), Buffer.from([1, 2, 3, 4]), Buffer.from('WEBPVP8 ')]);
  assert.equal(detectImageType(webp), 'webp');
});

test('rechaza todo lo demás: texto, SVG, GIF, PDF, RIFF que no es WebP y archivos cortos', () => {
  assert.equal(detectImageType(Buffer.from('console.log("hola") // server.js')), null);
  assert.equal(detectImageType(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script/></svg>')), null);
  assert.equal(detectImageType(Buffer.from('GIF89a..........')), null);
  assert.equal(detectImageType(Buffer.from('%PDF-1.7........')), null);
  assert.equal(detectImageType(Buffer.from('RIFF....WAVEfmt ')), null);
  assert.equal(detectImageType(Buffer.from([0xff, 0xd8])), null);
  assert.equal(detectImageType('no es un buffer'), null);
});

test('la ruta de subida exige /uploads/<uuid v4>.webp', () => {
  const ok = '/uploads/3f2b8c1e-9a4d-4e7f-b123-0a1b2c3d4e5f.webp';
  assert.ok(isUploadPath(ok));
  assert.equal(imageUrlError(ok), null);
  for (const bad of [
    '/uploads/3f2b8c1e-9a4d-4e7f-b123-0a1b2c3d4e5f.jpg',
    '/uploads/3F2B8C1E-9A4D-4E7F-B123-0A1B2C3D4E5F.webp',
    '/uploads/3f2b8c1e-9a4d-1e7f-b123-0a1b2c3d4e5f.webp', // versión 1
    '/uploads/../server.js',
    '/uploads/../3f2b8c1e-9a4d-4e7f-b123-0a1b2c3d4e5f.webp',
    '/uploads/foto.webp',
    '/uploads/3f2b8c1e-9a4d-4e7f-b123-0a1b2c3d4e5f.webp?x=1',
    'uploads/3f2b8c1e-9a4d-4e7f-b123-0a1b2c3d4e5f.webp',
  ]) {
    assert.equal(isUploadPath(bad), false, bad);
    assert.ok(imageUrlError(bad), bad);
  }
});
