/**
 * Descarga los productos de https://fakestoreapi.com y los guarda como datos
 * iniciales en data/seed.json. Luego reinicia data/db.json con esos datos.
 *
 * Uso: npm run seed
 */
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const SEED_FILE = path.join(DATA_DIR, 'seed.json');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const CATEGORY_ES = {
  "men's clothing": 'Ropa hombre',
  "women's clothing": 'Ropa mujer',
  jewelery: 'Joyería',
  electronics: 'Electrónica',
};

(async () => {
  try {
    const res = await fetch('https://fakestoreapi.com/products', {
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const raw = await res.json();

    const products = raw.map((p) => ({
      id: p.id,
      title: p.title,
      price: p.price,
      description: p.description,
      category: CATEGORY_ES[p.category] || p.category,
      image: p.image,
    }));

    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(SEED_FILE, JSON.stringify(products, null, 2), 'utf8');
    fs.writeFileSync(DB_FILE, JSON.stringify(products, null, 2), 'utf8');
    console.log(`✔ ${products.length} productos guardados en data/seed.json y data/db.json`);
  } catch (err) {
    console.error('✘ No se pudo descargar desde fakestoreapi.com:', err.message);
    process.exit(1);
  }
})();
