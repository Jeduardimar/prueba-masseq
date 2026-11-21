const test = require('node:test');
const assert = require('node:assert/strict');
const { imageUrlError } = require('../src/image-url');

test('acepta imágenes propias y URL https públicas', () => {
  for (const ok of [
    '/images/volqueta.jpg',
    '/images/cargador.svg',
    'https://upload.wikimedia.org/wikipedia/commons/a/a0/Excavadora.jpg',
    'https://cdn.example.com/fotos/equipo.png?v=2',
    'https://8.8.8.8/foto.jpg',
    'https://172.32.0.1/foto.jpg',
  ]) {
    assert.equal(imageUrlError(ok), null, ok);
  }
});

test('rechaza http, credenciales, URL largas y textos que no son URL', () => {
  assert.match(imageUrlError('http://example.com/a.jpg'), /https:\/\//);
  assert.match(imageUrlError('https://user:clave@example.com/a.jpg'), /usuario/);
  assert.match(imageUrlError('https://user@example.com/a.jpg'), /usuario/);
  assert.match(imageUrlError(`https://example.com/${'a'.repeat(500)}.jpg`), /500/);
  assert.ok(imageUrlError('javascript:alert(1)'));
  assert.ok(imageUrlError('data:image/png;base64,AAAA'));
  assert.ok(imageUrlError('no es una url'));
  assert.ok(imageUrlError('/images/../secreto.jpg'));
});

test('rechaza hosts locales y privados', () => {
  for (const bad of [
    'https://localhost/a.jpg',
    'https://LOCALHOST./a.jpg',
    'https://app.localhost/a.jpg',
    'https://impresora.local/a.jpg',
    'https://127.0.0.1/a.jpg',
    'https://127.8.9.10/a.jpg',
    'https://2130706433/a.jpg', // 127.0.0.1 en decimal
    'https://0x7f000001/a.jpg', // 127.0.0.1 en hexadecimal
    'https://0.0.0.0/a.jpg',
    'https://10.1.2.3/a.jpg',
    'https://172.16.0.1/a.jpg',
    'https://172.31.255.255/a.jpg',
    'https://192.168.1.10/a.jpg',
    'https://169.254.169.254/latest/meta-data',
    'https://[::1]/a.jpg',
    'https://[::ffff:127.0.0.1]/a.jpg',
    'https://[fd00::1]/a.jpg',
    'https://[fe80::1]/a.jpg',
  ]) {
    assert.match(imageUrlError(bad) ?? '', /local|privada/, bad);
  }
});
